/**
 * Hook: useBinanceHistoricalBTC
 * Fetches and manages historical Bitcoin (BTCUSDT) kline data from Binance API
 * Integrates with the dashboard's useModuleData pattern
 */

import { useCallback, useMemo } from 'react';
import { useModuleData } from './useModuleData';
import {
  fetchBTCHistoricalKlines,
  transformKlinesToWaypoints,
  getLatestPrice,
} from '@/shared/services/binanceApi';

/**
 * Fetch and cache historical Bitcoin data from Binance
 *
 * @param {number} refreshMs - Auto-refresh interval in milliseconds (default: 300000 = 5 min)
 * @returns {Object} { waypoints, klines, loading, error, latestPrice, refetch }
 */
export function useBinanceHistoricalBTC(refreshMs = 300000) {
  // Fetch raw klines from Binance API
  const { data: klines, loading, error, refetch } = useModuleData(
    useCallback(async () => {
      const klinesData = await fetchBTCHistoricalKlines();
      return klinesData;
    }, []),
    {
      refreshMs, // Auto-refresh every 5 minutes by default
      keepPreviousOnError: true, // Keep previous data if fetch fails
    }
  );

  // Transform klines to waypoint format { ts, price }
  const waypoints = useMemo(() => {
    if (!klines || !Array.isArray(klines)) {
      return [];
    }
    return transformKlinesToWaypoints(klines);
  }, [klines]);

  // Get latest price from the most recent kline
  const latestPrice = useMemo(() => {
    if (!klines || !Array.isArray(klines) || klines.length === 0) {
      return null;
    }
    return getLatestPrice(klines);
  }, [klines]);

  return {
    waypoints,      // Formatted waypoints for visualization
    klines,         // Raw Binance klines data
    loading,        // Is data being fetched
    error,          // Error object if fetch failed
    latestPrice,    // Latest Bitcoin price in USD
    refetch,        // Manual refetch function
    dataPoints: waypoints.length, // Total number of data points
  };
}

export default useBinanceHistoricalBTC;
