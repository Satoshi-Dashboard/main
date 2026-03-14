import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  useCompactViewport,
  useCountriesGeoJson,
} from '@/features/modules/live/shared/worldMapHooks.js';
import { useWorldBankPopulation } from '@/shared/hooks/useWorldBankPopulation.js';
import { ISO_COUNTRY_NAMES, getFeatureCountryCode, getFeatureCountryName } from '@/shared/lib/geoCountryUtils.js';
import { fmt } from '@/shared/utils/formatters.js';

const BUSINESSES_ENDPOINT = '/api/public/btcmap/businesses-by-country';
const REFRESH_INTERVAL_MS = 10 * 60_000;

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  green: '#14B06F',
  greenSoft: '#8EF0C8',
  warning: 'var(--accent-warning)',
  danger: 'var(--accent-red)',
};

const BUSINESS_DENSITY_SCALE = [
  { key: 'very-high', label: 'Very high', color: '#0A5F41', minBusinesses: 200, legend: '> 200' },
  { key: 'high',      label: 'High',      color: '#0E8A5B', minBusinesses: 100, legend: '> 100' },
  { key: 'mid',       label: 'Mid',       color: '#14B06F', minBusinesses: 50,  legend: '> 50'  },
  { key: 'low',       label: 'Low',       color: '#2FD48C', minBusinesses: 10,  legend: '> 10'  },
  { key: 'trace',     label: 'Trace',     color: '#8EF0C8', minBusinesses: 1,   legend: '<= 10' },
];

// Fallback per-capita scale — replaced dynamically by computePerCapitaScale
const PERCAPITA_SCALE_FALLBACK = [
  { key: 'very-high', label: 'Very high', color: '#0A5F41', minVal: 50,    legend: '> 50 /M'  },
  { key: 'high',      label: 'High',      color: '#0E8A5B', minVal: 20,    legend: '> 20 /M'  },
  { key: 'mid',       label: 'Mid',       color: '#14B06F', minVal: 10,    legend: '> 10 /M'  },
  { key: 'low',       label: 'Low',       color: '#2FD48C', minVal: 5,     legend: '> 5 /M'   },
  { key: 'trace',     label: 'Trace',     color: '#8EF0C8', minVal: 0.001, legend: '> 0 /M'   },
];

function getDensityStepByCount(count) {
  const value = Number(count) || 0;
  return BUSINESS_DENSITY_SCALE.find((step) => value >= step.minBusinesses) || null;
}

function getFillColor(count) {
  const value = Number(count) || 0;
  if (value <= 0) return '#141414';
  return getDensityStepByCount(value)?.color || '#141414';
}

function getDensityLabel(count) {
  return getDensityStepByCount(count)?.label || 'No data';
}

function computePerCapitaScale(maxVal) {
  if (!maxVal || maxVal <= 0) return PERCAPITA_SCALE_FALLBACK;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude;
  const t4 = Math.max(1, Math.round(niceMax * 0.50));
  const t3 = Math.max(1, Math.round(niceMax * 0.25));
  const t2 = Math.max(1, Math.round(niceMax * 0.10));
  const t1 = Math.max(1, Math.round(niceMax * 0.05));
  return [
    { key: 'very-high', label: 'Very high', color: '#0A5F41', minVal: t4,    legend: `> ${t4} /M` },
    { key: 'high',      label: 'High',      color: '#0E8A5B', minVal: t3,    legend: `> ${t3} /M` },
    { key: 'mid',       label: 'Mid',       color: '#14B06F', minVal: t2,    legend: `> ${t2} /M` },
    { key: 'low',       label: 'Low',       color: '#2FD48C', minVal: t1,    legend: `> ${t1} /M` },
    { key: 'trace',     label: 'Trace',     color: '#8EF0C8', minVal: 0.001, legend: '> 0 /M'    },
  ];
}

function getFillColorByPerCapita(perCapita, scale) {
  const v = Number(perCapita) || 0;
  if (v <= 0) return '#141414';
  return ((scale || PERCAPITA_SCALE_FALLBACK).find((s) => v >= s.minVal) || {}).color || '#8EF0C8';
}

function formatPerCapitaValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return '0.0 /M';
  return numericValue >= 10 ? `${numericValue.toFixed(1)} /M` : `${numericValue.toFixed(2)} /M`;
}

