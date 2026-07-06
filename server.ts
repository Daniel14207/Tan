/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import app from "./api/index";

// Load environment variables
dotenv.config();

const PORT = 3000;

async function startServer() {
  if (process.env.VERCEL) {
    console.log("[Analyse Premium Server] Running in Serverless/Vercel environment");
    return;
  }

  // Vite middleware setup (only in non-Vercel environment)
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

export default app;
