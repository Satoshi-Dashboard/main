import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheGetJson, cacheSetJson, withCacheLock } from './runtimeCache.js';

const CACHE_FILE = path.resolve(process.cwd(), 'bitnodes_cache.json');
const BITNODES_URL = 'https://bitnodes.io/api/v1/snapshots/latest/?field=sorted_asns';
const UPDATE_HOURS_UTC = [6, 18];
const FETCH_TIMEOUT_MS = 15_000;
const SHARED_CACHE_KEY = 'bitnodes-cache';
const SHARED_LOCK_KEY = 'bitnodes-cache-refresh';

let memoryCache = null;

function aggregateCountryCounts(sortedAsns) {
  const map = new Map();

  if (!Array.isArray(sortedAsns)) return [];

  sortedAsns.forEach((row) => {
    if (!Array.isArray(row) || row.length < 4) return;
    const countryCode = String(row[0] || '').toUpperCase();
    const nodeCount = Number(row[3]);

    if (!countryCode || !Number.isFinite(nodeCount) || nodeCount < 0) return;
    map.set(countryCode, (map.get(countryCode) || 0) + nodeCount);
  });

  return [...map.entries()]
    .map(([country_code, nodes]) => ({ country_code, nodes }))
    .sort((a, b) => b.nodes - a.nodes);
}

export function getNextUpdateDate(fromDate = new Date()) {
  const startMs = fromDate.getTime();
  const y = fromDate.getUTCFullYear();
  const m = fromDate.getUTCMonth();
  const d = fromDate.getUTCDate();

  for (let dayOffset = 0; dayOffset <= 2; dayOffset += 1) {
    for (const hour of UPDATE_HOURS_UTC) {
      const candidate = new Date(Date.UTC(y, m, d + dayOffset, hour, 0, 0, 0));
      if (candidate.getTime() > startMs) return candidate;
    }
  }

  return new Date(Date.UTC(y, m, d + 1, UPDATE_HOURS_UTC[0], 0, 0, 0));
}

export async function readBitnodesCache() {
  if (memoryCache && typeof memoryCache === 'object') {
    return memoryCache;
  }

  try {
    const text = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function parseIsoDate(value) {
  const date = new Date(String(value || ''));
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function isCacheReady(cache) {
  return Boolean(cache && typeof cache === 'object' && cache.data);
}

export function isBitnodesCacheStale(cache, now = new Date()) {
  if (!isCacheReady(cache)) return true;
  const nextUpdate = parseIsoDate(cache.next_update);
  if (!nextUpdate) return true;
  return now.getTime() >= nextUpdate.getTime();
}

function getPayloadTtlSeconds(payload, now = Date.now()) {
  const nextUpdate = parseIsoDate(payload?.next_update);
  if (!nextUpdate) return 60;

  const ttlMs = Math.max(60_000, nextUpdate.getTime() - now);
  return Math.max(60, Math.floor(ttlMs / 1000));
}

export function pendingResponse(fromDate = new Date()) {
  return {
    status: 'pending',
    message: 'Data not yet available',
    next_update: getNextUpdateDate(fromDate).toISOString(),
  };
}

export async function refreshBitnodesCache() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const res = await fetch(BITNODES_URL, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout);
  });

  if (!res.ok) {
    throw new Error(`Bitnodes request failed with HTTP ${res.status}`);
  }

  const bitnodesData = await res.json();
  const now = new Date();
  const countryCounts = aggregateCountryCounts(bitnodesData?.sorted_asns);

  const payload = {
    last_updated: now.toISOString(),
    next_update: getNextUpdateDate(now).toISOString(),
    country_counts: countryCounts,
    data: bitnodesData,
  };

  memoryCache = payload;

  try {
    await writeFile(CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch {
    /* keep runtime payload even if filesystem is not writable */
  }

  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: getPayloadTtlSeconds(payload) });

  return payload;
}

export async function getBitnodesPayload() {
  let existing = memoryCache;

  if (!existing) {
    const shared = await cacheGetJson(SHARED_CACHE_KEY);
    if (shared && typeof shared === 'object') {
      memoryCache = shared;
      existing = shared;
    }
  }

  if (!existing) {
    existing = await readBitnodesCache();
  }

  if (isCacheReady(existing) && !isBitnodesCacheStale(existing)) {
    return existing;
  }

  let refreshed = null;
  try {
    refreshed = await withCacheLock(
      SHARED_LOCK_KEY,
      async () => refreshBitnodesCache(),
      { ttlSeconds: 20, waitMs: 3500, pollMs: 120 },
    );
  } catch {
    refreshed = null;
  }

  if (isCacheReady(refreshed)) {
    return refreshed;
  }

  try {
    const shared = await cacheGetJson(SHARED_CACHE_KEY);
    if (isCacheReady(shared) && !isBitnodesCacheStale(shared)) {
      memoryCache = shared;
      return shared;
    }

    return await refreshBitnodesCache();
  } catch {
    if (isCacheReady(existing)) return existing;
    return null;
  }
}
