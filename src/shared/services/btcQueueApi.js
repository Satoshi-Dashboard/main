import { fetchJson } from '@/shared/lib/api.js';

const DEDUP_WINDOW_MS = 2_000;
const BTC_QUEUE_RANGE = '24h';
const RANGE_TTL_MS = 60_000;

let inflightPayload = null;
let inflightPayloadAt = 0;
let cachedPayload = null;
let inflightBootstrap = null;
let inflightBootstrapAt = 0;
let cachedBootstrap = null;

function getPayloadFreshUntil(payload) {
  const nextUpdateAtMs = Date.parse(String(payload?.next_update_at || ''));
  if (Number.isFinite(nextUpdateAtMs)) {
    return nextUpdateAtMs;
  }

  return Date.now() + RANGE_TTL_MS;
}

function getCachedPayload() {
  if (!cachedPayload) return null;
  if (Date.now() < cachedPayload.freshUntil) return cachedPayload.payload;
  return cachedPayload.payload;
}

function setCachedPayload(payload) {
  cachedPayload = {
    payload,
    freshUntil: getPayloadFreshUntil(payload),
  };
  return payload;
}

function getCachedBootstrap() {
  if (!cachedBootstrap) return null;
  if (Date.now() < cachedBootstrap.freshUntil) return cachedBootstrap.payload;
  return cachedBootstrap.payload;
}

function setCachedBootstrap(payload) {
  cachedBootstrap = {
    payload,
    freshUntil: getPayloadFreshUntil(payload),
  };
  return payload;
}

async function requestBtcQueuePayload({ timeout = 10_000, cache = 'no-store' } = {}) {
  const payload = await fetchJson('/api/public/mempool/btc-queue', { timeout, cache });
  return setCachedPayload(payload);
}

async function requestBtcQueueBootstrapPayload({ timeout = 6_000, cache = 'default' } = {}) {
  const payload = await fetchJson('/api/public/mempool/btc-queue/bootstrap', { timeout, cache });
  return setCachedBootstrap(payload);
}

export async function fetchBtcQueuePayload(options = {}) {
  const now = Date.now();
  const inflight = inflightPayload;
  const inflightAt = inflightPayloadAt;
  const cached = cachedPayload;

  if (cached && now < cached.freshUntil) {
    return cached.payload;
  }

  if (inflight && now - inflightAt < DEDUP_WINDOW_MS) {
    return inflight;
  }

  const request = requestBtcQueuePayload(options)
    .catch((error) => {
      const stale = getCachedPayload();
      if (stale) return stale;
      throw error;
    })
    .finally(() => {
      inflightPayload = null;
      inflightPayloadAt = 0;
    });

  inflightPayload = request;
  inflightPayloadAt = now;

  return request;
}

export async function fetchBtcQueueBootstrapPayload(options = {}) {
  const now = Date.now();
  const inflight = inflightBootstrap;
  const inflightAt = inflightBootstrapAt;
  const cached = cachedBootstrap;

  if (cached && now < cached.freshUntil) {
    return cached.payload;
  }

  if (inflight && now - inflightAt < DEDUP_WINDOW_MS) {
    return inflight;
  }

  const request = requestBtcQueueBootstrapPayload(options)
    .catch((error) => {
      const stale = getCachedBootstrap();
      if (stale) return stale;
      throw error;
    })
    .finally(() => {
      inflightBootstrap = null;
      inflightBootstrapAt = 0;
    });

  inflightBootstrap = request;
  inflightBootstrapAt = now;

  return request;
}

export function prefetchBtcQueuePayload(options = {}) {
  return fetchBtcQueuePayload(options).catch(() => null);
}

export function prefetchBtcQueueBootstrapPayload(options = {}) {
  return fetchBtcQueueBootstrapPayload(options).catch(() => null);
}

export async function fetchJohoeHistory(options = {}) {
  return fetchBtcQueuePayload(options).then((payload) => {
    if (!payload || typeof payload !== 'object') return null;
    return {
      ...payload,
      range: BTC_QUEUE_RANGE,
    };
  });
}
