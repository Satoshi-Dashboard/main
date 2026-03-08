import { cacheGetJson, cacheSetJson, withCacheLock } from './runtimeCache.js';

const SOURCE_URL = 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html';
const SOURCE_NAME = 'bitinfocharts.com';
const FETCH_TIMEOUT_MS = 15_000;
const SCRAPER_BASE_URL = String(process.env.SCRAPER_BASE_URL || 'https://api.zatobox.io').trim();
const NEXT_UPDATE_MS = 30 * 60 * 1000;
const SHARED_HTML_CACHE_KEY = 'bitinfocharts-richlist-html';
const SHARED_HTML_LOCK_KEY = 'bitinfocharts-richlist-html-refresh';

let memoryHtmlCache = null;

function parseUtcTimestamp(value) {
  const normalized = String(value || '').replace(' UTC', 'Z').replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid UTC timestamp: ${value}`);
  }
  return parsed;
}

function formatUtcTimestamp(date) {
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`;
}

function parseFooterTimestamp(html) {
  const matches = [...String(html || '').matchAll(/\b\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC\b/g)];
  if (!matches.length) {
    throw new Error('Footer UTC timestamp not found');
  }
  return matches[matches.length - 1][0];
}

function isValidHtmlPayload(payload) {
  return (
    payload
    && typeof payload === 'object'
    && typeof payload.source === 'string'
    && typeof payload.updatedAt === 'string'
    && typeof payload.nextUpdateAt === 'string'
    && typeof payload.html === 'string'
    && payload.html.length > 0
  );
}

function getTtlSeconds(nextUpdateAt) {
  const nextDate = parseUtcTimestamp(nextUpdateAt);
  const ttlMs = Math.max(60_000, nextDate.getTime() - Date.now());
  return Math.max(60, Math.floor(ttlMs / 1000));
}

function needsRefresh(payload, now = Date.now()) {
  try {
    const nextUpdate = parseUtcTimestamp(payload?.nextUpdateAt);
    return now >= nextUpdate.getTime();
  } catch {
    return true;
  }
}

async function fetchHtml() {
  // Try Docker scraper proxy first
  if (SCRAPER_BASE_URL) {
    const proxyUrl = `${SCRAPER_BASE_URL}/api/scrape/bitinfocharts-richlist`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const json = await response.json();
        if (json?.html && typeof json.html === 'string' && json.html.length > 1000) {
          return json.html;
        }
      }
    } catch (error) {
      console.warn(`[bitinfocharts] Scraper proxy failed (${error?.message}), falling back to direct`);
    } finally {
      clearTimeout(timeout);
    }
  }

  // Fallback: direct scrape
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(SOURCE_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; SatoshiDashboardBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`BitInfoCharts request failed with HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function writeSharedPayload(payload) {
  memoryHtmlCache = payload;
  await cacheSetJson(SHARED_HTML_CACHE_KEY, payload, { ttlSeconds: getTtlSeconds(payload.nextUpdateAt) });
}

export async function refreshBitinfochartsHtml() {
  const html = await fetchHtml();
  const updatedAt = parseFooterTimestamp(html);
  const updatedDate = parseUtcTimestamp(updatedAt);
  const nextUpdateAt = formatUtcTimestamp(new Date(updatedDate.getTime() + NEXT_UPDATE_MS));

  const payload = {
    source: SOURCE_NAME,
    html,
    updatedAt,
    nextUpdateAt,
  };

  await writeSharedPayload(payload);
  return payload;
}

export async function getBitinfochartsHtmlPayload() {
  if (isValidHtmlPayload(memoryHtmlCache) && !needsRefresh(memoryHtmlCache)) {
    return memoryHtmlCache;
  }

  if (!memoryHtmlCache) {
    const shared = await cacheGetJson(SHARED_HTML_CACHE_KEY);
    if (isValidHtmlPayload(shared)) {
      memoryHtmlCache = shared;
    }
  }

  if (isValidHtmlPayload(memoryHtmlCache) && !needsRefresh(memoryHtmlCache)) {
    return memoryHtmlCache;
  }

  const refreshed = await withCacheLock(
    SHARED_HTML_LOCK_KEY,
    async () => refreshBitinfochartsHtml(),
    { ttlSeconds: 20, waitMs: 3500, pollMs: 120 },
  );

  if (isValidHtmlPayload(refreshed)) {
    return refreshed;
  }

  const shared = await cacheGetJson(SHARED_HTML_CACHE_KEY);
  if (isValidHtmlPayload(shared)) {
    memoryHtmlCache = shared;
    return shared;
  }

  if (isValidHtmlPayload(memoryHtmlCache)) {
    return memoryHtmlCache;
  }

  return await refreshBitinfochartsHtml();
}
