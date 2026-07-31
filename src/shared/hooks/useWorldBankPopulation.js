import { useEffect, useState } from 'react';
import { POPULATION_FALLBACK } from '@/shared/lib/geoCountryUtils.js';

const WB_POP_URL = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=500&mrv=1';
const CACHE_KEY = 'wb_pop_v1';
const TTL_MS = 24 * 60 * 60 * 1000;

export function useWorldBankPopulation() {
  const [populationMap, setPopulationMap] = useState(POPULATION_FALLBACK);
  const [popDataYear, setPopDataYear] = useState(null);
  const [popSource, setPopSource] = useState('fallback');
  const [popLastFetched, setPopLastFetched] = useState(null);

  useEffect(() => {
    let active = true;

    const apply = (map, year, fetchedAt, source) => {
      if (!active) return;
      setPopulationMap((prev) => ({ ...prev, ...map }));
      setPopDataYear(year);
      setPopSource(source);
      setPopLastFetched(fetchedAt);
    };

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Date.now() - Number(cached.fetchedAt || 0) < TTL_MS && Object.keys(cached.map || {}).length > 0) {
          apply(cached.map, cached.year, new Date(cached.fetchedAt).toISOString(), 'cache');
          return () => {
            active = false;
          };
        }
      }
    } catch {
      // Ignore malformed storage values and keep fallbacks.
    }

    (async () => {
      try {
        const res = await fetch(WB_POP_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!active) return;
        const entries = json[1];
        if (!Array.isArray(entries)) return;

        const map = {};
        let year = null;
        entries.forEach((entry) => {
          const code = String(entry?.country?.id || '').toUpperCase();
          const pop = Number(entry?.value);
          if (!/^[A-Z]{2}$/.test(code) || !Number.isFinite(pop) || pop <= 0) return;
          map[code] = pop / 1_000_000;
          if (!year) year = entry.date;
        });

        if (active && Object.keys(map).length > 0) {
          const fetchedAt = Date.now();
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ map, year, fetchedAt }));
          } catch {
            // Ignore storage failures.
          }
          apply(map, year, new Date(fetchedAt).toISOString(), 'worldbank');
        }
      } catch {
        // Keep fallback values when World Bank is unavailable.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { populationMap, popDataYear, popSource, popLastFetched };
}
