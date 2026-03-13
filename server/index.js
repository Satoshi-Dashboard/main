import { createApp } from './app.js';

const PORT = Number(process.env.API_PORT || 8787);
const HOST = process.env.API_HOST || '0.0.0.0';

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`[api] listening on http://${HOST}:${PORT}`);
  console.log('[api] request-time refresh mode enabled');
  console.log('[api] refresh endpoints require REFRESH_API_TOKEN outside localhost');
});
