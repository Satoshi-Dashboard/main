/**
 * Mempool live data service
 * Abstracts /api/public/mempool/live endpoint for real-time trend data
 */

import { fetchJson } from '@/shared/lib/api.js';

const CACHE_MS = 10000; // 10s cache for live mempool data
let mempoolLiveCache = null;
let mempoolLiveCacheTime = 0;

export async function fetchMempoolLive() {
  const now = Date.now();
  if (mempoolLiveCache && now - mempoolLiveCacheTime < CACHE_MS) {
    return mempoolLiveCache;
  }

  try {
    const data = await fetchJson('/api/public/mempool/live', { cache: 'no-store' });
    mempoolLiveCache = data;
    mempoolLiveCacheTime = now;
    return data;
  } catch (error) {
    console.error('Failed to fetch mempool live data:', error);
    // Return cached data if available, even if stale
    if (mempoolLiveCache) {
      return mempoolLiveCache;
    }
    throw error;
  }
}

// Reset cache on demand (useful for forcing refresh)
export function resetMempoolLiveCache() {
  mempoolLiveCache = null;
  mempoolLiveCacheTime = 0;
}
