/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Lazy initialize Gemini client to prevent crash if key is missing on start
let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Gemini Client Error] GEMINI_API_KEY environment variable is not configured in Settings > Secrets.");
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    console.log("[Gemini Client] Initializing GoogleGenAI client with AI Studio user-agent...");
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

// Mutable lists of active models for fallback and recovery
let activeOcrModels = [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.2-11b-vision-instruct",
  "google/gemini-2.5-pro"
];

let activeTextModels = [
  "deepseek/deepseek-chat",
  "qwen/qwen-2.5-72b-instruct",
  "google/gemini-2.5-flash"
];

let lastModelCheckTime = 0;
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes to throttle verification requests

async function verifyModelsWithOpenRouter() {
  const now = Date.now();
  if (now - lastModelCheckTime < CHECK_INTERVAL_MS) {
    return; // Use locally cached lists
  }

  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) return;

  try {
    console.log("[OpenRouter] Pre-verifying model availability with OpenRouter API...");
    const response = await fetch("https://openrouter.ai/api/v1/models");
    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.data)) {
        const availableIds = new Set(json.data.map((m: any) => m.id));

        // Filter active OCR models if at least one remains valid
        const originalOcr = [...activeOcrModels];
        const filteredOcr = activeOcrModels.filter(m => availableIds.has(m));
        if (filteredOcr.length > 0) {
          activeOcrModels = filteredOcr;
        }
        if (activeOcrModels.length !== originalOcr.length) {
          console.warn(`[OpenRouter] Pre-validation removed unavailable OCR models. Remaining:`, activeOcrModels);
        }

        // Filter active text models if at least one remains valid
        const originalText = [...activeTextModels];
        const filteredText = activeTextModels.filter(m => availableIds.has(m));
        if (filteredText.length > 0) {
          activeTextModels = filteredText;
        }
        if (activeTextModels.length !== originalText.length) {
          console.warn(`[OpenRouter] Pre-validation removed unavailable text models. Remaining:`, activeTextModels);
        }

        lastModelCheckTime = now;
      }
    }
  } catch (err) {
    console.warn("[OpenRouter] Failed to pre-verify models list, relying on runtime 404 detection:", err);
  }
}

// Helper to perform OCR/Extraction from images and PDF files
async function getOcrText(file: { name: string; mimeType: string; base64?: string; isText: boolean; textContent?: string }): Promise<string> {
  if (file.isText) {
    return file.textContent || "";
  }

  if (!file.base64) {
    console.error(`[OCR Error] Base64 content is empty for file: ${file.name}`);
    return "";
  }

  // Clean base64 input (remove any data URL prefixes)
  let base64Data = file.base64;
  if (base64Data.includes(",")) {
    base64Data = base64Data.split(",")[1];
  }

  const mimeType = file.mimeType || "image/jpeg";
  console.log(`[OCR Start] File: ${file.name}, MIME Type: ${mimeType}, Size: ${base64Data.length} chars`);

  // Attempt using Native Google Gemini API first if configured
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`[OCR] Executing native Gemini OCR for: ${file.name} (using gemini-3.5-flash)`);
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: "Extract all matches, schedules, scores, odds, teams, stats, tables, and text content from this document/image exhaustively. Be precise."
            }
          ]
        }
      });
      if (response.text) {
        console.log(`[OCR] Native Gemini OCR success for: ${file.name}`);
        return response.text;
      } else {
        throw new Error("La réponse de l'OCR natif Gemini est vide.");
      }
    } catch (err: any) {
      console.error(`[OCR Error] Native Gemini OCR failed for ${file.name}. Details:`, err.stack || err.message || err);
      console.warn("[OCR] Falling back to OpenRouter vision models...");
    }
  } else {
    console.warn("[OCR] GEMINI_API_KEY is not configured. Skipping native Gemini OCR, attempting OpenRouter...");
  }

  // Otherwise fallback to OpenRouter (using a vision-capable model queue)
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterApiKey) {
    console.error("[OCR Error] Neither GEMINI_API_KEY nor OPENROUTER_API_KEY are configured in environment variables.");
    throw new Error("Clé API manquante : Veuillez configurer GEMINI_API_KEY ou OPENROUTER_API_KEY dans vos variables d'environnement.");
  }

  // Check which models are available on OpenRouter before making the call
  await verifyModelsWithOpenRouter();

  const ocrModelQueue = [...activeOcrModels];
  let lastOcrError: any = null;

  for (const model of ocrModelQueue) {
    // Skip if dynamically removed during this request or prior requests
    if (!activeOcrModels.includes(model)) {
      console.log(`[OCR OpenRouter] Skipping model ${model} (marked as unavailable/404).`);
      continue;
    }

    try {
      console.log(`[OCR OpenRouter] Executing with model: ${model} for: ${file.name}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          max_tokens: 2500,
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
                    url: `data:${mimeType};base64,${base64Data}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const status = response.status;
        
        // Handle 404 or missing endpoints by removing them immediately from the queue
        if (status === 404 || errorText.includes("not found") || errorText.includes("No endpoint found") || errorText.includes("404")) {
          console.warn(`[OCR OpenRouter] Model ${model} returned 404 or endpoint not found. Permanently removing from activeOcrModels.`);
          activeOcrModels = activeOcrModels.filter(m => m !== model);
        }

        throw new Error(`Model ${model} failed with status ${status}: ${errorText}`);
      }

      const result = await response.json();
      const ocrText = result.choices?.[0]?.message?.content;
      if (!ocrText) {
        throw new Error(`Model ${model} returned empty content.`);
      }

      console.log(`[OCR OpenRouter] OCR success with model ${model} for: ${file.name}`);
      return ocrText;
    } catch (err: any) {
      const errMsg = err.message || "";
      if (errMsg.includes("404") || errMsg.includes("not found") || errMsg.includes("No endpoint found")) {
        console.warn(`[OCR OpenRouter Exception] Model ${model} triggered 404. Permanently removing from activeOcrModels.`);
        activeOcrModels = activeOcrModels.filter(m => m !== model);
      }
      console.error(`[OCR OpenRouter Error] Model ${model} failed for ${file.name}:`, err.stack || err.message || err);
      lastOcrError = err;
    }
  }

  throw new Error(`Tous les modèles d'analyse d'image ont échoué. Dernière erreur: ${lastOcrError?.message || lastOcrError}`);
}

