/**
 * Binance API Service
 * Fetches historical Bitcoin (BTCUSDT) kline data
 * No authentication required - public endpoint
 */

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const SYMBOL = 'BTCUSDT';
const INTERVAL = '1d'; // Daily candles
const BINANCE_START_DATE = new Date('2017-08-17').getTime(); // Binance launch date

// Cache key for localStorage
const CACHE_KEY = 'btc_klines_cache';
const CACHE_EXPIRY_KEY = 'btc_klines_cache_expiry';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch all historical BTCUSDT daily klines from Binance
 * Uses pagination to handle the 1000-kline limit per request
 * Includes localStorage caching to minimize API calls
 *
 * @returns {Promise<Array>} Array of kline arrays [timestamp, open, high, low, close, volume, ...]
 * @throws {Error} If fetch fails after retries
 */
export async function fetchBTCHistoricalKlines() {
  try {
    // Check cache first
    const cached = getCachedKlines();
    if (cached) {
      console.log('[Binance] Using cached klines data');
      return cached;
    }

    console.log('[Binance] Fetching historical klines from Binance API...');
    const allKlines = [];
    let startTime = BINANCE_START_DATE;
    const now = Date.now();
    let requestCount = 0;

    // Pagination loop - fetch up to 1000 points at a time
    while (startTime < now) {
      try {
        const params = new URLSearchParams({
          symbol: SYMBOL,
          interval: INTERVAL,
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
    cacheKlines(allKlines);

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
function cacheKlines(klines) {
  try {
    const cacheData = {
      klines,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION_MS));
    console.log('[Binance] Klines cached in localStorage');
  } catch (err) {
    console.warn('[Binance] Failed to cache klines:', err.message);
  }
}

/**
 * Get cached klines if still valid
 * @returns {Array|null} Cached klines or null if expired/missing
 */
function getCachedKlines() {
  try {
    const expiryTime = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiryTime || Date.now() > parseInt(expiryTime)) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      return null;
    }

    const cacheData = localStorage.getItem(CACHE_KEY);
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
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
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
