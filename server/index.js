import express from 'express';
import cron from 'node-cron';
import { pendingResponse, readBitnodesCache, refreshBitnodesCache } from './bitnodesCache.js';

const app = express();
const PORT = Number(process.env.API_PORT || 8787);
const SCHEDULE = '0 6,18 * * *';

app.get('/api/bitnodes/cache', async (_req, res) => {
  const cache = await readBitnodesCache();

  if (!cache || !cache.data) {
    res.json(pendingResponse());
    return;
  }

  res.json(cache);
});

app.get('/api/bitnodes/cache/status', async (_req, res) => {
  const cache = await readBitnodesCache();
  if (!cache || !cache.data) {
    res.json(pendingResponse());
    return;
  }

  res.json({
    status: 'ready',
    last_updated: cache.last_updated,
    next_update: cache.next_update,
  });
});

cron.schedule(
  SCHEDULE,
  async () => {
    try {
      const payload = await refreshBitnodesCache();
      console.log(`[bitnodes] cache refreshed at ${payload.last_updated}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[bitnodes] scheduled refresh failed: ${message}`);
    }
  },
  { timezone: 'UTC' },
);

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log('[bitnodes] scheduler active at 06:00 and 18:00 UTC');
});
