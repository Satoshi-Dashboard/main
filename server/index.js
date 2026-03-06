import { createApp } from './app.js';

const PORT = Number(process.env.API_PORT || 8787);

const app = createApp();

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log('[api] request-time refresh mode enabled');
  console.log('[api] refresh endpoints can be protected with REFRESH_API_TOKEN');
});