// Universal AI query helper with Gemini and OpenRouter Fallbacks
async function queryIAWithFallback(messages: any[], jsonMode: boolean = false): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!geminiApiKey && !openrouterApiKey) {
    console.error("[IA Query Error] No API key configured (neither GEMINI_API_KEY nor OPENROUTER_API_KEY).");
    throw new Error("Clé API manquante : Veuillez configurer GEMINI_API_KEY ou OPENROUTER_API_KEY dans vos variables d'environnement.");
  }

  // 1. Try Google Gemini Native first if configured (extremely fast, stable and free)
  if (geminiApiKey) {
    try {
      console.log(`[IA Query] Attempting native Gemini API (gemini-3.5-flash)...`);
      const ai = getGenAI();
      
      let contents: any[] = [];
      let systemInstruction = "";

      for (const msg of messages) {
        if (msg.role === "system") {
          systemInstruction += msg.content + "\n";
        } else {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      }

      if (contents.length === 0) {
        contents = [{ role: "user", parts: [{ text: "Analyse" }] }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemInstruction || undefined,
          responseMimeType: jsonMode ? "application/json" : "text/plain",
          temperature: 0.2
        }
      });

      if (response.text) {
        console.log(`[IA Query] Native Gemini API success!`);
        return response.text;
      } else {
        throw new Error("Native Gemini API returned empty content.");
      }
    } catch (err: any) {
      console.error(`[IA Query Error] Native Gemini API failed. Error:`, err.stack || err.message || err);
      if (!openrouterApiKey) {
        throw new Error(`L'analyse native Gemini a échoué et aucune clé OpenRouter n'est configurée. Détails : ${err.message || err}`);
      }
      console.warn("[IA Query] Falling back to OpenRouter text models...");
    }
  }

  // 2. Fallback to OpenRouter if configured
  if (openrouterApiKey) {
    // Check which models are available on OpenRouter before making the call
    await verifyModelsWithOpenRouter();

    const modelQueue = [...activeTextModels];
    let lastError: any = null;

    for (const model of modelQueue) {
      if (!activeTextModels.includes(model)) {
        console.log(`[IA Query - OpenRouter] Skipping model ${model} (marked as unavailable/404).`);
        continue;
      }

      try {
        console.log(`[IA Query - OpenRouter] Sending request to model: ${model}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

        const headers: any = {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json"
        };

        const payload: any = {
          model,
          messages,
          temperature: 0.2,
          max_tokens: 3000
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
          const status = res.status;

          if (status === 404 || errorText.includes("not found") || errorText.includes("No endpoint found") || errorText.includes("404")) {
            console.warn(`[IA Query - OpenRouter] Model ${model} returned 404 or endpoint not found. Permanently removing from activeTextModels.`);
            activeTextModels = activeTextModels.filter(m => m !== model);
          }

          throw new Error(`Status ${status}: ${errorText}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("Le modèle a retourné une réponse de contenu vide.");
        }

        console.log(`[IA Query - OpenRouter] Successfully got response from: ${model}`);
        return content;
      } catch (err: any) {
        const errMsg = err.message || "";
        if (errMsg.includes("404") || errMsg.includes("not found") || errMsg.includes("No endpoint found")) {
          console.warn(`[IA Query - OpenRouter Exception] Model ${model} triggered 404. Permanently removing from activeTextModels.`);
          activeTextModels = activeTextModels.filter(m => m !== model);
        }
        console.error(`[IA Query - OpenRouter Error] Model ${model} failed:`, err.stack || err.message || err);
        lastError = err;
      }
    }

    throw new Error(`Tous les modèles d'analyse OpenRouter ont échoué. Dernière erreur: ${lastError?.message || lastError}`);
  }

  throw new Error("Impossible de traiter l'analyse. Veuillez configurer vos clés API.");
}

