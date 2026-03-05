import { refreshBitnodesCache } from './bitnodesCache.js';

try {
  const payload = await refreshBitnodesCache();
  console.log(`[bitnodes] cache refreshed at ${payload.last_updated}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[bitnodes] manual refresh failed: ${message}`);
}
