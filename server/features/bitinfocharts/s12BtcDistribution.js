import { readFile, writeFile } from 'node:fs/promises';
import { cacheGetJson, cacheSetJson, withCacheLock } from '../../core/runtimeCache.js';
import { ensureRuntimeCacheDir, resolveRuntimeCacheFile } from '../../core/runtimePaths.js';
import { getBitinfochartsHtmlPayload } from '../../services/bitinfochartsShared.js';

const SOURCE_NAME = 'bitinfocharts.com';
const CACHE_FILE = resolveRuntimeCacheFile('btc_distribution_cache.json');
const SHARED_CACHE_KEY = 's10-btc-distribution';
const SHARED_LOCK_KEY = 's10-btc-distribution-refresh';
const SHARED_CACHE_TTL_SECONDS = 30 * 60;

let memoryCache = null;

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value) {
  return decodeEntities(String(value || '').replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

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

function getDataVal(attrs) {
  const match = String(attrs || '').match(/data-val=['"]([^'"]+)['"]/i);
  return match ? Number(match[1]) : null;
}

function normalizeRange(value) {
  return String(value || '')
    .replace(/\[|\]|\(|\)/g, '')
    .replace(/,/g, '')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIntegerFromCell(cell) {
  const fromDataVal = getDataVal(cell.attrs);
  if (Number.isFinite(fromDataVal)) return Math.trunc(fromDataVal);

  const cleaned = cell.text.replace(/,/g, '').match(/-?\d+/);
  if (!cleaned) throw new Error(`Cannot parse integer from cell: ${cell.text}`);
  return Number(cleaned[0]);
}

function parseBtcFromCell(cell) {
  const cleaned = cell.text
    .replace(/BTC/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();

  const parsedText = Number(cleaned);
  if (Number.isFinite(parsedText)) return parsedText;

  const fromDataVal = getDataVal(cell.attrs);
  if (Number.isFinite(fromDataVal)) return fromDataVal;

  throw new Error(`Cannot parse BTC value from cell: ${cell.text}`);
}

function parsePercentFromCell(cell) {
  const firstPercent = cell.text.match(/-?\d+(?:\.\d+)?(?=%)/);
  if (!firstPercent) {
    throw new Error(`Cannot parse percent from cell: ${cell.text}`);
  }
  return Number(firstPercent[0]);
}

function parseDistributionRows(html) {
  const tableMatch = html.match(/<caption>\s*Bitcoin distribution\s*<\/caption>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tableMatch) {
    throw new Error('Bitcoin distribution table not found');
  }

  const tbody = tableMatch[1];
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch = rowRegex.exec(tbody);

  while (rowMatch) {
    const cells = [];
    const cellRegex = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
    let cellMatch = cellRegex.exec(rowMatch[1]);

    while (cellMatch) {
      cells.push({
        attrs: cellMatch[1],
        text: stripHtml(cellMatch[2]),
      });
      cellMatch = cellRegex.exec(rowMatch[1]);
    }

    if (cells.length >= 6) {
      rows.push({
        range: normalizeRange(cells[0].text),
        addresses: parseIntegerFromCell(cells[1]),
        totalBTC: parseBtcFromCell(cells[3]),
        btcPercent: parsePercentFromCell(cells[5]),
      });
    }

    rowMatch = rowRegex.exec(tbody);
  }

  if (!rows.length) {
    throw new Error('Bitcoin distribution rows not found');
  }

  return rows;
}

function parseFooterTimestamp(html) {
  const matches = [...html.matchAll(/\b\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC\b/g)];
  if (!matches.length) {
    throw new Error('Footer UTC timestamp not found');
  }
  return matches[matches.length - 1][0];
}

function isValidPayload(payload) {
  return (
    payload
    && typeof payload === 'object'
    && typeof payload.source === 'string'
    && typeof payload.updatedAt === 'string'
    && typeof payload.fetchedAt === 'string'
    && typeof payload.nextUpdateAt === 'string'
    && Array.isArray(payload.distribution)
    && payload.distribution.length > 0
  );
}

function needsRefresh(payload, now = Date.now()) {
  try {
    const nextUpdate = parseUtcTimestamp(payload?.nextUpdateAt);
    return now >= nextUpdate.getTime();
  } catch {
    return true;
  }
}

function stalePayload(payload, reason) {
  if (!isValidPayload(payload)) return null;
  return {
    ...payload,
    isFallback: true,
    fallbackNote: reason,
  };
}

async function readCacheFile() {
  try {
    const text = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(text);
    return isValidPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCacheFile(payload) {
  try {
    await ensureRuntimeCacheDir();
    await writeFile(CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch {
    /* ignore write errors in read-only/serverless environments */
  }
}

export async function updateBtcDistributionCache() {
  const sourcePayload = await getBitinfochartsHtmlPayload();
  const html = sourcePayload.html;
  const distribution = parseDistributionRows(html);
  const updatedAt = sourcePayload.updatedAt || parseFooterTimestamp(html);
  const fetchedAt = sourcePayload.fetchedAt || formatUtcTimestamp(new Date());
  const nextUpdateAt = sourcePayload.nextUpdateAt || formatUtcTimestamp(new Date(parseUtcTimestamp(updatedAt).getTime() + (30 * 60 * 1000)));

  const payload = {
    source: SOURCE_NAME,
    updatedAt,
    fetchedAt,
    nextUpdateAt,
    isFallback: false,
    fallbackNote: null,
    distribution,
  };

  memoryCache = payload;
  await writeCacheFile(payload);
  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: SHARED_CACHE_TTL_SECONDS });
  return payload;
}

export async function getS12BtcDistributionPayload() {
  if (memoryCache && !needsRefresh(memoryCache)) {
    return memoryCache;
  }

  if (!memoryCache) {
    const sharedCache = await cacheGetJson(SHARED_CACHE_KEY);
    if (isValidPayload(sharedCache)) memoryCache = sharedCache;
  }

  if (!memoryCache) {
    const fileCache = await readCacheFile();
    if (fileCache) memoryCache = fileCache;
  }

  if (memoryCache && !needsRefresh(memoryCache)) {
    return memoryCache;
  }

  const refreshed = await withCacheLock(
    SHARED_LOCK_KEY,
    async () => updateBtcDistributionCache(),
    { ttlSeconds: 20, waitMs: 3500, pollMs: 120 },
  );

  if (isValidPayload(refreshed)) {
    return refreshed;
  }

  const sharedCache = await cacheGetJson(SHARED_CACHE_KEY);
  if (isValidPayload(sharedCache)) {
    memoryCache = sharedCache;
    if (!needsRefresh(sharedCache)) return sharedCache;
    return stalePayload(sharedCache, 'Serving stale distribution while shared refresh completes');
  }

  if (memoryCache && isValidPayload(memoryCache)) {
    return stalePayload(memoryCache, 'Serving in-memory stale distribution while shared refresh completes');
  }

  try {
    return await updateBtcDistributionCache();
  } catch (error) {
    if (memoryCache && isValidPayload(memoryCache)) {
      return stalePayload(memoryCache, `Serving in-memory stale distribution while refresh recovers (${error instanceof Error ? error.message : 'unknown error'})`);
    }
    throw error;
  }
}

export async function getS12BtcDistributionStatus() {
  const payload = await getS12BtcDistributionPayload();
  return {
    source: payload.source,
    updatedAt: payload.updatedAt,
    fetchedAt: payload.fetchedAt,
    nextUpdateAt: payload.nextUpdateAt,
    isFallback: Boolean(payload.isFallback),
    fallbackNote: payload.fallbackNote || null,
    rows: payload.distribution.length,
  };
}
