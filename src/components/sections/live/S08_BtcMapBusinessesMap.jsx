import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fmt } from '../../../utils/formatters';

const BUSINESSES_ENDPOINT = '/api/public/btcmap/businesses-by-country';
const COUNTRIES_URL = '/api/public/geo/countries';
const REFRESH_INTERVAL_MS = 10 * 60_000;

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  greenSoft: '#8EF0C8',
  warning: 'var(--accent-warning)',
  danger: 'var(--accent-red)',
};

const BUSINESS_DENSITY_SCALE = [
  { key: 'very-high', label: 'Very high', color: '#0A5F41', minBusinesses: 200, legend: '> 200' },
  { key: 'high', label: 'High', color: '#0E8A5B', minBusinesses: 100, legend: '> 100' },
  { key: 'mid', label: 'Mid', color: '#14B06F', minBusinesses: 50, legend: '> 50' },
  { key: 'low', label: 'Low', color: '#2FD48C', minBusinesses: 10, legend: '> 10' },
  { key: 'trace', label: 'Trace', color: '#8EF0C8', minBusinesses: 1, legend: '<= 10' },
];

function getFeatureCountryCode(feature) {
  const primary = String(feature?.properties?.ISO_A2 || feature?.properties?.iso_a2 || feature?.properties?.['ISO3166-1-Alpha-2'] || '').toUpperCase();
  const fallback = String(feature?.properties?.ISO_A2_EH || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(primary)) return primary;
  if (/^[A-Z]{2}$/.test(fallback)) return fallback;
  return primary || fallback;
}

function getFeatureCountryName(feature, idx) {
  return (
    feature?.properties?.ADMIN
    || feature?.properties?.NAME
    || feature?.properties?.name
    || `Country ${idx + 1}`
  );
}

function getDensityStepByCount(count) {
  const value = Number(count) || 0;
  return BUSINESS_DENSITY_SCALE.find((step) => value >= step.minBusinesses) || null;
}

function getFillColor(count) {
  const step = getDensityStepByCount(count);
  return step?.color || '#141414';
}

function getDensityLabel(count) {
  const step = getDensityStepByCount(count);
  return step?.label || 'No data';
}

function formatNextUpdateDelay(nextUpdateIso) {
  const next = new Date(String(nextUpdateIso || ''));
  if (!Number.isFinite(next.getTime())) return 'N/A';

  const diffMs = next.getTime() - Date.now();
  if (diffMs <= 0) return 'now';

  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.ceil(minutes / 60);
  return `${hours} h`;
}

