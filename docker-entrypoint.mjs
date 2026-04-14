import { createApp } from './server/app.js';
import express from 'express';
import path from 'path';

const PORT  = Number(process.env.API_PORT || 8787);
const HOST  = process.env.API_HOST || '0.0.0.0';

const app = createApp();

/* ── Serve Vite build when running inside Docker / Umbrel ────────── */
if (process.env.SERVE_STATIC === 'true') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath, { maxAge: '1h' }));
  // SPA catch-all: anything that is NOT an /api route gets index.html
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('[docker] serving static frontend from dist/');
}

app.listen(PORT, HOST, () => {
  console.log(`[api] listening on http://${HOST}:${PORT}`);
});
