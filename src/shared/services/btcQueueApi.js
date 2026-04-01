import { fetchJson } from '@/shared/lib/api.js';

const VALID_RANGES = new Set(['24h', '30d', 'all']);
const DEDUP_WINDOW_MS = 2_000;
const RANGE_TTL_MS = {
  '24h': 60_000,
  '30d': 15 * 60_000,
  all: 6 * 60 * 60_000,
};

const inflightByRange = new Map();
const inflightAtByRange = new Map();
const cacheByRange = new Map();
const bootstrapInflightByRange = new Map();
const bootstrapInflightAtByRange = new Map();
const bootstrapCacheByRange = new Map();

function normalizeRange(range) {
  const normalized = String(range || '24h').toLowerCase();
  return VALID_RANGES.has(normalized) ? normalized : '24h';
}

function getPayloadFreshUntil(payload, range) {
  const nextUpdateAtMs = Date.parse(String(payload?.next_update_at || ''));
  if (Number.isFinite(nextUpdateAtMs)) {
    return nextUpdateAtMs;
  }

  return Date.now() + (RANGE_TTL_MS[range] || RANGE_TTL_MS['24h']);
}

function getCachedPayload(range) {
  const cached = cacheByRange.get(range);
  if (!cached) return null;
  if (Date.now() < cached.freshUntil) return cached.payload;
  return cached.payload;
}

function setCachedPayload(range, payload) {
  cacheByRange.set(range, {
    payload,
    freshUntil: getPayloadFreshUntil(payload, range),
  });
  return payload;
}

function getCachedBootstrap(range) {
  const cached = bootstrapCacheByRange.get(range);
  if (!cached) return null;
  if (Date.now() < cached.freshUntil) return cached.payload;
  return cached.payload;
}

function setCachedBootstrap(range, payload) {
  bootstrapCacheByRange.set(range, {
    payload,
    freshUntil: getPayloadFreshUntil(payload, range),
  });
  return payload;
}

async function requestBtcQueuePayload(range, { timeout = 10_000, cache = 'no-store' } = {}) {
  const payload = await fetchJson(`/api/public/mempool/btc-queue?range=${range}`, { timeout, cache });
  return setCachedPayload(range, payload);
}

async function requestBtcQueueBootstrapPayload(range, { timeout = 6_000, cache = 'default' } = {}) {
  const payload = await fetchJson(`/api/public/mempool/btc-queue/bootstrap?range=${range}`, { timeout, cache });
  return setCachedBootstrap(range, payload);
}

export async function fetchBtcQueuePayload(range = '24h', options = {}) {
  const normalizedRange = normalizeRange(range);
  const now = Date.now();
  const inflight = inflightByRange.get(normalizedRange);
  const inflightAt = inflightAtByRange.get(normalizedRange) || 0;
  const cached = cacheByRange.get(normalizedRange);

  if (cached && now < cached.freshUntil) {
    return cached.payload;
  }

  if (inflight && now - inflightAt < DEDUP_WINDOW_MS) {
    return inflight;
  }

  const request = requestBtcQueuePayload(normalizedRange, options)
    .catch((error) => {
      const stale = getCachedPayload(normalizedRange);
      if (stale) return stale;
      throw error;
    })
    .finally(() => {
      inflightByRange.delete(normalizedRange);
      inflightAtByRange.delete(normalizedRange);
    });

  inflightByRange.set(normalizedRange, request);
  inflightAtByRange.set(normalizedRange, now);

  return request;
}

export async function fetchBtcQueueBootstrapPayload(range = '24h', options = {}) {
  const normalizedRange = normalizeRange(range);
  const now = Date.now();
  const inflight = bootstrapInflightByRange.get(normalizedRange);
  const inflightAt = bootstrapInflightAtByRange.get(normalizedRange) || 0;
  const cached = bootstrapCacheByRange.get(normalizedRange);

  if (cached && now < cached.freshUntil) {
    return cached.payload;
  }

  if (inflight && now - inflightAt < DEDUP_WINDOW_MS) {
    return inflight;
  }

  const request = requestBtcQueueBootstrapPayload(normalizedRange, options)
    .catch((error) => {
      const stale = getCachedBootstrap(normalizedRange);
      if (stale) return stale;
      throw error;
    })
    .finally(() => {
      bootstrapInflightByRange.delete(normalizedRange);
      bootstrapInflightAtByRange.delete(normalizedRange);
    });

  bootstrapInflightByRange.set(normalizedRange, request);
  bootstrapInflightAtByRange.set(normalizedRange, now);

  return request;
}

export function prefetchBtcQueuePayload(range, options = {}) {
  return fetchBtcQueuePayload(range, options).catch(() => null);
}

export function prefetchBtcQueueBootstrapPayload(range, options = {}) {
  return fetchBtcQueueBootstrapPayload(range, options).catch(() => null);
}

export async function fetchJohoeHistory(range = '24h', options = {}) {
  return fetchBtcQueuePayload(range, options).then((payload) => payload?.data || null);
}
