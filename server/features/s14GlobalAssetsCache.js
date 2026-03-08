import { cacheGetJson, cacheSetJson, withCacheLock } from '../shared/runtimeCache.js';

const SOURCE_URL = 'https://newhedge.io/bitcoin/global-asset-values';
const SOURCE_FETCH_URL = 'https://r.jina.ai/http://newhedge.io/bitcoin/global-asset-values';
const SNAPSHOT_TITLE = 'Latest Global Asset Values snapshot';

const FETCH_TIMEOUT_MS = 15_000;
const REFRESH_INTERVAL_MS = 60 * 60_000;
const SCRAPER_BASE_URL = String(process.env.SCRAPER_BASE_URL || 'https://api.zatobox.io').trim();

const SHARED_CACHE_KEY = 's13:global-assets:newhedge';
const SHARED_LOCK_KEY = 's13:global-assets:newhedge:refresh';

let memoryCache = null;

class S14GlobalAssetsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'S14GlobalAssetsError';
  }
}

function normalizeTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseIsoDate(value) {
  const date = new Date(String(value || ''));
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function normalizeLabel(value) {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}

function parseTrillions(rawValue) {
  const cleaned = String(rawValue || '')
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();

  const match = cleaned.match(/^([0-9]*\.?[0-9]+)([TMB])?$/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return null;

  const unit = match[2] || 'T';
  if (unit === 'T') return amount;
  if (unit === 'B') return amount / 1000;
  if (unit === 'M') return amount / 1_000_000;
  return null;
}

function assetIdFromName(name) {
  const normalized = normalizeLabel(name).toLowerCase();
  if (normalized === 'bitcoin') return 'bitcoin';
  if (normalized === 'gold') return 'gold';
  if (normalized === 'equities') return 'equities';
  if (normalized === 'real estate') return 'real_estate';
  if (normalized === 'bonds') return 'bonds';
  if (normalized === 'money') return 'money';
  if (normalized === 's&p 500') return 'sp500';
  if (normalized === 'art, cars, & collectibles') return 'collectibles';

  return normalized
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'asset';
}

const ORDER_BY_ID = [
  'real_estate',
  'bonds',
  'equities',
  'money',
  'sp500',
  'gold',
  'collectibles',
  'bitcoin',
];

function getOrderIndex(id) {
  const idx = ORDER_BY_ID.indexOf(id);
  return idx >= 0 ? idx : ORDER_BY_ID.length + 1;
}

function parseSnapshotFromMarkdown(text) {
  const source = String(text || '');
  const titleIndex = source.indexOf(SNAPSHOT_TITLE);
  if (titleIndex < 0) {
    throw new S14GlobalAssetsError('Newhedge snapshot section missing');
  }

  const tail = source.slice(titleIndex);
  const sectionEnd = tail.indexOf('\nNewhedge Stats');
  const section = sectionEnd > 0 ? tail.slice(0, sectionEnd) : tail;

  const rows = [...section.matchAll(/####\s+([^\r\n]+)\r?\n\r?\n([^\r\n]+)/g)];
  if (!rows.length) {
      throw new S14GlobalAssetsError('Newhedge snapshot rows missing');
  }

  const assets = [];
  let providerLastUpdatedText = null;

  rows.forEach((match) => {
    const label = normalizeLabel(match[1]);
    const valueText = normalizeLabel(match[2]);
    if (!label) return;

    if (label.toLowerCase() === 'last updated') {
      providerLastUpdatedText = valueText || null;
      return;
    }

    const valueTrillions = parseTrillions(valueText);
    if (!Number.isFinite(valueTrillions) || valueTrillions <= 0) return;

    assets.push({
      id: assetIdFromName(label),
      name: label,
      formatted: valueText,
      value_trillions: Number(valueTrillions.toFixed(3)),
      value_usd: Number((valueTrillions * 1_000_000_000_000).toFixed(0)),
    });
  });

  if (!assets.length) {
    throw new S14GlobalAssetsError('Newhedge snapshot assets missing');
  }

  assets.sort((a, b) => {
    const byOrder = getOrderIndex(a.id) - getOrderIndex(b.id);
    if (byOrder !== 0) return byOrder;
    return b.value_trillions - a.value_trillions;
  });

  return {
    assets,
    providerLastUpdatedText,
  };
}

function isValidPayload(payload) {
  return Boolean(
    payload
      && typeof payload === 'object'
      && typeof payload.updated_at === 'string'
      && typeof payload.next_update_at === 'string'
      && payload.data
      && Array.isArray(payload.data.assets)
      && payload.data.assets.length > 0,
  );
}

function isFreshPayload(payload, nowMs = Date.now()) {
  if (!isValidPayload(payload)) return false;
  const next = parseIsoDate(payload.next_update_at);
  if (!next) return false;
  return nowMs < next.getTime();
}

function stalePayload(payload, reason) {
  if (!isValidPayload(payload)) return null;
  const updatedAt = parseIsoDate(payload.updated_at);
  const staleAgeMs = updatedAt ? Math.max(0, Date.now() - updatedAt.getTime()) : null;

  return {
    ...payload,
    is_fallback: true,
    fallback_note: reason,
    stale_age_ms: staleAgeMs,
  };
}

function buildPayload(snapshot) {
  const nowMs = Date.now();
  const totalTrillions = snapshot.assets.reduce((sum, asset) => sum + asset.value_trillions, 0);
  const bitcoin = snapshot.assets.find((asset) => asset.id === 'bitcoin');
  const btcSharePct = totalTrillions > 0 && bitcoin
    ? Number(((bitcoin.value_trillions / totalTrillions) * 100).toFixed(3))
    : null;

  const assets = snapshot.assets
    .map((asset, index) => ({
      ...asset,
      rank: index + 1,
      pct_total: totalTrillions > 0
        ? Number(((asset.value_trillions / totalTrillions) * 100).toFixed(3))
        : null,
    }));

  return {
    updated_at: normalizeTimestamp(new Date(nowMs)),
    next_update_at: normalizeTimestamp(new Date(nowMs + REFRESH_INTERVAL_MS)),
    source_provider: 'newhedge',
    source_url: SOURCE_URL,
    source_fetch_url: SOURCE_FETCH_URL,
    is_fallback: false,
    fallback_note: null,
    refresh_policy: {
      min_interval_ms: REFRESH_INTERVAL_MS,
      hard_minute_limit: null,
      hard_daily_limit: null,
      safe_minute_budget: 1,
      safe_daily_budget: 24,
      provider_cadence: '1h',
    },
    data: {
      title: SNAPSHOT_TITLE,
      assets,
      asset_count: assets.length,
      total_value_trillions: Number(totalTrillions.toFixed(3)),
      total_value_usd: Number((totalTrillions * 1_000_000_000_000).toFixed(0)),
      bitcoin_share_pct: btcSharePct,
      provider_last_updated_text: snapshot.providerLastUpdatedText,
    },
  };
}

async function fetchTextWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain, text/markdown, text/html;q=0.9',
        'User-Agent': 'satoshi-dashboard/1.0 (+module-s13-newhedge-scraper)',
      },
    });

    if (!response.ok) {
      throw new S14GlobalAssetsError(`Newhedge scrape HTTP ${response.status}`);
    }

    const text = await response.text();
    if (!text || text.length < 200) {
      throw new S14GlobalAssetsError('Newhedge scrape returned empty content');
    }

    return text;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new S14GlobalAssetsError('Newhedge scrape request timeout');
    }
    if (error instanceof S14GlobalAssetsError) throw error;
    throw new S14GlobalAssetsError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