function formatNextUpdateDelay(nextUpdateIso) {
  const next = new Date(String(nextUpdateIso || ''));
  if (!Number.isFinite(next.getTime())) return 'N/A';
  const diffMs = next.getTime() - Date.now();
  if (diffMs <= 0) return 'now';
  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.ceil(minutes / 60)} h`;
}

function resolveCountryLabel(code, name) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return name || 'Unknown';
  const resolvedName = name && name.length > 2 ? name : (ISO_COUNTRY_NAMES[code] || code);
  return `${resolvedName} (${code})`;
}

export default function S08_BtcMapBusinessesMap() {
  const [payload, setPayload] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);
  const [isDensityExpanded, setIsDensityExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('country'); // 'country' | 'perCapita'
  const isCompactViewport = useCompactViewport();
  const {
    data: countriesGeo,
    loading: geoLoading,
    error: geoError,
  } = useCountriesGeoJson();

  const { populationMap, popDataYear, popSource, popLastFetched } = useWorldBankPopulation();

  useEffect(() => {
    if (isCompactViewport) setIsDensityExpanded(false);
  }, [isCompactViewport]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(BUSINESSES_ENDPOINT);
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
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (geoError) {
      setError((prev) => prev || geoError);
    }
  }, [geoError]);

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

  const perCapitaByCode = useMemo(() => {
    const map = {};
    countryCounts.forEach((row) => {
      const code = row.country_code;
      if (!/^[A-Z]{2}$/.test(code) || populationMap[code] == null) return;
      map[code] = row.businesses / populationMap[code];
    });
    return map;
  }, [countryCounts, populationMap]);

  const maxPerCapita = useMemo(() => {
    const vals = Object.values(perCapitaByCode);
    return vals.length ? Math.max(...vals) : 0;
  }, [perCapitaByCode]);

  const activePerCapitaScale = useMemo(() => computePerCapitaScale(maxPerCapita), [maxPerCapita]);

  const displayRows = useMemo(() => {
    if (viewMode === 'country') return countryCounts;
    return countryCounts
      .filter((row) => /^[A-Z]{2}$/.test(row.country_code) && populationMap[row.country_code] != null)
      .map((row) => ({ ...row, perCapita: row.businesses / populationMap[row.country_code] }))
      .sort((a, b) => b.perCapita - a.perCapita);
  }, [countryCounts, viewMode, populationMap]);

  const nextUpdateDelay = useMemo(() => formatNextUpdateDelay(payload?.next_update_at), [payload?.next_update_at]);
  const isFallback = Boolean(payload?.is_fallback);
  const showBreakdownPanel = !isCompactViewport || isBreakdownExpanded;
  const showDensityLegend = !isCompactViewport || isDensityExpanded;
  const hasCountryData = countryCounts.length > 0;
  const isLoading = (!hasCountryData && apiLoading) || (!hasCountryData && geoLoading);
  const isMapLoading = (!payload && apiLoading) || (!countriesGeo && geoLoading);

  return (
    <div className="visual-integrity-lock flex h-full w-full flex-col bg-[#111111] lg:flex-row">
      <div className="visual-map-surface relative min-h-[260px] min-w-0 flex-1 sm:min-h-[320px] lg:min-h-0">
        {isMapLoading ? (
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
                key={`btcmap-${maxCount}-${countryCounts.length}-${viewMode}`}
                data={countriesGeo}
                style={(feature) => {
                  const code = getFeatureCountryCode(feature);
                  const fillColor = viewMode === 'perCapita'
                    ? getFillColorByPerCapita(perCapitaByCode[code], activePerCapitaScale)
                    : getFillColor(countsByCode[code]?.businesses || 0);
                  return { color: '#24352d', weight: 0.7, fillColor, fillOpacity: 0.92 };
                }}
                onEachFeature={(feature, layer) => {
                  const code = getFeatureCountryCode(feature);
                  const name = getFeatureCountryName(feature, 0);
                  const row = countsByCode[code] || { businesses: 0, verified_businesses: 0 };
                  const displayCode = code || 'N/A';
                  const tooltipText = viewMode === 'perCapita'
                    ? (() => {
                        const pc = perCapitaByCode[code];
                        if (pc == null || pc <= 0) return `${name} (${displayCode}): no data`;
                        const step = activePerCapitaScale.find((s) => pc >= s.minVal);
                        return `${name} (${displayCode}): ${formatPerCapitaValue(pc)} — ${step?.label ?? 'Trace'}`;
                      })()
                    : `${name} (${displayCode}): ${fmt.num(row.businesses)} businesses — ${fmt.num(row.verified_businesses)} verified — ${getDensityLabel(row.businesses)}`;
                  layer.bindTooltip(tooltipText, { sticky: true, opacity: 0.95 });
                }}
              />
            )}
          </MapContainer>
        )}

        <div className="visual-integrity-lock absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-[#080808]/92 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm sm:bottom-5 sm:px-5 sm:py-2 sm:text-[12px]">
          {isLoading ? (
            <div className="skeleton" style={{ width: 210, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">Bitcoin-Accepting Businesses: </span>
              <span className="font-bold text-white">{fmt.num(summary.matched_places || 0)}</span>
            </>
          )}
        </div>

        {!isMapLoading && countryCounts.length > 0 && (
          <>
            {isCompactViewport && (
              <button
                type="button"
                onClick={() => setIsDensityExpanded((prev) => !prev)}
                className="visual-integrity-lock absolute left-3 top-3 z-[1001] rounded border border-white/15 bg-[#080808]/90 px-2 py-1 font-mono text-[11px] text-white/80 backdrop-blur-sm"
              >
                {isDensityExpanded ? '◧' : '◨'} Density
              </button>
            )}

            {showDensityLegend && (() => {
              const activeScale = viewMode === 'perCapita' ? activePerCapitaScale : BUSINESS_DENSITY_SCALE;
              const legendTitle = viewMode === 'perCapita' ? 'Per-capita business density' : 'Business concentration';
              return (
                <div className={`visual-integrity-lock absolute z-[1000] rounded border border-white/15 bg-[#080808]/88 px-2.5 py-2 font-mono text-[11px] backdrop-blur-sm ${isCompactViewport ? 'left-3 top-12' : 'left-3 top-3 sm:left-4 sm:top-4'}`}>
                  <div className="mb-0.5 text-white/75">{legendTitle}</div>
                  {viewMode === 'perCapita' && (
                    <div className="mb-1.5 text-white/40" style={{ fontSize: '9px' }}>businesses per million inhabitants</div>
                  )}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {activeScale.map((step) => (
                      <span key={step.key} className="inline-flex items-center gap-1 text-white/80">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: step.color, boxShadow: `0 0 6px ${step.color}` }} />
                        {step.label}
                        <span className="text-white/55">{step.legend}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      <aside className="visual-integrity-lock flex h-[42%] w-full flex-none flex-col border-t border-white/10 bg-[#111111] lg:h-auto lg:w-[300px] lg:border-l lg:border-t-0">
        <div className="border-b border-white/10 px-4 py-3 font-mono text-[12px] tracking-wide text-white/60">
          Bitcoin-Friendly Businesses
        </div>

        <div className="border-b border-white/10 px-3 py-2">
          {isCompactViewport && (
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-left font-mono text-[11px] text-white/70 transition hover:border-white/20"
            >
              <span>Coverage summary · {fmt.num(summary.matched_places || 0)} businesses</span>
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

        <div className="border-b border-white/10 px-3 py-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setViewMode('country')}
              className="flex-1 rounded border px-2 py-1 font-mono text-[10px] transition"
              style={viewMode === 'country'
                ? { borderColor: UI_COLORS.green, color: UI_COLORS.green, backgroundColor: 'rgba(20,176,111,0.1)' }
                : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' }}
            >
              Business count
            </button>
            <button
              type="button"
              onClick={() => setViewMode('perCapita')}
              className="flex-1 rounded border px-2 py-1 font-mono text-[10px] transition"
              style={viewMode === 'perCapita'
                ? { borderColor: UI_COLORS.green, color: UI_COLORS.green, backgroundColor: 'rgba(20,176,111,0.1)' }
                : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' }}
            >
              Per capita
            </button>
          </div>
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
              {displayRows.map((item, index) => {
                const dotColor = viewMode === 'perCapita' && item.perCapita != null
                  ? getFillColorByPerCapita(item.perCapita, activePerCapitaScale)
                  : getFillColor(item.businesses);
                const valueLabel = viewMode === 'perCapita' && item.perCapita != null
                  ? formatPerCapitaValue(item.perCapita)
                  : fmt.num(item.businesses);
                const label = resolveCountryLabel(item.country_code, item.country_name);
                return (
                  <div
                    key={`${item.country_code}-${index}`}
                    className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 flex-none rounded-sm"
                        style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }}
                      />
                      <span className="truncate font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {label}
                      </span>
                    </span>
                    <span className="flex-none font-mono text-[11px]" style={{ color: dotColor }}>
                      {valueLabel}
                    </span>
                  </div>
                );
              })}
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
            {viewMode === 'perCapita' && (
              <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/55">
                pop:{' '}
                {popSource === 'worldbank' || popSource === 'cache' ? (
                  <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                    World Bank
                  </a>
                ) : <span>estimates</span>}
                {popDataYear && ` · ${popDataYear}`}
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
                  api.btcmap.org/v4/places
                </a>
              </div>
              <div>API: {BUSINESSES_ENDPOINT}</div>
              <div>Last snapshot: {payload?.updated_at ? `${fmt.date(payload.updated_at)} ${fmt.time(payload.updated_at)}` : 'N/A'}</div>
              <div>Latest place update: {summary.latest_place_update_at ? `${fmt.date(summary.latest_place_update_at)} ${fmt.time(summary.latest_place_update_at)}` : 'N/A'}</div>
              <div>Coverage: {fmt.num(summary.total_places || 0)} places scanned</div>
              {isFallback && payload?.fallback_note && (
                <div className="mt-1" style={{ color: UI_COLORS.warning }}>Fallback: {payload.fallback_note}</div>
              )}
              <div className="mt-2 border-t border-white/10 pt-2">
                <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Population data</div>
                <div>
                  Source:{' '}
                  <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                    World Bank
                  </a>
                  {popDataYear && ` · ${popDataYear}`}
                </div>
                <div>Cadence: annual (published mid-year)</div>
                <div>
                  Cache TTL: 24 h · status:{' '}
                  <span style={{ color: popSource === 'worldbank' ? '#00D897' : popSource === 'cache' ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.4)' }}>
                    {popSource === 'worldbank' ? 'fresh fetch' : popSource === 'cache' ? 'from cache' : 'built-in estimates'}
                  </span>
                </div>
                {popLastFetched && (
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>Last fetched: {new Date(popLastFetched).toLocaleString()}</div>
                )}
              </div>
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
