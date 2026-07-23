import http from 'node:http';
import net from 'node:net';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { normalizeTimestamp } from './timeUtils.js';

const FETCH_TIMEOUT_MS = 12_000;
const DAY_MS = 86_400_000;
const BITCOIN_RPC_ONION = String(process.env.BITCOIN_RPC_ONION || '').trim();
const BITCOIN_RPC_PORT = String(process.env.BITCOIN_RPC_PORT || '').trim();
const BITCOIN_RPC_USER = String(process.env.BITCOIN_RPC_USER || '').trim();
const BITCOIN_RPC_PASS = String(process.env.BITCOIN_RPC_PASS || '').trim();
const BITCOIN_TOR_SOCKS_PORT = String(process.env.BITCOIN_TOR_SOCKS_PORT || '').trim();
const BITCOIN_TOR_PROXY_URL = BITCOIN_TOR_SOCKS_PORT ? `socks5h://127.0.0.1:${BITCOIN_TOR_SOCKS_PORT}` : '';
const BINANCE_KLINES_BASE_URLS = [
  'https://api.binance.com/api/v3/klines',
  'https://api.binance.us/api/v3/klines',
];

export async function fetchJsonWithTimeout(url, {
  timeoutMs = FETCH_TIMEOUT_MS,
  headers,
} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Upstream request timeout');
    }
    if (error instanceof Error) throw error;
    throw new Error(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchTextWithTimeout(url, {
  timeoutMs = FETCH_TIMEOUT_MS,
  headers,
} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain, text/csv, text/html;q=0.9, */*;q=0.5',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Upstream request timeout');
    }
    if (error instanceof Error) throw error;
    throw new Error(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

export function hasTorBitcoinRpcConfig() {
  return Boolean(
    BITCOIN_RPC_ONION
      && BITCOIN_RPC_PORT
      && BITCOIN_RPC_USER
      && BITCOIN_RPC_PASS
      && BITCOIN_TOR_PROXY_URL,
  );
}

export function buildBitcoinRpcUrl() {
  if (!hasTorBitcoinRpcConfig()) return null;

  const baseUrl = /^https?:\/\//i.test(BITCOIN_RPC_ONION)
    ? BITCOIN_RPC_ONION
    : `http://${BITCOIN_RPC_ONION}`;

  const url = new URL(baseUrl);
  if (!url.port) {
    url.port = BITCOIN_RPC_PORT;
  }
  if (!url.pathname || url.pathname === '/') {
    url.pathname = '/';
  }
  return url;
}

export async function isLocalTcpPortReachable(port, host = '127.0.0.1', timeoutMs = 600) {
  const numericPort = Number(port);
  if (!Number.isInteger(numericPort) || numericPort <= 0) return false;

  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port: numericPort });

    const cleanup = () => {
      socket.removeAllListeners();
      socket.setTimeout(0);
    };

    const finish = (result, destroySocket = false) => {
      cleanup();
      if (destroySocket && !socket.destroyed) {
        socket.destroy();
      }
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, true));
    socket.once('timeout', () => finish(false, true));
    socket.once('error', () => {
      cleanup();
      resolve(false);
    });
  });
}

export async function _callBitcoinRpcOverTor(method, params = []) {
  const rpcUrl = buildBitcoinRpcUrl();
  if (!rpcUrl) {
    throw new Error('Bitcoin Tor RPC is not configured');
  }

  const torReady = await isLocalTcpPortReachable(BITCOIN_TOR_SOCKS_PORT);
  if (!torReady) {
    throw new Error('Bitcoin Tor SOCKS port is unavailable');
  }

  const bitcoinTorAgent = new SocksProxyAgent(BITCOIN_TOR_PROXY_URL);
  const payload = JSON.stringify({ jsonrpc: '1.0', id: method, method, params });

  return await new Promise((resolve, reject) => {
    const request = http.request(rpcUrl, {
      method: 'POST',
      agent: bitcoinTorAgent,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Basic ${Buffer.from(`${BITCOIN_RPC_USER}:${BITCOIN_RPC_PASS}`).toString('base64')}`,
      },
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        if ((response.statusCode || 500) >= 400) {
          reject(new Error(`Bitcoin RPC HTTP ${response.statusCode}`));
          return;
        }

        try {
          const json = JSON.parse(raw);
          if (json?.error) {
            reject(new Error(`Bitcoin RPC ${json.error.message || json.error.code || 'error'}`));
            return;
          }
          resolve(json?.result ?? null);
        } catch (error) {
          reject(new Error(error instanceof Error ? error.message : String(error)));
        }
      });
    });

    request.setTimeout(FETCH_TIMEOUT_MS, () => {
      request.destroy(new Error('Bitcoin RPC request timeout'));
    });
    request.on('error', (error) => {
      reject(error instanceof Error ? error : new Error(error instanceof Error ? error.message : String(error)));
    });
    request.write(payload);
    request.end();
  });
}

function normalizeBtcMapCountryAreaResponse(value) {
  if (!Array.isArray(value)) return null;
  const row = value.find((item) => String(item?.tags?.type || '').toLowerCase() === 'country') || value[0];
  const code = String(row?.tags?.iso_a2 || '').toUpperCase();
  const name = String(row?.tags?.name || '').trim();
  if (!/^[A-Z]{2}$/.test(code) || !name) return null;
  return {
    country_code: code,
    country_name: name,
    area_id: Number(row?.id) || null,
    resolved_at: normalizeTimestamp(),
  };
}

export async function fetchBtcMapCountryAreaForPlace(placeId) {
  const payload = await fetchJsonWithTimeout(`https://api.btcmap.org/v4/places/${placeId}/areas?type=country`);
  return normalizeBtcMapCountryAreaResponse(payload);
}

export function normalizeBtcMapPlace(row) {
  const id = Number(row?.id);
  const lat = Number(row?.lat);
  const lon = Number(row?.lon);
  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    id,
    lat,
    lon,
    name: String(row?.name || '').trim(),
    verified_at: row?.verified_at ? String(row.verified_at) : null,
    updated_at: row?.updated_at ? String(row.updated_at) : null,
  };
}

export async function fetchBtcMapPlacesPage(updatedSince, limit) {
  const params = new URLSearchParams({
    fields: 'id,lat,lon,name,verified_at,updated_at',
    updated_since: updatedSince,
    limit: String(limit),
  });

  return fetchJsonWithTimeout(`https://api.btcmap.org/v4/places?${params.toString()}`);
}

export async function fetchAllBtcMapPlaces() {
  const limit = 5000;
  const maxPages = 20;
  const seenIds = new Set();
  const places = [];
  let cursor = '1970-01-01T00:00:00Z';

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fetchBtcMapPlacesPage(cursor, limit);
    if (!Array.isArray(batch) || batch.length === 0) break;

    let addedCount = 0;
    batch.forEach((row) => {
      const place = normalizeBtcMapPlace(row);
      if (!place || seenIds.has(place.id)) return;
      seenIds.add(place.id);
      places.push(place);
      addedCount += 1;
    });

    if (batch.length < limit) break;

    const lastUpdatedAt = String(batch[batch.length - 1]?.updated_at || '');
    if (!lastUpdatedAt) break;
    if (addedCount === 0) {
      // A full page of duplicates means every row shares updated_at; bump the
      // cursor by 1ms so the next page can move past the shared timestamp.
      const bumped = new Date(new Date(lastUpdatedAt).getTime() + 1).toISOString();
      if (bumped === cursor) break;
      cursor = bumped;
      continue;
    }
    cursor = lastUpdatedAt;
  }

  return places;
}

export async function fetchBinanceCloseAtFromBase(base, startTimeMs) {
  const exactParams = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1d',
    startTime: String(startTimeMs),
    endTime: String(startTimeMs + DAY_MS),
    limit: '1',
  });

  const exact = await fetchJsonWithTimeout(`${base}?${exactParams.toString()}`);
  const exactClose = Number(exact?.[0]?.[4]);
  if (Number.isFinite(exactClose) && exactClose > 0) {
    return exactClose;
  }

  const fallbackParams = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1d',
    startTime: String(startTimeMs),
    limit: '1',
  });
  const fallback = await fetchJsonWithTimeout(`${base}?${fallbackParams.toString()}`);
  const close = Number(fallback?.[0]?.[4]);
  if (!Number.isFinite(close) || close <= 0) {
    throw new Error('Invalid Binance close value');
  }
  return close;
}

export async function fetchBinanceCloseAt(startTimeMs) {
  let lastError = null;

  for (const base of BINANCE_KLINES_BASE_URLS) {
    try {
      return await fetchBinanceCloseAtFromBase(base, startTimeMs);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Binance klines unavailable');
}