export default function S08_BtcMapBusinessesMap() {
  const [payload, setPayload] = useState(null);
  const [countriesGeo, setCountriesGeo] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);
  const [isDensityExpanded, setIsDensityExpanded] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 1023px)');
    const handleChange = (event) => setIsCompactViewport(event.matches);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (isCompactViewport) {
      setIsDensityExpanded(false);
    }
  }, [isCompactViewport]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch(BUSINESSES_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!active) return;
        setPayload(json);
        setError(null);
      } catch {
        if (!active) return;
        setError('Could not load BTC Map businesses by country endpoint.');
      } finally {
        if (active) setApiLoading(false);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch(COUNTRIES_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const geo = data?.data || data;
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

  const countryCounts = useMemo(() => {
    if (!Array.isArray(payload?.data?.country_counts)) return [];
    return payload.data.country_counts
      .map((row) => ({
        country_code: String(row.country_code || '').toUpperCase(),
        country_name: String(row.country_name || '').trim(),
        businesses: Number(row.businesses) || 0,
        verified_businesses: Number(row.verified_businesses) || 0,
      }))
      .filter((row) => row.country_code && row.businesses > 0)
      .sort((a, b) => b.businesses - a.businesses);
  }, [payload]);

  const summary = payload?.data?.summary || {};
  const countsByCode = useMemo(() => Object.fromEntries(countryCounts.map((row) => [row.country_code, row])), [countryCounts]);
  const maxCount = useMemo(() => (countryCounts.length ? Math.max(...countryCounts.map((row) => row.businesses)) : 0), [countryCounts]);
  const nextUpdateDelay = useMemo(() => formatNextUpdateDelay(payload?.next_update_at), [payload?.next_update_at]);
  const isFallback = Boolean(payload?.is_fallback);
  const showBreakdownPanel = !isCompactViewport || isBreakdownExpanded;
  const showDensityLegend = !isCompactViewport || isDensityExpanded;
  const isLoading = apiLoading || geoLoading;

  return (
    <div className="flex h-full w-full flex-col bg-[#111111] lg:flex-row">
      <div className="relative min-h-[260px] min-w-0 flex-1 sm:min-h-[320px] lg:min-h-0">
        {isLoading ? (
          <div className="h-full w-full p-6">
            <div className="skeleton h-full w-full rounded-md" />
          </div>
        ) : !countryCounts.length ? (
          <div className="flex h-full w-full items-center justify-center p-6">
            <div className="max-w-[520px] rounded border border-white/10 bg-[#151515] px-4 py-4 font-mono text-[12px] text-white/70">
              <div>No BTC Map country business data is available yet.</div>
              <div className="mt-2 text-white/45">
                Next update: {nextUpdateDelay === 'N/A' ? 'N/A' : (nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`)}
              </div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[20, 10]}
            zoom={2}
            minZoom={2}
            maxZoom={6}
            keyboard={false}
            style={{ height: '100%', width: '100%', background: '#101010' }}
            zoomControl={false}
            attributionControl={false}
            worldCopyJump
          >
            {countriesGeo && (
              <GeoJSON
                key={`btcmap-countries-${maxCount}-${countryCounts.length}`}
                data={countriesGeo}
                style={(feature) => {
                  const code = getFeatureCountryCode(feature);
                  const row = countsByCode[code];
                  return {
                    color: '#24352d',
                    weight: 0.7,
                    fillColor: getFillColor(row?.businesses || 0),
                    fillOpacity: 0.92,
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const code = getFeatureCountryCode(feature);
                  const name = getFeatureCountryName(feature, 0);
                  const row = countsByCode[code] || { businesses: 0, verified_businesses: 0 };
                  layer.bindTooltip(
                    `${name} (${code || 'N/A'}): ${fmt.num(row.businesses)} businesses - ${fmt.num(row.verified_businesses)} verified - ${getDensityLabel(row.businesses)}`,
                    { sticky: true, opacity: 0.95 },
                  );
                }}
              />
            )}
          </MapContainer>
        )}

        <div className="absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-black/75 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm sm:bottom-5 sm:px-5 sm:py-2 sm:text-[12px]">
          {isLoading ? (
            <div className="skeleton" style={{ width: 210, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">Mapped Bitcoin Businesses: </span>
              <span className="font-bold text-white">{fmt.num(summary.matched_places || 0)}</span>
            </>
          )}
        </div>

        {!isLoading && countryCounts.length > 0 && (
          <>
            {isCompactViewport && (
              <button
                type="button"
                onClick={() => setIsDensityExpanded((prev) => !prev)}
                className="absolute left-3 top-3 z-[1001] rounded border border-white/15 bg-black/65 px-2 py-1 font-mono text-[11px] text-white/80 backdrop-blur-sm"
              >
                {isDensityExpanded ? '[-]' : '[+]'} Density
              </button>
            )}

            {showDensityLegend && (
              <div className={`absolute z-[1000] rounded border border-white/15 bg-black/55 px-2.5 py-2 font-mono text-[11px] backdrop-blur-sm ${isCompactViewport ? 'left-3 top-12' : 'left-3 top-3 sm:left-4 sm:top-4'}`}>
                <div className="mb-1 text-white/75">Business density</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {BUSINESS_DENSITY_SCALE.map((step) => (
                    <span key={step.label} className="inline-flex items-center gap-1 text-white/80">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: step.color, boxShadow: `0 0 6px ${step.color}` }} />
                      {step.label}
                      <span className="text-white/55">{step.legend}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <aside className="flex h-[42%] w-full flex-none flex-col border-t border-white/10 bg-[#111111] lg:h-auto lg:w-[300px] lg:border-l lg:border-t-0">
        <div className="border-b border-white/10 px-4 py-3 font-mono text-[12px] tracking-wide text-white/60">
          BTC Map Businesses by Country ({fmt.num(countryCounts.length)})
        </div>

        <div className="border-b border-white/10 px-3 py-2">
          {isCompactViewport && (
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-left font-mono text-[11px] text-white/70 transition hover:border-white/20"
            >
              <span>Coverage summary ({fmt.num(summary.matched_places || 0)} businesses)</span>
              <span style={{ color: UI_COLORS.greenSoft }}>{isBreakdownExpanded ? 'Hide' : 'Show'}</span>
            </button>
          )}

          {showBreakdownPanel && (
            <div className={`${isCompactViewport ? 'mt-2' : ''} grid grid-cols-2 gap-1.5 font-mono text-[11px]`}>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Businesses</div>
                <div className="text-white/85">{fmt.num(summary.matched_places || 0)}</div>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Countries</div>
                <div className="text-white/85">{fmt.num(summary.countries_covered || 0)}</div>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Verified</div>
                <div className="text-white/85">{fmt.num(summary.verified_places || 0)}</div>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Unmatched</div>
                <div className="text-white/85" style={{ color: summary.unmatched_places ? UI_COLORS.danger : 'rgba(255,255,255,0.85)' }}>
                  {fmt.num(summary.unmatched_places || 0)}
                </div>
              </div>
            </div>
          )}
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
              {countryCounts.map((item, index) => (
                <div
                  key={`${item.country_code}-${index}`}
                  className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 flex-none rounded-sm"
                      style={{ background: getFillColor(item.businesses), boxShadow: `0 0 4px ${getFillColor(item.businesses)}` }}
                    />
                    <span className="truncate font-mono text-[11px] text-white/80">
                      {item.country_name} ({item.country_code})
                    </span>
                  </span>
                  <span className="flex-none font-mono text-[11px]" style={{ color: getFillColor(item.businesses) }}>
                    {fmt.num(item.businesses)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-3 py-2 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setIsMetaExpanded((prev) => !prev)}
            className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left text-white/75 transition hover:border-white/20 lg:hidden"
          >
            Data info {isMetaExpanded ? 'Hide' : 'Show'}
          </button>

          <div className="hidden flex-wrap items-center gap-2 text-white/65 lg:flex">
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5">
              src:{' '}
              <a href="https://btcmap.org" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                BTC Map
              </a>
            </span>
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/75">
              refresh: {nextUpdateDelay === 'N/A' ? 'N/A' : (nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`)}
            </span>
            {isFallback && (
              <span className="rounded border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.08)] px-1.5 py-0.5" style={{ color: UI_COLORS.warning }}>
                fallback
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsMetaExpanded((prev) => !prev)}
              className="ml-auto rounded border border-white/10 bg-white/[0.02] px-1.5 py-0.5 text-white/70 transition hover:border-white/20"
            >
              {isMetaExpanded ? 'Less' : 'Details'}
            </button>
          </div>

          {isMetaExpanded && (
            <div className="mt-2 rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-white/55">
              <div>
                Source:{' '}
                <a href="https://api.btcmap.org/v4/places" target="_blank" rel="noreferrer" style={{ color: UI_COLORS.greenSoft, textDecoration: 'none' }}>
                  https://api.btcmap.org/v4/places
                </a>
              </div>
              <div>API: {BUSINESSES_ENDPOINT}</div>
              <div>
                Last snapshot: {payload?.updated_at ? `${fmt.date(payload.updated_at)} ${fmt.time(payload.updated_at)}` : 'N/A'}
              </div>
              <div>
                Latest place update: {summary.latest_place_update_at ? `${fmt.date(summary.latest_place_update_at)} ${fmt.time(summary.latest_place_update_at)}` : 'N/A'}
              </div>
              <div>Coverage: {fmt.num(summary.total_places || 0)} places scanned</div>
              {isFallback && payload?.fallback_note && (
                <div className="mt-1" style={{ color: UI_COLORS.warning }}>
                  Fallback: {payload.fallback_note}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-white/10 px-4 py-2 font-mono text-[11px]" style={{ color: UI_COLORS.warning }}>
            {error}
          </div>
        )}
      </aside>
    </div>
  );
}
