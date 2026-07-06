/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Lazy initialize Gemini client to prevent crash if key is missing on start
let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in Settings > Secrets.");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

// Helper to perform OCR/Extraction from images and PDF files
async function getOcrText(file: { name: string; mimeType: string; base64?: string; isText: boolean; textContent?: string }): Promise<string> {
  if (file.isText) {
    return file.textContent || "";
  }

  if (!file.base64) {
    return "";
  }

  // Attempt using Native Google Gemini API first if configured
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`[OCR] Executing native Gemini OCR for: ${file.name}`);
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: file.mimeType,
              data: file.base64
            }
          },
          "Extract all matches, schedules, scores, odds, teams, stats, tables, and text content from this document/image exhaustively. Be precise."
        ]
      });
      if (response.text) {
        console.log(`[OCR] Native Gemini OCR success for: ${file.name}`);
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[OCR] Native Gemini OCR failed, falling back to OpenRouter:`, err.message || err);
    }
  }

  // Otherwise fallback to OpenRouter (using a vision-capable model: google/gemini-2.5-flash)
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) {
    throw new Error("Pour analyser des images/PDF, veuillez configurer OPENROUTER_API_KEY ou GEMINI_API_KEY.");
  }

  console.log(`[OCR] Executing OpenRouter google/gemini-2.5-flash OCR for: ${file.name}`);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openrouterApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all matches, schedules, scores, odds, teams, stats, tables, and text content from this document/image exhaustively. Be precise."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.mimeType};base64,${file.base64}`
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter OCR failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const ocrText = result.choices?.[0]?.message?.content;
  if (!ocrText) {
    throw new Error("L'OCR via OpenRouter n'a renvoyé aucun texte.");
  }

  console.log(`[OCR] OpenRouter OCR success for: ${file.name}`);
  return ocrText;
}

