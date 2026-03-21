import { useEffect, useState } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js';

export const COMPACT_VIEWPORT_MEDIA_QUERY = '(max-width: 1023px)';
export const COUNTRIES_GEOJSON_ENDPOINT = '/api/public/geo/countries';

export function useCompactViewport() {
  return useMediaQuery(COMPACT_VIEWPORT_MEDIA_QUERY);
}

export function useCountriesGeoJson(url = COUNTRIES_GEOJSON_ENDPOINT) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        if (!active) return;
        setData(payload?.data || payload);
        setError('');
      } catch {
        if (!active) return;
        setError('Could not load country boundaries.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [url]);

  return { data, loading, error };
}