const app = express();

// Set high body limits to allow up to 20 images of 20MB
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// API Route: Perform OCR on a single file (extremely useful on Vercel to bypass timeout & payload limits)
app.post("/api/analyse-premium/ocr", async (req, res) => {
  try {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ error: "Aucun fichier n'a été fourni." });
    }

    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "L'API Key OPENROUTER_API_KEY ou GEMINI_API_KEY n'est pas configurée dans les variables d'environnement." });
    }

    console.log(`[OCR Single] Extracting text for file: ${file.name}`);
    const text = await getOcrText(file);
    res.json({ success: true, text });
  } catch (error: any) {
    console.error("[OCR Single] Erreur:", error);
    res.status(500).json({ error: error.message || "Erreur lors de l'OCR du fichier." });
  }
});

// API Route: Analyze history (supports pre-compiled text or fallback to files)
app.post("/api/analyse-premium/historique", async (req, res) => {
  try {
    let compiledText = "";

    if (req.body.compiledText) {
      compiledText = req.body.compiledText;
    } else {
      const { files } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier d'historique n'a été fourni." });
      }

      console.log(`[Historique] Processing ${files.length} files...`);

      // OCR Step fallback (for non-chunked or local compatibility)
      const textRepresentations: string[] = [];
      for (const file of files) {
        const text = await getOcrText(file);
        textRepresentations.push(`--- CONTENU DU FICHIER: ${file.name} ---\n${text}`);
      }
      compiledText = textRepresentations.join("\n\n");
    }

    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      console.error("[Historique API Error] Neither GEMINI_API_KEY nor OPENROUTER_API_KEY are configured.");
      return res.status(500).json({ error: "Clé API manquante : Veuillez configurer GEMINI_API_KEY ou OPENROUTER_API_KEY dans vos variables d'environnement." });
    }

    // 2. IA analysis with universal query helper
    const messages = [
      {
        role: "system",
        content: "Tu es un moteur d'analyse statistique sportive de haut niveau (Analyse Premium)."
      },
      {
        role: "user",
        content: `Analyse les données d'historique extraites ci-dessous :

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

    const text = await queryIAWithFallback(messages, true);
    
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
    const { baseStatistique } = req.body;
    let compiledText = "";

    if (req.body.compiledText) {
      compiledText = req.body.compiledText;
    } else {
      const { files } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier de match n'a été fourni." });
      }

      console.log(`[Analyse] Processing ${files.length} match files...`);

      // OCR Step fallback
      const textRepresentations: string[] = [];
      for (const file of files) {
        const text = await getOcrText(file);
        textRepresentations.push(`--- CONTENU DU DOCUMENT DE MATCH: ${file.name} ---\n${text}`);
      }
      compiledText = textRepresentations.join("\n\n");
    }

    if (!process.env.OPENROUTER_API_KEY && !process.env.GEMINI_API_KEY) {
      console.error("[Analyse API Error] Neither GEMINI_API_KEY nor OPENROUTER_API_KEY are configured.");
      return res.status(500).json({ error: "Clé API manquante : Veuillez configurer GEMINI_API_KEY ou OPENROUTER_API_KEY dans vos variables d'environnement." });
    }

    const historyContextStr = baseStatistique 
      ? JSON.stringify(baseStatistique) 
      : "Aucun historique mémorisé pour cette session.";

    // 2. IA predictions with universal query helper
    const messages = [
      {
        role: "system",
        content: "Tu es un moteur d'analyse de prédiction sportive (Analyse Premium)."
      },
      {
        role: "user",
        content: `Tu as mémorisé la base de statistiques historiques suivante pour cette session :
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

    const text = await queryIAWithFallback(messages, false);

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

export default app;