// Standard OpenRouter query helper with Fallback models
async function queryOpenRouterWithFallback(messages: any[], jsonMode: boolean = false): Promise<string> {
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) {
    throw new Error("Le paramètre OPENROUTER_API_KEY n'est pas configuré dans les variables d'environnement (Settings > Secrets).");
  }

  const modelQueue = [
    "deepseek/deepseek-chat-v3",
    "deepseek/deepseek-chat",
    "qwen/qwen3-235b-a22b",
    "qwen/qwen-2.5-72b-instruct",
    "google/gemini-2.5-flash"
  ];

  let lastError: any = null;

  for (const model of modelQueue) {
    try {
      console.log(`[OpenRouter] Sending request to model: ${model}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

      const headers: any = {
        "Authorization": `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json"
      };

      const payload: any = {
        model,
        messages,
        temperature: 0.2
      };

      if (jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Status ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Le modèle a retourné une réponse vide.");
      }

      console.log(`[OpenRouter] Successfully got response from: ${model}`);
      return content;
    } catch (err: any) {
      console.warn(`[OpenRouter] Model ${model} failed:`, err.message || err);
      lastError = err;
      // Continue to next model
    }
  }

  throw new Error(`Tous les modèles d'analyse OpenRouter ont échoué. Dernière erreur: ${lastError?.message || lastError}`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set high body limits to allow up to 20 images of 20MB
  app.use(express.json({ limit: "150mb" }));
  app.use(express.urlencoded({ limit: "150mb", extended: true }));

  // API Route: Analyze history
  app.post("/api/analyse-premium/historique", async (req, res) => {
    try {
      const { files } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier d'historique n'a été fourni." });
      }

      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "L'API Key OPENROUTER_API_KEY n'est pas configurée dans les variables d'environnement (Settings > Secrets)." });
      }

      console.log(`[Historique] Processing ${files.length} files...`);

      // 1. OCR Step: Transform all input files to text representations
      const textRepresentations: string[] = [];
      for (const file of files) {
        const text = await getOcrText(file);
        textRepresentations.push(`--- CONTENU DU FICHIER: ${file.name} ---\n${text}`);
      }

      const compiledText = textRepresentations.join("\n\n");

      // 2. IA analysis with OpenRouter
      const messages = [
        {
          role: "user",
          content: `Tu es un moteur d'analyse statistique sportive de haut niveau (Analyse Premium).
Analyse les données d'historique extraites ci-dessous :

${compiledText}

Extrais de façon exhaustive et automatique les informations suivantes :
- L'historique complet des matchs
- Les scores et résultats récents
- Les classements et positions des équipes
- Les journées de championnats
- Les statistiques offensives (buts marqués, tirs, possession) et défensives (buts encaissés, clean sheets)

Fais une synthèse statistique de toutes ces données pour construire une base de connaissances en mémoire.
Retourne obligatoirement un objet JSON contenant cette synthèse structurée.
Ne mentionne jamais les mots: Gemini, Grok, ChatGPT, IA, intelligence artificielle.

Le JSON retourné doit correspondre STRICTEMENT au schéma suivant, sans bloc de code markdown, juste le JSON brut :
{
  "summary": "Résumé global de la base historique extraite.",
  "teams": [
    {
      "name": "Nom de l'équipe",
      "attackRating": "Evaluation offensive",
      "defenseRating": "Evaluation défensive",
      "recentResults": ["Resultat 1", "Resultat 2"],
      "statsSummary": "Synthèse des statistiques"
    }
  ],
  "cycles": "Cycles de forme ou tendances détectées."
}`
        }
      ];

      const text = await queryOpenRouterWithFallback(messages, true);
      
      // Clean possible Markdown wrappers
      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "");
      }
      cleanText = cleanText.trim();

      const parsedData = JSON.parse(cleanText);
      res.json({ success: true, baseStatistique: parsedData });
    } catch (error: any) {
      console.error("Erreur historique:", error);
      res.status(500).json({ error: error.message || "Erreur interne du moteur d'analyse." });
    }
  });

  // API Route: Analyze Matches with history context
  app.post("/api/analyse-premium/analyse", async (req, res) => {
    try {
      const { files, baseStatistique } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier de match n'a été fourni." });
      }

      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "L'API Key OPENROUTER_API_KEY n'est pas configurée dans les variables d'environnement (Settings > Secrets)." });
      }

      console.log(`[Analyse] Processing ${files.length} match files...`);

      // 1. OCR Step: Transform all input match files to text representations
      const textRepresentations: string[] = [];
      for (const file of files) {
        const text = await getOcrText(file);
        textRepresentations.push(`--- CONTENU DU DOCUMENT DE MATCH: ${file.name} ---\n${text}`);
      }

      const compiledText = textRepresentations.join("\n\n");

      const historyContextStr = baseStatistique 
        ? JSON.stringify(baseStatistique) 
        : "Aucun historique mémorisé pour cette session.";

      // 2. IA predictions with OpenRouter
      const messages = [
        {
          role: "user",
          content: `Tu es un moteur d'analyse de prédiction sportive (Analyse Premium).
Tu as mémorisé la base de statistiques historiques suivante pour cette session :
${historyContextStr}

Analyse maintenant les documents de match ci-dessous :

${compiledText}

Compare ces matchs avec la base de statistiques historiques ci-dessus.
Applique la logique interne en trois étapes :
1. Analyse des trajectoires de forme et des cycles offensifs/défensifs.
2. Calcul des scores exacts les plus cohérents.
3. Validation finale de la cohérence.

CRITICAL FORMAT INSTRUCTION:
Génère tes prédictions de match en respectant STRICTEMENT le format suivant pour chaque match détecté, et RIEN D'AUTRE :
Equipe A vs Equipe B : [Pronostic 1, X ou 2] ([Score exact, ex: 2-0])

Exemples de lignes valides :
Manchester United vs Chelsea : 1 (2-0)
Arsenal vs Liverpool : X (1-1)
Real Madrid vs Barcelona : 2 (1-3)

RÈGLES ABSOLUES :
- Affiche UNIQUEMENT une seule ligne par match.
- Aucun autre texte, aucun commentaire, aucune explication, aucun pourcentage, aucune introduction ni conclusion.
- Ne mentionne jamais les mots : Gemini, Grok, ChatGPT, IA, intelligence artificielle.`
        }
      ];

      const text = await queryOpenRouterWithFallback(messages, false);

      // Clean lines to keep only match lines
      const lines = text.split("\n")
        .map(line => line.trim())
        .filter(line => line && line.includes(" vs ") && line.includes(":"));

      res.json({ success: true, predictions: lines });
    } catch (error: any) {
      console.error("Erreur analyse:", error);
      res.status(500).json({ error: error.message || "Erreur interne du moteur d'analyse." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Analyse Premium Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
