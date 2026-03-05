import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fmt } from '../../utils/formatters';

const CACHE_ENDPOINT = '/api/bitnodes/cache';
const COUNTRIES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

function getFeatureCountryCode(feature) {
  const code = feature?.properties?.ISO_A2 || feature?.properties?.iso_a2 || feature?.properties?.['ISO3166-1-Alpha-2'];
  return String(code || '').toUpperCase();
}

function getFeatureCountryName(feature, idx) {
  return (
    feature?.properties?.ADMIN
    || feature?.properties?.NAME
    || feature?.properties?.name
    || `Country ${idx + 1}`
  );
}

function getFillColor(count, maxCount) {
  if (!count || !maxCount) return '#141414';
  const ratio = count / maxCount;
  if (ratio >= 0.75) return '#f7931a';
  if (ratio >= 0.5) return '#c87717';
  if (ratio >= 0.25) return '#8e560f';
  return '#4b2c0b';
}

function parseCountryCounts(payload) {
  if (Array.isArray(payload?.country_counts)) {
    return payload.country_counts
      .map((row) => ({
        country_code: String(row.country_code || '').toUpperCase(),
        nodes: Number(row.nodes) || 0,
      }))
      .filter((row) => row.country_code && row.nodes >= 0)
      .sort((a, b) => b.nodes - a.nodes);
  }

  const sortedAsns = payload?.data?.sorted_asns;
  if (!Array.isArray(sortedAsns)) return [];

  const map = new Map();
  sortedAsns.forEach((row) => {
    if (!Array.isArray(row) || row.length < 4) return;
    const code = String(row[0] || '').toUpperCase();
    const count = Number(row[3]);
    if (!code || !Number.isFinite(count) || count < 0) return;
    map.set(code, (map.get(code) || 0) + count);
  });

  return [...map.entries()]
    .map(([country_code, nodes]) => ({ country_code, nodes }))
    .sort((a, b) => b.nodes - a.nodes);
}

export default function S08_NodesMap() {
  const [payload, setPayload] = useState(null);
  const [countriesGeo, setCountriesGeo] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(CACHE_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!active) return;
        setPayload(json);
        setError(null);
      } catch {
        if (!active) return;
        setError('Could not load local Bitnodes cache endpoint.');
      } finally {
        if (active) setCacheLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 60_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(COUNTRIES_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const geo = await res.json();
        if (!active) return;
        setCountriesGeo(geo);
      } catch {
        if (active) setError((prev) => prev || 'Could not load country boundaries.');
      } finally {
        if (active) setGeoLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const isPending = payload?.status === 'pending' || !payload?.data;
  const countryCounts = useMemo(() => parseCountryCounts(payload), [payload]);

  const countsByCode = useMemo(() => {
    const map = {};
    countryCounts.forEach((row) => {
      map[row.country_code] = row.nodes;
    });
    return map;
  }, [countryCounts]);

  const maxCount = useMemo(() => {
    if (!countryCounts.length) return 0;
    return Math.max(...countryCounts.map((x) => x.nodes));
  }, [countryCounts]);

  const geoCodes = useMemo(() => {
    const features = countriesGeo?.features;
    if (!Array.isArray(features)) return new Set();
    const set = new Set();
    features.forEach((feature) => {
      const code = getFeatureCountryCode(feature);
      if (code && code !== '-99') set.add(code);
    });
    return set;
  }, [countriesGeo]);

  const unknownCount = useMemo(
    () => countryCounts
      .filter((row) => !geoCodes.has(row.country_code))
      .reduce((sum, row) => sum + row.nodes, 0),
    [countryCounts, geoCodes],
  );

  const topCountries = useMemo(() => countryCounts.slice(0, 15), [countryCounts]);

  const totalNodes = useMemo(() => {
    if (Number.isFinite(payload?.data?.total_nodes)) return payload.data.total_nodes;
    return countryCounts.reduce((sum, row) => sum + row.nodes, 0);
  }, [payload, countryCounts]);

  const isLoading = cacheLoading || geoLoading;

  return (
    <div className="flex h-full w-full bg-[#111111]">
      <div className="relative min-w-0 flex-1">
        {isLoading ? (
          <div className="h-full w-full p-6">
            <div className="skeleton h-full w-full rounded-md" />
          </div>
        ) : isPending || !countryCounts.length ? (
          <div className="flex h-full w-full items-center justify-center p-6">
            <div className="max-w-[520px] rounded border border-white/10 bg-[#151515] px-4 py-4 font-mono text-[12px] text-white/70">
              <div>{payload?.message || 'Country node counts are not yet available in cache.'}</div>
              <div className="mt-2 text-white/45">Next update: {payload?.next_update || 'N/A'}</div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[20, 10]}
            zoom={2}
            minZoom={2}
            maxZoom={6}
            style={{ height: '100%', width: '100%', background: '#101010' }}
            zoomControl={false}
            attributionControl={false}
            worldCopyJump
          >
            {countriesGeo && (
              <GeoJSON
                key={`countries-${maxCount}-${countryCounts.length}`}
                data={countriesGeo}
                style={(feature) => {
                  const code = getFeatureCountryCode(feature);
                  const count = countsByCode[code] || 0;
                  return {
                    color: '#2d2d2d',
                    weight: 0.7,
                    fillColor: getFillColor(count, maxCount),
                    fillOpacity: 0.8,
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const code = getFeatureCountryCode(feature);
                  const name = getFeatureCountryName(feature, 0);
                  const count = countsByCode[code] || 0;
                  layer.bindTooltip(`${name} (${code || 'N/A'}): ${fmt.num(count)} nodes`, { sticky: true, opacity: 0.95 });
                }}
              />
            )}
          </MapContainer>
        )}

        <div className="absolute bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-black/75 px-5 py-2 font-mono text-[12px] backdrop-blur-sm">
          {isLoading ? (
            <div className="skeleton" style={{ width: 170, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">Public Bitcoin Nodes: </span>
              <span className="font-bold text-white">{fmt.num(totalNodes)}</span>
            </>
          )}
        </div>
      </div>

      <aside className="flex w-[280px] flex-none flex-col border-l border-white/10 bg-[#111111]">
        <div className="border-b border-white/10 px-4 py-3 font-mono text-[12px] tracking-wide text-white/60">
          Active Nodes by Country
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-6 w-full rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {topCountries.map((item) => (
                <div key={item.country_code} className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1.5">
                  <span className="truncate font-mono text-[11px] text-white/80">{item.country_code}</span>
                  <span className="font-mono text-[11px] text-[#f7931a]">{fmt.num(item.nodes)}</span>
                </div>
              ))}

              <div className="mt-3 rounded border border-white/5 bg-white/[0.02] px-2 py-1.5">
                <span className="font-mono text-[11px] text-white/50">Unmatched / Unknown: </span>
                <span className="font-mono text-[11px] text-white/75">{fmt.num(unknownCount)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-2 font-mono text-[10px] text-white/50">
          <div>Snapshot timestamp: {payload?.data?.timestamp || 'N/A'}</div>
          <div>Cache last_updated: {payload?.last_updated || 'N/A'}</div>
          <div>Cache next_update: {payload?.next_update || 'N/A'}</div>
        </div>

        {error && (
          <div className="border-t border-white/10 px-4 py-2 font-mono text-[10px] text-[#f7931a]">
            {error}
          </div>
        )}
      </aside>
    </div>
  );
}
