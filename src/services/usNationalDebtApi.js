import { fetchJson } from '../lib/api.js';

const CACHE_MS = 30_000;

let memoryCache = {
  expiresAt: 0,
  value: null,
};

function readCache(now = Date.now()) {
  if (memoryCache.value && now < memoryCache.expiresAt) {
    return memoryCache.value;
  }
  return null;
}

function writeCache(payload, now = Date.now()) {
  memoryCache = {
    expiresAt: now + CACHE_MS,
    value: payload,
  };
  return payload;
}

export async function fetchUsNationalDebtPayload({ force = false } = {}) {
  const now = Date.now();
  if (!force) {
    const cached = readCache(now);
    if (cached) return cached;
  }

  const payload = await fetchJson('/api/public/us-national-debt', { timeout: 10_000 });
  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('U.S. national debt payload is unavailable');
  }

  return writeCache(payload, now);
}
