import { readFile, writeFile } from 'node:fs/promises';
import { cacheDelete, cacheGetJson, cacheSetJson, withCacheLock } from '../../core/runtimeCache.js';
import { ensureRuntimeCacheDir, resolveRuntimeCacheFile } from '../../core/runtimePaths.js';

const CACHE_FILE = resolveRuntimeCacheFile('bitnodes_cache.json');
const BITNODES_URL = 'https://bitnodes.io/api/v1/snapshots/latest/?field=sorted_asns';
const BITNODES_SNAPSHOT_URL = 'https://bitnodes.io/api/v1/snapshots/latest/';
const BITNODES_NODES_PAGE_URL = 'https://bitnodes.io/nodes/';

const UPDATE_HOURS_UTC = [6, 18];
const FETCH_TIMEOUT_MS = 15_000;
const SHARED_CACHE_KEY = 'bitnodes-cache';
const SHARED_LOCK_KEY = 'bitnodes-cache-refresh';
const BITNODES_SCRAPE_MIN_INTERVAL_MS = 10 * 60 * 1000;
const SCRAPER_BASE_URL = String(process.env.SCRAPER_BASE_URL || 'https://api.zatobox.io').trim();

let memoryCache = null;

const scrapeRateState = globalThis.__SATOSHI_BITNODES_SCRAPE_RATE_STATE__ || {
  lastRequestAtMs: 0,
  providerCacheUntil: '',
};

if (!globalThis.__SATOSHI_BITNODES_SCRAPE_RATE_STATE__) {
  globalThis.__SATOSHI_BITNODES_SCRAPE_RATE_STATE__ = scrapeRateState;
}

