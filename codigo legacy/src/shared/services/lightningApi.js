/**
 * Lightning Network API service
 * Abstracts /api/public/lightning/* endpoints
 */

import { fetchJson } from '@/shared/lib/api.js';

const CACHE_MS = 60000; // 60s cache for lightning data
let lightningCache = null;
let lightningCacheTime = 0;

export async function fetchLightningWorld() {
  const now = Date.now();
  if (lightningCache && now - lightningCacheTime < CACHE_MS) {
    return lightningCache;
  }

  try {
    const data = await fetchJson('/api/public/lightning/world', { cache: 'no-store' });
    lightningCache = data;
    lightningCacheTime = now;
    return data;
  } catch (error) {
    console.error('Failed to fetch lightning world data:', error);
    // Return cached data if available, even if stale
    if (lightningCache) {
      return lightningCache;
    }
    throw error;
  }
}

export async function fetchLightningLive() {
  return fetchJson('/api/public/lightning/live', { cache: 'no-store' });
}
