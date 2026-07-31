/**
 * Binance API Service
 * Fetches historical Bitcoin (BTCUSDT) kline data
 * No authentication required - public endpoint
 */

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const SYMBOL = 'BTCUSDT';
const DEFAULT_INTERVAL = '1d'; // Daily candles
const BINANCE_START_DATE = new Date('2017-08-17').getTime(); // Binance launch date

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(interval) {
  return `btc_klines_cache_${interval}`;
}

function getCacheExpiryKey(interval) {
  return `btc_klines_cache_expiry_${interval}`;
}

/**
 * Fetch all historical BTCUSDT daily klines from Binance
 * Uses pagination to handle the 1000-kline limit per request
 * Includes localStorage caching to minimize API calls
 *
 * @returns {Promise<Array>} Array of kline arrays [timestamp, open, high, low, close, volume, ...]
 * @throws {Error} If fetch fails after retries
 */
export async function fetchBTCHistoricalKlines(interval = DEFAULT_INTERVAL) {
  try {
    // Check cache first
    const cached = getCachedKlines(interval);
    if (cached) {
      console.log(`[Binance] Using cached ${interval} klines data`);
      return cached;
    }

    console.log(`[Binance] Fetching historical ${interval} klines from Binance API...`);
    const allKlines = [];
    let startTime = BINANCE_START_DATE;
    const now = Date.now();
    let requestCount = 0;

    // Pagination loop - fetch up to 1000 points at a time
    while (startTime < now) {
      try {
        const params = new URLSearchParams({
          symbol: SYMBOL,
          interval,
          startTime: startTime,
          limit: 1000, // Max allowed per request
        });

        const url = `${BINANCE_API_BASE}/klines?${params.toString()}`;
        const response = await fetch(url);

        if (response.status === 429) {
          // Rate limited - wait and retry with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, requestCount), 60000);
          console.warn(`[Binance] Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Retry same request
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const klines = await response.json();

        if (!Array.isArray(klines) || klines.length === 0) {
          break; // No more data
        }

        allKlines.push(...klines);
        requestCount++;

        // Move to next batch (start from last close time + 1ms)
        startTime = klines[klines.length - 1][6] + 1;

        // Rate limiting: add small delay between requests (100ms per request)
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log(`[Binance] Fetched ${klines.length} klines (total: ${allKlines.length})`);
      } catch (err) {
        console.error(`[Binance] Error fetching klines:`, err.message);
        throw err;
      }
    }

    console.log(`[Binance] Successfully fetched ${allKlines.length} total klines`);

    // Cache the result
    cacheKlines(interval, allKlines);

    return allKlines;
  } catch (error) {
    console.error('[Binance] Failed to fetch historical klines:', error);
    throw error;
  }
}

/**
 * Convert raw Binance klines to waypoint format
 * Expected by the S18 visualization
 *
 * @param {Array} klines - Raw klines array from Binance
 * @returns {Array} Array of { ts, price } objects
 */
export function transformKlinesToWaypoints(klines) {
  if (!Array.isArray(klines)) {
    console.warn('[Binance] Invalid klines input, returning empty array');
    return [];
  }

  return klines.map(kline => ({
    ts: parseInt(kline[0]), // Open Time (ms)
    price: parseFloat(kline[4]), // Close price (index 4)
  }));
}

/**
 * Get the latest Bitcoin price from klines
 * @param {Array} klines - Raw klines array
 * @returns {number|null} Latest close price or null
 */
export function getLatestPrice(klines) {
  if (!Array.isArray(klines) || klines.length === 0) {
    return null;
  }
  return parseFloat(klines[klines.length - 1][4]);
}

/**
 * Get price statistics (min, max) from waypoints
 * Useful for scaling visualizations
 *
 * @param {Array} waypoints - Array of { ts, price } objects
 * @returns {Object} { minPrice, maxPrice }
 */
export function getPriceStatistics(waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length === 0) {
    return { minPrice: 0, maxPrice: 100000 };
  }

  const prices = waypoints.map(w => w.price);
  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

/**
 * Cache klines data in localStorage with expiry
 * @param {Array} klines - Klines to cache
 */
function cacheKlines(interval, klines) {
  try {
    const cacheData = {
      klines,
      timestamp: Date.now(),
    };
    localStorage.setItem(getCacheKey(interval), JSON.stringify(cacheData));
    localStorage.setItem(getCacheExpiryKey(interval), String(Date.now() + CACHE_DURATION_MS));
    console.log(`[Binance] ${interval} klines cached in localStorage`);
  } catch (err) {
    console.warn('[Binance] Failed to cache klines:', err.message);
  }
}

/**
 * Get cached klines if still valid
 * @returns {Array|null} Cached klines or null if expired/missing
 */
function getCachedKlines(interval) {
  try {
    const cacheKey = getCacheKey(interval);
    const expiryKey = getCacheExpiryKey(interval);
    const expiryTime = localStorage.getItem(expiryKey);
    if (!expiryTime || Date.now() > parseInt(expiryTime)) {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(expiryKey);
      return null;
    }

    const cacheData = localStorage.getItem(cacheKey);
    if (!cacheData) return null;

    const { klines } = JSON.parse(cacheData);
    return klines;
  } catch (err) {
    console.warn('[Binance] Failed to retrieve cached klines:', err.message);
    return null;
  }
}

/**
 * Clear cached klines (useful for manual refresh)
 */
export function clearKlinesCache() {
  try {
    for (const interval of ['1m', '5m', '15m', '1h', '4h', '1d', '1w']) {
      localStorage.removeItem(getCacheKey(interval));
      localStorage.removeItem(getCacheExpiryKey(interval));
    }
    console.log('[Binance] Klines cache cleared');
  } catch (err) {
    console.warn('[Binance] Failed to clear cache:', err.message);
  }
}

export default {
  fetchBTCHistoricalKlines,
  transformKlinesToWaypoints,
  getLatestPrice,
  getPriceStatistics,
  clearKlinesCache,
};
