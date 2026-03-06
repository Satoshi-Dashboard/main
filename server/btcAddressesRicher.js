import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheGetJson, cacheSetJson, withCacheLock } from './runtimeCache.js';

const SOURCE_URL = 'https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html';
const SOURCE_NAME = 'bitinfocharts.com';
const CACHE_FILE = path.resolve(process.cwd(), 'btc_addresses_richer_cache.json');
const FETCH_TIMEOUT_MS = 15_000;
const NEXT_UPDATE_MS = 10 * 60 * 1000;
const SHARED_CACHE_KEY = 's14-addresses-richer';
const SHARED_LOCK_KEY = 's14-addresses-richer-refresh';
const SHARED_CACHE_TTL_SECONDS = 10 * 60;

let memoryCache = null;

function decodeEntities(value) {
  return String(value || '')
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

function parseUsdThreshold(label) {
  const match = String(label || '').match(/[\d,]+/);
  if (!match) {
    throw new Error(`Cannot parse USD threshold from label: ${label}`);
  }
  return Number(match[0].replace(/,/g, ''));
}

function parseAddressesCount(value) {
  const match = String(value || '').replace(/,/g, '').match(/\d+/);
  if (!match) {
    throw new Error(`Cannot parse addresses count from value: ${value}`);
  }
  return Number(match[0]);
}

function parseAddressesRicherTable(html) {
  const tableMatch = html.match(/<table[^>]*>\s*<caption>\s*Addresses richer than\s*<\/caption>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    throw new Error('Addresses richer than table not found');
  }

  const tableBody = tableMatch[1];
  const rows = [...tableBody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) => row[1]);
  const headerRow = rows.find((row) => /<th/i.test(row));
  const dataRow = rows.find((row) => /<td/i.test(row));

  if (!headerRow || !dataRow) {
    throw new Error('Addresses richer than table rows are incomplete');
  }

  const headers = [...headerRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((cell) => stripHtml(cell[1]));
  const values = [...dataRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => stripHtml(cell[1]));

  if (!headers.length || headers.length !== values.length) {
    throw new Error('Addresses richer than table columns are inconsistent');
  }

  return headers.map((header, index) => ({
    usdThreshold: parseUsdThreshold(header),
    label: header,
    addresses: parseAddressesCount(values[index]),
  }));
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
    && typeof payload.nextUpdateAt === 'string'
    && Array.isArray(payload.richerThan)
    && payload.richerThan.length > 0
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

function quote(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function toJs(payload) {
  const lines = [];
  lines.push('// AUTO-GENERATED — DO NOT EDIT MANUALLY');
  lines.push(`// Last updated: ${payload.updatedAt}`);
  lines.push('');
  lines.push('const BTC_ADDRESSES_RICHER = [');

  payload.richerThan.forEach((row) => {
    lines.push(
      `  { usdThreshold: ${row.usdThreshold}, label: "${quote(row.label)}", addresses: ${row.addresses} },`,
    );
  });

  lines.push('];');
  lines.push('');
  lines.push('const BTC_ADDRESSES_RICHER_META = {');
  lines.push(`  source: "${quote(payload.source)}",`);
  lines.push(`  updatedAt: "${quote(payload.updatedAt)}",`);
  lines.push(`  nextUpdateAt: "${quote(payload.nextUpdateAt)}"`);
  lines.push('};');
  lines.push('');
  lines.push('export { BTC_ADDRESSES_RICHER, BTC_ADDRESSES_RICHER_META };');
  lines.push('');

  return lines.join('\n');
}

async function fetchHtml() {
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
    await writeFile(CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch {
    /* ignore write errors in read-only/serverless environments */
  }
}

export async function updateBtcAddressesRicherCache() {
  const html = await fetchHtml();
  const richerThan = parseAddressesRicherTable(html);
  const updatedAt = parseFooterTimestamp(html);
  const updatedDate = parseUtcTimestamp(updatedAt);
  const nextUpdateAt = formatUtcTimestamp(new Date(updatedDate.getTime() + NEXT_UPDATE_MS));

  const payload = {
    source: SOURCE_NAME,
    updatedAt,
    nextUpdateAt,
    richerThan,
  };

  memoryCache = payload;
  await writeCacheFile(payload);
  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: SHARED_CACHE_TTL_SECONDS });
  return payload;
}

export async function getBtcAddressesRicherPayload() {
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
    async () => updateBtcAddressesRicherCache(),
    { ttlSeconds: 20, waitMs: 3500, pollMs: 120 },
  );

  if (isValidPayload(refreshed)) {
    return refreshed;
  }

  try {
    const sharedCache = await cacheGetJson(SHARED_CACHE_KEY);
    if (isValidPayload(sharedCache)) {
      memoryCache = sharedCache;
      if (!needsRefresh(sharedCache)) return sharedCache;
    }

    return await updateBtcAddressesRicherCache();
  } catch (error) {
    if (memoryCache && isValidPayload(memoryCache)) {
      return memoryCache;
    }
    throw error;
  }
}

export async function getBtcAddressesRicherJs() {
  const payload = await getBtcAddressesRicherPayload();
  return toJs(payload);
}

export async function getBtcAddressesRicherStatus() {
  const payload = await getBtcAddressesRicherPayload();
  return {
    source: payload.source,
    updatedAt: payload.updatedAt,
    nextUpdateAt: payload.nextUpdateAt,
    rows: payload.richerThan.length,
  };
}
