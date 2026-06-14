/**
 * Hook: useBinanceHistoricalBTC
 * Fetches and manages historical Bitcoin (BTCUSDT) kline data from Binance API
 * Integrates with the dashboard's useModuleData pattern
 */

import { useCallback, useMemo } from 'react';
import { useModuleData } from './useModuleData';
import { fetchJson } from '@/shared/lib/api.js';

/**
 * Fetch and cache historical Bitcoin data from Binance
 *
 * @param {number} refreshMs - Auto-refresh interval in milliseconds (default: 300000 = 5 min)
 * @returns {Object} { waypoints, klines, loading, error, latestPrice, refetch }
 */
export function useBinanceHistoricalBTC(refreshMs = 300000) {
  // Fetch cached cycle data through the dashboard API instead of paginating
  // Binance directly in the browser on first load.
  const { data: points, loading, error, refetch } = useModuleData(
    useCallback(async () => {
      const payload = await fetchJson('/api/s18/btc-cycles', { timeout: 10_000 });
      return Array.isArray(payload?.data) ? payload.data : [];
    }, []),
    {
      refreshMs, // Auto-refresh every 5 minutes by default
      keepPreviousOnError: true, // Keep previous data if fetch fails
      initialData: [],
    }
  );

  // Transform klines to waypoint format { ts, price }
  const waypoints = useMemo(() => {
    if (!points || !Array.isArray(points)) {
      return [];
    }
    return points
      .map((point) => ({
        ts: Number(point?.ts),
        price: Number(point?.price),
      }))
      .filter((point) => Number.isFinite(point.ts) && Number.isFinite(point.price) && point.price > 0);
  }, [points]);

  // Get latest price from the most recent kline
  const latestPrice = useMemo(() => {
    if (!waypoints.length) {
      return null;
    }
    return waypoints[waypoints.length - 1].price;
  }, [waypoints]);

  return {
    waypoints,      // Formatted waypoints for visualization
    klines: points, // Backward-compatible raw data field
    loading,        // Is data being fetched
    error,          // Error object if fetch failed
    latestPrice,    // Latest Bitcoin price in USD
    refetch,        // Manual refetch function
    dataPoints: waypoints.length, // Total number of data points
  };
}

export default useBinanceHistoricalBTC;
