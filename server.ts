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

      const ai = getGenAI();

      // Build multimodal parts for Gemini
      const parts: any[] = [];
      
      // We add instructions explaining what we want to extract
      parts.push({
        text: `Tu es un moteur d'analyse statistique sportive de haut niveau (Analyse Premium).
Analyse les documents d'historique ci-joints (qui peuvent être des images d'écrans, des fichiers texte ou PDF).
Extrais de façon exhaustive et automatique les informations suivantes :
- L'historique complet des matchs
- Les scores et résultats récents
- Les classements et positions des équipes
- Les journées de championnats
- Les statistiques offensives (buts marqués, tirs, possession) et défensives (buts encaissés, clean sheets)

Fais une synthèse statistique de toutes ces données pour construire une base de connaissances en mémoire.
Retourne obligatoirement un objet JSON contenant cette synthèse structurée.
Ne mentionne jamais les mots: Gemini, Grok, ChatGPT, IA, intelligence artificielle.`
      });

      for (const file of files) {
        if (file.isText) {
          parts.push({ text: `Contenu du fichier texte "${file.name}":\n${file.textContent}` });
        } else {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.base64
            }
          });
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Résumé global de la base historique extraite."
              },
              teams: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    attackRating: { type: Type.STRING },
                    defenseRating: { type: Type.STRING },
                    recentResults: { type: Type.ARRAY, items: { type: Type.STRING } },
                    statsSummary: { type: Type.STRING }
                  },
                  required: ["name"]
                }
              },
              cycles: {
                type: Type.STRING,
                description: "Cycles de forme ou tendances détectées."
              }
            },
            required: ["summary", "teams"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Le moteur d'analyse a renvoyé une réponse vide.");
      }

      const parsedData = JSON.parse(text.trim());
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

      const ai = getGenAI();

      // Build parts with history context included in prompt
      const parts: any[] = [];
      
      const historyContextStr = baseStatistique 
        ? JSON.stringify(baseStatistique) 
        : "Aucun historique mémorisé pour cette session.";

      parts.push({
        text: `Tu es un moteur d'analyse de prédiction sportive (Analyse Premium).
Tu as mémorisé la base de statistiques historiques suivante pour cette session :
${historyContextStr}

Analyse maintenant les documents ci-joints contenant les nouveaux matchs à pronostiquer (équipes, horaires, championnats, cotes).
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
      });

      for (const file of files) {
        if (file.isText) {
          parts.push({ text: `Contenu du document de match "${file.name}":\n${file.textContent}` });
        } else {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.base64
            }
          });
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Le moteur d'analyse a renvoyé une réponse vide.");
      }

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
