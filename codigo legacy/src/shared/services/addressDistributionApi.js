/**
 * Bitcoin address distribution API service
 * Abstracts /api/s12/btc-distribution and /api/s13/addresses-richer endpoints
 */

import { fetchJson } from '@/shared/lib/api.js';

const CACHE_MS = 1800000; // 30 min cache (data updates infrequently)
let distributionCache = null;
let richerCache = null;
let cacheTime = 0;

export async function fetchAddressDistribution() {
  const now = Date.now();
  if (distributionCache && now - cacheTime < CACHE_MS) {
    return distributionCache;
  }

  try {
    const data = await fetchJson('/api/s12/btc-distribution', { cache: 'no-store' });
    distributionCache = data;
    cacheTime = now;
    return data;
  } catch (error) {
    console.error('Failed to fetch address distribution:', error);
    if (distributionCache) {
      return distributionCache;
    }
    throw error;
  }
}

export async function fetchAddressesRicher() {
  const now = Date.now();
  if (richerCache && now - cacheTime < CACHE_MS) {
    return richerCache;
  }

  try {
    const data = await fetchJson('/api/s13/addresses-richer', { cache: 'no-store' });
    richerCache = data;
    cacheTime = now;
    return data;
  } catch (error) {
    console.error('Failed to fetch addresses richer:', error);
    if (richerCache) {
      return richerCache;
    }
    throw error;
  }
}

export function resetAddressCache() {
  distributionCache = null;
  richerCache = null;
  cacheTime = 0;
}