function getCacheTtlSeconds() {
  return Math.max(60, Math.floor((REFRESH_INTERVAL_MS + 120_000) / 1000));
}

export async function refreshS14GlobalAssetsPayload() {
  let markdown = null;

  // Try Docker scraper proxy first
  if (SCRAPER_BASE_URL) {
    const proxyUrl = `${SCRAPER_BASE_URL}/api/scrape/newhedge-global-assets`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const json = await response.json();
        if (json?.html && typeof json.html === 'string' && json.html.length > 200) {
          markdown = json.html;
        }
      }
    } catch (error) {
      console.warn(`[s13] Scraper proxy failed (${error?.message}), falling back to direct`);
    } finally {
      clearTimeout(timeout);
    }
  }

  // Fallback: direct scrape
  if (!markdown) {
    markdown = await fetchTextWithTimeout(SOURCE_FETCH_URL);
  }

  const snapshot = parseSnapshotFromMarkdown(markdown);
  const payload = buildPayload(snapshot);

  memoryCache = payload;
  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: getCacheTtlSeconds() });
  return payload;
}

export async function getS14GlobalAssetsPayload({ forceFresh = false } = {}) {
  if (!forceFresh && isFreshPayload(memoryCache)) {
    return memoryCache;
  }

  if (!memoryCache) {
    const shared = await cacheGetJson(SHARED_CACHE_KEY);
    if (isValidPayload(shared)) {
      memoryCache = shared;
    }
  }

  if (!forceFresh && isFreshPayload(memoryCache)) {
    return memoryCache;
  }

  const refreshed = await withCacheLock(
    SHARED_LOCK_KEY,
    async () => refreshS14GlobalAssetsPayload(),
    { ttlSeconds: 35, waitMs: 3500, pollMs: 140 },
  ).catch(() => null);

  if (isValidPayload(refreshed)) {
    memoryCache = refreshed;
    return refreshed;
  }

  const sharedAfterLock = await cacheGetJson(SHARED_CACHE_KEY);
  if (isValidPayload(sharedAfterLock)) {
    memoryCache = sharedAfterLock;
    return stalePayload(sharedAfterLock, 'Serving stale snapshot while shared refresh completes');
  }

  if (isValidPayload(memoryCache)) {
    return stalePayload(memoryCache, 'Serving in-memory stale snapshot while shared refresh completes');
  }

  try {
    return await refreshS14GlobalAssetsPayload();
  } catch (error) {
    const shared = await cacheGetJson(SHARED_CACHE_KEY);
    if (isValidPayload(shared)) {
      memoryCache = shared;
      return stalePayload(shared, 'Serving stale snapshot while Newhedge refresh recovers');
    }

    if (isValidPayload(memoryCache)) {
      return stalePayload(memoryCache, 'Serving in-memory stale snapshot while Newhedge refresh recovers');
    }

    throw error;
  }
}

export async function getS14GlobalAssetsStatus() {
  const payload = await getS14GlobalAssetsPayload();
  return {
    status: 'ready',
    last_updated: payload.updated_at,
    next_update: payload.next_update_at,
    source_provider: payload.source_provider,
    is_fallback: Boolean(payload.is_fallback),
    assets: Number(payload?.data?.asset_count || 0),
  };
}

export { S14GlobalAssetsError };