function parseIsoDate(value) {
  const date = new Date(String(value || ''));
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function formatWaitCompact(waitMs) {
  const minutes = Math.max(1, Math.ceil(waitMs / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  return `${hours}h`;
}

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

function sumCountryCounts(countryCounts) {
  return countryCounts.reduce((sum, row) => sum + row.nodes, 0);
}

function toPercent(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function buildNetworkBreakdown({
  totalNodes,
  ipv4Nodes,
  ipv6Nodes,
  onionNodes,
  fullNodes,
  prunedNodes,
  source,
}) {
  const total = Number(totalNodes) || 0;
  const ipv4 = Number(ipv4Nodes) || 0;
  const ipv6 = Number(ipv6Nodes) || 0;
  const onion = Number(onionNodes) || 0;
  const full = Number(fullNodes) || 0;
  const pruned = Number(prunedNodes) || 0;

  return {
    total_nodes: total,
    ipv4_nodes: ipv4,
    ipv4_pct: toPercent(ipv4, total),
    ipv6_nodes: ipv6,
    ipv6_pct: toPercent(ipv6, total),
    onion_nodes: onion,
    onion_pct: toPercent(onion, total),
    full_nodes: full,
    full_pct: toPercent(full, total),
    pruned_nodes: pruned,
    pruned_pct: toPercent(pruned, total),
    source,
  };
}

function parseNodeHost(nodeKey) {
  const value = String(nodeKey || '');
  if (!value) return '';

  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end > 1) return value.slice(1, end).toLowerCase();
  }

  const idx = value.lastIndexOf(':');
  if (idx > 0) return value.slice(0, idx).toLowerCase();
  return value.toLowerCase();
}

function computeBreakdownFromBitnodesSnapshot(snapshotData) {
  const nodes = snapshotData?.nodes;
  if (!nodes || typeof nodes !== 'object') return null;

  const entries = Object.entries(nodes);
  const totalNodesFromSnapshot = Number(snapshotData?.total_nodes);
  const totalNodes = Number.isFinite(totalNodesFromSnapshot) && totalNodesFromSnapshot > 0
    ? Math.floor(totalNodesFromSnapshot)
    : entries.length;

  let ipv4Nodes = 0;
  let ipv6Nodes = 0;
  let onionNodes = 0;
  let fullNodes = 0;
  let prunedNodes = 0;

  entries.forEach(([nodeKey, row]) => {
    const host = parseNodeHost(nodeKey);

    if (host.endsWith('.onion')) {
      onionNodes += 1;
    } else if (host.includes(':')) {
      ipv6Nodes += 1;
    } else {
      ipv4Nodes += 1;
    }

    const services = Array.isArray(row) ? Number(row[3]) : 0;
    const isFull = Number.isFinite(services) && (services & 1) === 1;
    const isPruned = Number.isFinite(services) && !isFull && (services & 1024) === 1024;

    if (isFull) fullNodes += 1;
    else if (isPruned) prunedNodes += 1;
  });

  return buildNetworkBreakdown({
    totalNodes,
    ipv4Nodes,
    ipv6Nodes,
    onionNodes,
    fullNodes,
    prunedNodes,
    source: 'bitnodes_api',
  });
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function parseBitnodesModalTimestamp(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isFinite(parsed.getTime())) return parsed;

  const parsedUtc = new Date(`${raw} UTC`);
  if (Number.isFinite(parsedUtc.getTime())) return parsedUtc;

  return null;
}

function parseBitnodesNetworkSummary(html) {
  const text = String(html || '');
  const rows = [...text.matchAll(/<h3>(?:<a [^>]*>)?([\d,]+)(?:<\/a>)?<\/h3><p class="text-muted">([^<]+)<\/p>/gi)]
    .map((match) => ({
      value: Number(String(match[1]).replace(/,/g, '')),
      label: String(match[2] || '').trim(),
    }))
    .filter((row) => Number.isFinite(row.value));

  if (!rows.length) return null;

  const summary = {
    totalNodes: null,
    ipv4Nodes: 0,
    ipv6Nodes: 0,
    onionNodes: 0,
    fullNodes: 0,
    prunedNodes: 0,
  };

  rows.forEach((row) => {
    const label = row.label.toLowerCase();
    if (label === 'nodes') summary.totalNodes = row.value;
    else if (label.startsWith('ipv4')) summary.ipv4Nodes = row.value;
    else if (label.startsWith('ipv6')) summary.ipv6Nodes = row.value;
    else if (label.startsWith('.onion') || label.startsWith('onion')) summary.onionNodes = row.value;
    else if (label.startsWith('full nodes')) summary.fullNodes = row.value;
    else if (label.startsWith('pruned nodes')) summary.prunedNodes = row.value;
  });

  if (!Number.isFinite(summary.totalNodes) || summary.totalNodes <= 0) {
    return null;
  }

  return buildNetworkBreakdown({
    totalNodes: summary.totalNodes,
    ipv4Nodes: summary.ipv4Nodes,
    ipv6Nodes: summary.ipv6Nodes,
    onionNodes: summary.onionNodes,
    fullNodes: summary.fullNodes,
    prunedNodes: summary.prunedNodes,
    source: 'bitnodes_scrape',
  });
}

function parseBitnodesCountriesModal(html) {
  const text = String(html || '');
  const modalMatch = text.match(/id="countries-modal"[\s\S]*?<\/div><\/div><\/div><\/div>/i);
  if (!modalMatch) {
    throw new Error('Bitnodes countries modal not found in HTML');
  }

  const modal = modalMatch[0];
  const totalMatch = modal.match(/>([\d,]+) nodes as of ([^<]+)<\/span>/i);
  const totalNodes = Number((totalMatch?.[1] || '0').replace(/,/g, ''));
  const asOfRaw = String(totalMatch?.[2] || '').trim();
  const asOfDate = parseBitnodesModalTimestamp(asOfRaw);

  const rows = [...modal.matchAll(/<a href="\?q=[^"]+">(.+?)\s*\(([\d,]+)\)<\/a>/g)]
    .map((match) => ({
      country_name: decodeHtmlEntities(match[1]).trim(),
      nodes: Number(String(match[2]).replace(/,/g, '')),
    }))
    .filter((row) => row.country_name && Number.isFinite(row.nodes) && row.nodes >= 0);

  if (!rows.length) {
    throw new Error('Bitnodes countries modal rows are empty');
  }

  const countryCounts = rows.map((row) => ({
    country_code: 'UNKNOWN',
    country_name: row.country_name,
    nodes: row.nodes,
  }));

  return {
    total_nodes: Number.isFinite(totalNodes) && totalNodes > 0 ? totalNodes : sumCountryCounts(countryCounts),
    as_of_raw: asOfRaw,
    as_of_date: asOfDate,
    country_counts: countryCounts,
  };
}

function getScrapeThrottle(now = new Date()) {
  const nowMs = now.getTime();
  let waitUntil = null;

  if (scrapeRateState.lastRequestAtMs > 0) {
    const minIntervalUntil = new Date(scrapeRateState.lastRequestAtMs + BITNODES_SCRAPE_MIN_INTERVAL_MS);
    if (minIntervalUntil.getTime() > nowMs) {
      waitUntil = minIntervalUntil;
    }
  }

  const providerCacheUntil = parseIsoDate(scrapeRateState.providerCacheUntil);
  if (providerCacheUntil && providerCacheUntil.getTime() > nowMs) {
    waitUntil = waitUntil && waitUntil > providerCacheUntil ? waitUntil : providerCacheUntil;
  }

  if (!waitUntil) {
    return {
      allowed: true,
      waitUntil: null,
      waitMs: 0,
    };
  }

  return {
    allowed: false,
    waitUntil,
    waitMs: Math.max(0, waitUntil.getTime() - nowMs),
  };
}

function markScrapeRequest(now = new Date(), providerCacheUntil = null) {
  scrapeRateState.lastRequestAtMs = now.getTime();
  scrapeRateState.providerCacheUntil = providerCacheUntil ? providerCacheUntil.toISOString() : '';
}

function buildBitnodesPayload(bitnodesData, snapshotBreakdown, now = new Date()) {
  const countryCounts = aggregateCountryCounts(bitnodesData?.sorted_asns);
  const totalNodes = Number(snapshotBreakdown?.total_nodes);

  return {
    last_updated: now.toISOString(),
    next_update: getNextUpdateDate(now).toISOString(),
    country_counts: countryCounts,
    data: {
      ...bitnodesData,
      total_nodes: Number.isFinite(totalNodes) && totalNodes > 0 ? totalNodes : sumCountryCounts(countryCounts),
      network_breakdown: snapshotBreakdown || null,
      source: 'bitnodes_api',
      coverage: 'asn_country_aggregate',
    },
    source_provider: 'bitnodes',
    is_fallback: false,
    fallback_note: null,
  };
}

function buildBitnodesScrapeFallbackPayload(parsedScrape, scrapeBreakdown, bitnodesErrorMessage = '', now = new Date()) {
  const asOfDate = parsedScrape?.as_of_date;
  const sourceTimestamp = asOfDate ? asOfDate.toISOString() : now.toISOString();
  const nextUpdate = new Date(Math.max(
    now.getTime() + BITNODES_SCRAPE_MIN_INTERVAL_MS,
    asOfDate ? (asOfDate.getTime() + BITNODES_SCRAPE_MIN_INTERVAL_MS) : 0,
  ));

  return {
    last_updated: now.toISOString(),
    next_update: nextUpdate.toISOString(),
    country_counts: parsedScrape.country_counts,
    data: {
      total_nodes: parsedScrape.total_nodes,
      timestamp: sourceTimestamp,
      source: 'bitnodes_scrape',
      coverage: 'countries_modal_all',
      countries_count: parsedScrape.country_counts.length,
      ipv6_included: null,
      tor_included: null,
      network_breakdown: scrapeBreakdown || null,
    },
    source_provider: 'bitnodes_scrape',
    is_fallback: true,
    fallback_note: 'Fallback active: Bitnodes API is unavailable. Showing Bitnodes countries modal snapshot from the website.',
    fallback_reason: bitnodesErrorMessage || 'Bitnodes API unavailable',
    fallback_provider_cache_until: asOfDate
      ? new Date(asOfDate.getTime() + BITNODES_SCRAPE_MIN_INTERVAL_MS).toISOString()
      : null,
  };
}

async function fetchJsonWithTimeout(url, acceptHeader) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: acceptHeader },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTextWithTimeout(url, acceptHeader) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: acceptHeader,
        'User-Agent': 'Mozilla/5.0 (compatible; SatoshiDashboardBot/1.0)',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function getPayloadTtlSeconds(payload, now = Date.now()) {
  const nextUpdate = parseIsoDate(payload?.next_update);
  if (!nextUpdate) return 60;

  const ttlMs = Math.max(60_000, nextUpdate.getTime() - now);
  return Math.max(60, Math.floor(ttlMs / 1000));
}

async function writeCachePayload(payload) {
  memoryCache = payload;

  try {
    await ensureRuntimeCacheDir();
    await writeFile(CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch {
    /* keep runtime payload even if filesystem is not writable */
  }

  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: getPayloadTtlSeconds(payload) });
}

async function getExistingFallbackPayload() {
  if (memoryCache?.is_fallback) return memoryCache;

  const shared = await cacheGetJson(SHARED_CACHE_KEY);
  if (shared && typeof shared === 'object' && shared.is_fallback) {
    memoryCache = shared;
    return shared;
  }

  const fromDisk = await readBitnodesCache();
  if (fromDisk?.is_fallback) {
    memoryCache = fromDisk;
    return fromDisk;
  }

  return null;
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

function isCacheReady(cache) {
  return Boolean(cache && typeof cache === 'object' && cache.data);
}

export function isBitnodesCacheStale(cache, now = new Date()) {
  if (!isCacheReady(cache)) return true;
  const nextUpdate = parseIsoDate(cache.next_update);
  if (!nextUpdate) return true;
  return now.getTime() >= nextUpdate.getTime();
}

export function pendingResponse(fromDate = new Date()) {
  return {
    status: 'pending',
    message: 'Data not yet available',
    next_update: getNextUpdateDate(fromDate).toISOString(),
  };
}

export async function refreshBitnodesCache() {
  const now = new Date();
  let bitnodesErrorMessage = '';

  // Try Docker scraper proxy first (contains API + HTML data)
  if (SCRAPER_BASE_URL) {
    try {
      const proxyUrl = `${SCRAPER_BASE_URL}/api/scrape/bitnodes-nodes`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const scraperData = await response.json();

          // If scraper has API data, use it directly
          if (scraperData?.apiData?.sorted_asns) {
            const snapshotBreakdown = scraperData.snapshotData
              ? computeBreakdownFromBitnodesSnapshot(scraperData.snapshotData)
              : null;
            const payload = buildBitnodesPayload(scraperData.apiData, snapshotBreakdown, now);
            await writeCachePayload(payload);
            return payload;
          }

          // If scraper only has HTML, use scrape fallback
          if (scraperData?.nodesHtml && typeof scraperData.nodesHtml === 'string') {
            const parsedScrape = parseBitnodesCountriesModal(scraperData.nodesHtml);
            const scrapeBreakdown = parseBitnodesNetworkSummary(scraperData.nodesHtml);
            markScrapeRequest(now, parsedScrape?.as_of_date
              ? new Date(parsedScrape.as_of_date.getTime() + BITNODES_SCRAPE_MIN_INTERVAL_MS)
              : null);
            const payload = buildBitnodesScrapeFallbackPayload(parsedScrape, scrapeBreakdown, scraperData.apiError || '', now);
            await writeCachePayload(payload);
            return payload;
          }
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.warn(`[bitnodes] Scraper proxy failed (${error?.message}), falling back to direct`);
    }
  }

  // Fallback: direct API + scrape (original logic)
  try {
    const [countryDataResult, snapshotResult] = await Promise.allSettled([
      fetchJsonWithTimeout(BITNODES_URL, 'application/json'),
      fetchJsonWithTimeout(BITNODES_SNAPSHOT_URL, 'application/json'),
    ]);

    if (countryDataResult.status !== 'fulfilled') {
      throw countryDataResult.reason;
    }

    const bitnodesData = countryDataResult.value;
    const snapshotBreakdown = snapshotResult.status === 'fulfilled'
      ? computeBreakdownFromBitnodesSnapshot(snapshotResult.value)
      : null;

    const payload = buildBitnodesPayload(bitnodesData, snapshotBreakdown, now);
    await writeCachePayload(payload);
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    bitnodesErrorMessage = `Bitnodes request failed: ${message}`;
  }

  const scrapeThrottle = getScrapeThrottle(now);
  if (!scrapeThrottle.allowed) {
    const existingFallback = await getExistingFallbackPayload();
    if (existingFallback && existingFallback.source_provider === 'bitnodes_scrape') {
      const throttledPayload = {
        ...existingFallback,
        next_update: scrapeThrottle.waitUntil.toISOString(),
        fallback_reason: `${bitnodesErrorMessage}; Bitnodes scrape refresh delayed (${formatWaitCompact(scrapeThrottle.waitMs)})`,
      };
      await writeCachePayload(throttledPayload);
      return throttledPayload;
    }

    throw new Error(
      `${bitnodesErrorMessage}; Bitnodes scrape refresh delayed (${formatWaitCompact(scrapeThrottle.waitMs)})`,
    );
  }

  try {
    const nodesPageHtml = await fetchTextWithTimeout(BITNODES_NODES_PAGE_URL, 'text/html');
    const parsedScrape = parseBitnodesCountriesModal(nodesPageHtml);
    const scrapeBreakdown = parseBitnodesNetworkSummary(nodesPageHtml);
    const scrapeCacheUntil = parsedScrape?.as_of_date
      ? new Date(parsedScrape.as_of_date.getTime() + BITNODES_SCRAPE_MIN_INTERVAL_MS)
      : null;
    markScrapeRequest(now, scrapeCacheUntil);

    const payload = buildBitnodesScrapeFallbackPayload(parsedScrape, scrapeBreakdown, bitnodesErrorMessage, now);
    await writeCachePayload(payload);
    return payload;
  } catch (scrapeError) {
    const scrapeMessage = scrapeError instanceof Error ? scrapeError.message : String(scrapeError);
    const existingFallback = await getExistingFallbackPayload();
    if (existingFallback) {
      const stalePayload = {
        ...existingFallback,
        fallback_reason: `${bitnodesErrorMessage}; Bitnodes scrape failed: ${scrapeMessage}`,
      };
      await writeCachePayload(stalePayload);
      return stalePayload;
    }

    throw new Error(`${bitnodesErrorMessage}; Bitnodes scrape failed: ${scrapeMessage}`);
  }
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

export async function clearBitnodesCacheData() {
  memoryCache = null;
  await cacheDelete(SHARED_CACHE_KEY);

  try {
    await ensureRuntimeCacheDir();
    await writeFile(CACHE_FILE, '', 'utf8');
  } catch {
    /* ignore clear failures */
  }
}
