import { useEffect, useMemo, useRef, useState } from 'react';
import Info from 'lucide-react/dist/esm/icons/info';
import {
  useCompactViewport,
  useCountriesGeoJson,
} from '@/features/modules/live/shared/worldMapHooks.js';
import {
  computePerCapitaScale,
  getFillColorByPerCapita,
  formatPerCapitaValue,
  getFillColor,
  getDensityLabel,
  formatNextUpdateDelay,
} from '@/features/modules/live/shared/mapColorUtils.js';
import { useWorldBankPopulation } from '@/shared/hooks/useWorldBankPopulation.js';
import {
  COUNTRY_NAME_ALIASES,
  ISO_COUNTRY_NAMES,
  getFeatureCountryCode,
  getFeatureCountryName,
  isUnknownCountryValue,
  normalizeCountryName,
} from '@/shared/lib/geoCountryUtils.js';
import { fmt } from '@/shared/utils/formatters.js';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import MapLibreBase from '@/shared/map/MapLibreBase.jsx';
import { addChoroplethLayer } from '@/shared/map/choroplethUtils.js';
import { CHOROPLETH_DARK_STYLE } from '@/shared/map/mapDarkStyle.js';

const CACHE_ENDPOINT = '/api/bitnodes/cache';
const UNKNOWN_COUNTRY_LABEL = 'TOR Cyberspace';

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  warning: 'var(--accent-warning)',
  textSecondary: 'var(--text-secondary)',
  tor: '#A855F7',
};

const PROVIDER_LINKS = {
  bitnodes: 'https://bitnodes.es/index.php',
  bitnodes_scrape: 'https://bitnodes.es/index.php',
};

const NODE_DENSITY_SCALE = [
  { key: 'very-high', label: 'Very high', color: '#FF6A00', minNodes: 1001, legend: '> 1000' },
  { key: 'high',      label: 'High',      color: '#FF8C1A', minNodes: 201,  legend: '> 200'  },
  { key: 'mid',       label: 'Mid',       color: '#FFAA33', minNodes: 51,   legend: '> 50'   },
  { key: 'low',       label: 'Low',       color: '#FFC266', minNodes: 11,   legend: '> 10'   },
  { key: 'trace',     label: 'Trace',     color: '#FFD9A0', minNodes: 1,    legend: '<= 10'  },
];

const NODE_PERCAPITA_SCALE = [
  { key: 'very-high', label: 'Very high', color: '#FF6A00', minVal: 50, legend: '> 50 /M' },
  { key: 'high',      label: 'High',      color: '#FF8C1A', minVal: 20, legend: '> 20 /M' },
  { key: 'mid',       label: 'Mid',       color: '#FFAA33', minVal: 10, legend: '> 10 /M' },
  { key: 'low',       label: 'Low',       color: '#FFC266', minVal: 5,  legend: '> 5 /M'  },
  { key: 'trace',     label: 'Trace',     color: '#FFD9A0', minVal: 0,  legend: '<= 5 /M' },
];

const NODE_COLORS = ['#FF6A00', '#FF8C1A', '#FFAA33', '#FFC266', '#FFD9A0'];

function parseCountryCounts(payload) {
  if (Array.isArray(payload?.country_counts)) {
    return payload.country_counts
      .map((row) => ({
        country_code: String(row.country_code || '').toUpperCase(),
        country_name: String(row.country_name || '').trim(),
        nodes: Number(row.nodes) || 0,
      }))
      .filter((row) => (row.country_code || row.country_name) && row.nodes >= 0)
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
    .map(([country_code, nodes]) => ({ country_code, country_name: '', nodes }))
    .sort((a, b) => b.nodes - a.nodes);
}
function formatPct(value) {
  if (!Number.isFinite(Number(value))) return '0.00%';
  return `${Number(value).toFixed(2)}%`;
}
function isTorCyberspaceRow(label) {
  return String(label || '').toLowerCase().includes('tor cyberspace');
}

export default function S06_NodesMap() {
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);
  const [isDensityExpanded, setIsDensityExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('country'); // 'country' | 'perCapita'
  const isCompactViewport = useCompactViewport();

  const { data: countriesGeo, loading: geoLoading, error: geoError } = useCountriesGeoJson();
  const { populationMap, popDataYear, popSource, popLastFetched } = useWorldBankPopulation();

  // MapLibre refs + ready state
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);
  const tooltipRef   = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const viewModeRef  = useRef(viewMode);
  const perCapitaRef = useRef({});
  const scaleRef     = useRef(NODE_PERCAPITA_SCALE);
  const countsRef    = useRef({});

  const fetchBitnodes = async () => {
    const res = await fetch(CACHE_ENDPOINT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  const { data: payload, error: fetchError } = useModuleData(fetchBitnodes, {
    refreshMs: 600_000,
    keepPreviousOnError: true,
  });

  const cacheLoading  = !payload;
  const combinedError = (fetchError ? 'Could not load Bitnodes data.' : null) || geoError;
  const isPending     = payload?.status === 'pending' || !payload?.data;
  const isFallback    = Boolean(payload?.is_fallback);
  const nextUpdateDelay     = useMemo(() => formatNextUpdateDelay(payload?.next_update), [payload?.next_update]);
  const sourceProvider      = String(payload?.source_provider || '').toLowerCase();
  const sourceProviderLabel = sourceProvider === 'bitnodes_scrape' ? 'bitnodes (scrape)' : (payload?.source_provider || 'N/A');
  const sourceProviderUrl   = PROVIDER_LINKS[sourceProvider] || 'https://bitnodes.es/index.php';
  const fallbackNote        = String(payload?.fallback_note || 'Fallback active: Bitnodes API is unavailable. Showing Bitnodes countries modal snapshot from the website.');

  const countryCounts    = useMemo(() => parseCountryCounts(payload), [payload]);
  const networkBreakdown = payload?.data?.network_breakdown || null;
  const showBreakdownPanel = !isCompactViewport || isBreakdownExpanded;
  const showDensityLegend  = !isCompactViewport || isDensityExpanded;

  const featureCodeByName = useMemo(() => {
    const map = new Map();
    countriesGeo?.features?.forEach((feature, idx) => {
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (!code) return;
      const normalized = normalizeCountryName(name);
      if (normalized) map.set(normalized, code);
    });
    return map;
  }, [countriesGeo]);

  const featureNameByCode = useMemo(() => {
    const map = new Map();
    countriesGeo?.features?.forEach((feature, idx) => {
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (code) map.set(code, name);
    });
    return map;
  }, [countriesGeo]);

  const resolvedCountryRows = useMemo(() => {
    return countryCounts.map((row) => {
      const directCode     = String(row.country_code || '').toUpperCase();
      const countryName    = String(row.country_name || '').trim();
      const normalizedName = normalizeCountryName(countryName);
      const aliasedName    = COUNTRY_NAME_ALIASES[normalizedName] || normalizedName;
      const inferredCode   = featureCodeByName.get(aliasedName) || '';
      const resolvedCode   = /^[A-Z]{2}$/.test(directCode) ? directCode : inferredCode;
      const displayName    = featureNameByCode.get(resolvedCode) || ISO_COUNTRY_NAMES[resolvedCode] || '';
      const baseName = isUnknownCountryValue(countryName)
        ? (displayName || (/^[A-Z]{2}$/.test(resolvedCode) ? resolvedCode : UNKNOWN_COUNTRY_LABEL))
        : (countryName || displayName || resolvedCode || UNKNOWN_COUNTRY_LABEL);
      const label = resolvedCode && displayName ? `${baseName} (${resolvedCode})` : baseName;
      return { ...row, country_label: label, country_code_resolved: resolvedCode || 'UNKNOWN' };
    });
  }, [countryCounts, featureCodeByName, featureNameByCode]);

  const countsByCode = useMemo(() => {
    const map = {};
    resolvedCountryRows.forEach((row) => {
      const code = row.country_code_resolved;
      if (!/^[A-Z]{2}$/.test(code)) return;
      map[code] = (map[code] || 0) + row.nodes;
    });
    return map;
  }, [resolvedCountryRows]);

  const perCapitaByCode = useMemo(() => {
    const map = {};
    resolvedCountryRows.forEach((row) => {
      const code = row.country_code_resolved;
      if (!/^[A-Z]{2}$/.test(code) || populationMap[code] == null) return;
      map[code] = (countsByCode[code] || 0) / populationMap[code];
    });
    return map;
  }, [resolvedCountryRows, countsByCode, populationMap]);

  const maxPerCapita = useMemo(() => { const v = Object.values(perCapitaByCode); return v.length ? Math.max(...v) : 0; }, [perCapitaByCode]);
  const activePerCapitaScale = useMemo(() => computePerCapitaScale(maxPerCapita, NODE_PERCAPITA_SCALE, NODE_COLORS), [maxPerCapita]);

  const displayRows = useMemo(() => {
    if (viewMode === 'country') return resolvedCountryRows;
    return resolvedCountryRows
      .filter((r) => /^[A-Z]{2}$/.test(r.country_code_resolved) && populationMap[r.country_code_resolved] != null)
      .map((r) => ({ ...r, perCapita: r.nodes / populationMap[r.country_code_resolved] }))
      .sort((a, b) => b.perCapita - a.perCapita);
  }, [resolvedCountryRows, viewMode, populationMap]);

  const totalNodes = useMemo(() => {
    if (Number.isFinite(payload?.data?.total_nodes)) return payload.data.total_nodes;
    return countryCounts.reduce((sum, r) => sum + r.nodes, 0);
  }, [payload, countryCounts]);

  // Keep refs in sync for tooltip closure
  useEffect(() => { viewModeRef.current  = viewMode; },            [viewMode]);
  useEffect(() => { perCapitaRef.current = perCapitaByCode; },     [perCapitaByCode]);
  useEffect(() => { scaleRef.current     = activePerCapitaScale; }, [activePerCapitaScale]);
  useEffect(() => { countsRef.current    = countsByCode; },         [countsByCode]);

  // Build ISO→color map
  const colorMap = useMemo(() => {
    const map = {};
    if (viewMode === 'perCapita') {
      Object.entries(perCapitaByCode).forEach(([code, pc]) => { map[code] = getFillColorByPerCapita(pc, activePerCapitaScale); });
    } else {
      Object.entries(countsByCode).forEach(([code, n]) => { map[code] = getFillColor(n, NODE_DENSITY_SCALE); });
    }
    return map;
  }, [viewMode, countsByCode, perCapitaByCode, activePerCapitaScale]);

  const getTooltipHtml = (code) => {
    const count = countsRef.current[code] || 0;
    const name  = ISO_COUNTRY_NAMES[code] || code;
    if (viewModeRef.current === 'perCapita') {
      const pc = perCapitaRef.current[code];
      if (pc == null || pc <= 0) return `<span class="font-mono text-[12px] text-white/80">${name} (${code}): no data</span>`;
      const step = scaleRef.current.find((s) => pc >= s.minVal);
      return `<span class="font-mono text-[12px] text-white/80">${name} (${code}): ${formatPerCapitaValue(pc)} — ${step?.label ?? 'Trace'}</span>`;
    }
    return `<span class="font-mono text-[12px] text-white/80">${name} (${code}): ${fmt.num(count)} nodes — ${getDensityLabel(count, NODE_DENSITY_SCALE)}</span>`;
  };

  // Init choropleth when map + geo + data ready
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !countriesGeo || !Object.keys(countsByCode).length) return;
    layerRef.current?.destroy();
    layerRef.current = addChoroplethLayer(map, {
      geojson:        countriesGeo,
      colorMap,
      sourceId:       's06-countries',
      layerId:        's06-fill',
      tooltipEl:      tooltipRef.current,
      getTooltipHtml,
    });
  // mapReady ensures re-run after map init even if geo/data loaded first
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, countriesGeo, Object.keys(countsByCode).length]);

  // Update colors on mode / data change
  useEffect(() => { layerRef.current?.updateColors(colorMap); }, [colorMap]);

  const hasCountryData = countryCounts.length > 0;
  const isLoading   = (!hasCountryData && cacheLoading) || (!hasCountryData && geoLoading);
  const isMapLoading = (!payload && cacheLoading) || (!countriesGeo && geoLoading);

  return (
    <div className="visual-integrity-lock flex h-full w-full flex-col bg-[#111111] lg:flex-row">
      <div className="visual-map-surface relative min-h-[260px] min-w-0 flex-1 sm:min-h-[320px] lg:min-h-0">

        {/* Floating HTML tooltip */}
        <div
          ref={tooltipRef}
          style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 1002 }}
          className="rounded border border-white/15 bg-[#080808]/95 px-3 py-1.5 shadow-lg backdrop-blur-sm"
        />

        {isMapLoading ? (
          <div className="h-full w-full p-6">
            <div className="skeleton h-full w-full rounded-md" />
          </div>
        ) : (
          <>
            <MapLibreBase
              style={CHOROPLETH_DARK_STYLE}
              center={[10, 20]}
              zoom={2}
              minZoom={1}
              maxZoom={6}
              onMapReady={(map) => { mapRef.current = map; setMapReady(true); }}
            />
            {(isPending || !countryCounts.length) && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="max-w-[520px] rounded border border-white/10 bg-[#0d0d0d]/85 px-4 py-4 font-mono text-[12px] text-white/70 backdrop-blur-sm">
                  <div>{payload?.message || 'Country node counts are not yet available in cache.'}</div>
                  <div className="mt-2 text-white/45">
                    Next update: {nextUpdateDelay === 'N/A' ? 'N/A' : (nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Total nodes counter */}
        <div className="visual-integrity-lock absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-[#080808]/92 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm sm:bottom-5 sm:px-5 sm:py-2 sm:text-[12px]">
          {isLoading ? (
            <div className="skeleton" style={{ width: 170, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">Public Bitcoin Nodes: </span>
              <span className="font-bold text-white">{fmt.num(totalNodes)}</span>
            </>
          )}
        </div>

        {/* Density legend */}
        {!isMapLoading && !isPending && countryCounts.length > 0 && (
          <>
            {isCompactViewport && (
              <button
                type="button"
                onClick={() => setIsDensityExpanded((prev) => !prev)}
                className="visual-integrity-lock absolute left-3 top-3 z-[1001] min-h-[40px] rounded border border-white/15 bg-[#080808]/90 px-3 py-2 font-mono text-[12px] text-white/80 backdrop-blur-sm"
                aria-expanded={showDensityLegend}
                aria-controls="s06-density-legend"
              >
                {isDensityExpanded ? '◧' : '◨'} Density
              </button>
            )}
            {showDensityLegend && (() => {
              const activeScale = viewMode === 'perCapita' ? activePerCapitaScale : NODE_DENSITY_SCALE;
              const legendTitle = viewMode === 'perCapita' ? 'Per-capita node density' : 'Node concentration';
              return (
                <div id="s06-density-legend" className={`visual-integrity-lock absolute z-[1000] max-w-[calc(100%-1.5rem)] rounded border border-white/15 bg-[#080808]/88 px-3 py-2.5 font-mono text-[12px] backdrop-blur-sm ${isCompactViewport ? 'left-3 top-14' : 'left-3 top-3 sm:left-4 sm:top-4'}`}>
                  <div className="mb-0.5 text-white/75">{legendTitle}</div>
                  {viewMode === 'perCapita' && (
                    <div className="mb-1.5 text-[11px] text-white/40">nodes per million inhabitants</div>
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

      {/* ── Side panel ── */}
      <aside className="visual-integrity-lock relative flex h-[40%] min-h-0 w-full flex-none flex-col border-t border-white/10 bg-[#111111] lg:h-auto lg:w-[280px] lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[12px] tracking-wide text-white/60">
          Global Bitcoin Nodes
          <button
            type="button"
            onClick={() => setIsMetaExpanded((prev) => !prev)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] transition hover:border-white/25 hover:bg-white/[0.06]"
            aria-label="Data info"
            aria-expanded={isMetaExpanded}
            aria-controls="s06-meta-panel"
          >
            <Info size={13} style={{ color: isMetaExpanded ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.55)' }} />
          </button>
        </div>

        {/* Network breakdown */}
        <div className="border-b border-white/10 px-3 py-2">
          {isCompactViewport && (
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded((prev) => !prev)}
              className="flex min-h-[42px] w-full items-center justify-between rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-left font-mono text-[12px] text-white/70 transition hover:border-white/20"
              aria-expanded={showBreakdownPanel}
              aria-controls="s06-breakdown-panel"
            >
              <span>Network Breakdown {networkBreakdown ? `(${fmt.num(networkBreakdown.total_nodes)} nodes)` : ''}</span>
              <span style={{ color: 'var(--accent-bitcoin)' }}>{isBreakdownExpanded ? 'Hide' : 'Show'}</span>
            </button>
          )}
          {showBreakdownPanel && (
            networkBreakdown ? (
              <div id="s06-breakdown-panel" className={`${isCompactViewport ? 'mt-2' : ''} grid grid-cols-2 gap-1.5 font-mono text-[12px]`}>
                {[
                  ['Nodes', fmt.num(networkBreakdown.total_nodes)],
                  ['IPv4', `${fmt.num(networkBreakdown.ipv4_nodes)} (${formatPct(networkBreakdown.ipv4_pct)})`],
                  ['IPv6', `${fmt.num(networkBreakdown.ipv6_nodes)} (${formatPct(networkBreakdown.ipv6_pct)})`],
                  ['.onion', `${fmt.num(networkBreakdown.onion_nodes)} (${formatPct(networkBreakdown.onion_pct)})`],
                  ['Full nodes', `${fmt.num(networkBreakdown.full_nodes)} (${formatPct(networkBreakdown.full_pct)})`],
                  ['Pruned nodes', `${fmt.num(networkBreakdown.pruned_nodes)} (${formatPct(networkBreakdown.pruned_pct)})`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                    <div className="text-white/50">{label}</div>
                    <div className="text-white/85">{value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[11px] text-white/55">
                Breakdown unavailable
              </div>
            )
          )}
        </div>

        {/* View mode toggle */}
        <div className="border-b border-white/10 px-3 py-2">
          <div className="flex gap-1">
            {[['country', 'Node count'], ['perCapita', 'Per capita']].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className="flex-1 rounded border px-3 py-2 font-mono text-[12px] transition"
                style={viewMode === mode
                  ? { borderColor: 'var(--accent-bitcoin)', color: 'var(--accent-bitcoin)', backgroundColor: 'rgba(247,147,26,0.1)' }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Country list */}
        <div className="scrollbar-hidden-mobile min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-6 w-full rounded" />)}
            </div>
          ) : (
            <div className="space-y-1">
              {displayRows.map((item, index) => {
                const isTorRow = isTorCyberspaceRow(item.country_label);
                const dotColor = isTorRow
                  ? UI_COLORS.tor
                  : viewMode === 'perCapita' && item.perCapita != null
                    ? getFillColorByPerCapita(item.perCapita, activePerCapitaScale)
                    : getFillColor(item.nodes, NODE_DENSITY_SCALE);
                const valueLabel = viewMode === 'perCapita' && item.perCapita != null
                  ? formatPerCapitaValue(item.perCapita)
                  : fmt.num(item.nodes);
                return (
                  <div
                    key={`${item.country_label}-${item.country_code_resolved}-${index}`}
                    className="flex items-center justify-between rounded border px-2 py-1.5"
                    style={isTorRow
                      ? { borderColor: 'rgba(168, 85, 247, 0.45)', backgroundColor: 'rgba(168, 85, 247, 0.12)' }
                      : { borderColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="inline-block h-2 w-2 flex-none rounded-sm" style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }} />
                      <span className="truncate font-mono text-[12px] sm:text-[13px]" style={{ color: isTorRow ? UI_COLORS.tor : 'rgba(255, 255, 255, 0.8)' }}>
                        {item.country_label}
                      </span>
                    </span>
                    <span className="flex-none font-mono text-[12px] sm:text-[13px]" style={{ color: isTorRow ? UI_COLORS.tor : dotColor }}>
                      {valueLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / metadata */}
        <div className="relative border-t border-white/10 px-3 py-2 font-mono text-[11px]">
          <div className="hidden flex-wrap items-center gap-2 text-white/65 lg:flex">
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5">
              src: <a href={sourceProviderUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>{sourceProviderLabel}</a>
            </span>
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/75">
              refresh: {nextUpdateDelay === 'N/A' ? 'N/A' : (nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`)}
            </span>
            {viewMode === 'perCapita' && (
              <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/55">
                pop: {popSource === 'worldbank'
                  ? <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>World Bank</a>
                  : <span>estimates</span>}
                {popDataYear && ` · ${popDataYear}`}
              </span>
            )}
            {isFallback && (
              <span className="rounded border border-[#f7931a]/40 bg-[#f7931a]/10 px-1.5 py-0.5" style={{ color: 'var(--accent-warning)' }}>fallback</span>
            )}
            <button
              type="button"
              onClick={() => setIsMetaExpanded((prev) => !prev)}
              className="ml-auto rounded border border-white/10 bg-white/[0.02] px-2 py-1 text-white/70 transition hover:border-white/20"
              aria-expanded={isMetaExpanded}
              aria-controls="s06-meta-panel"
            >
              {isMetaExpanded ? 'Less' : 'Details'}
            </button>
          </div>

          {isMetaExpanded && (
            <div id="s06-meta-panel" className="scrollbar-hidden-mobile absolute inset-x-3 bottom-[calc(100%+0.5rem)] z-20 max-h-[min(42vh,20rem)] overflow-y-auto rounded border border-white/10 bg-[#111111]/96 px-2 py-1.5 text-white/55 shadow-[0_14px_36px_rgba(0,0,0,0.42)] backdrop-blur-sm lg:static lg:inset-auto lg:bottom-auto lg:mt-2 lg:max-h-none lg:overflow-visible lg:bg-white/[0.02] lg:shadow-none lg:backdrop-blur-0">
              <div>Source: <a href={sourceProviderUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>{sourceProviderLabel}</a></div>
              <div>Refresh: {nextUpdateDelay === 'N/A' ? 'N/A' : (nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`)}</div>
              <div>Coverage: {payload?.data?.coverage === 'countries_modal_all' ? 'countries modal (all)' : 'full snapshot'}</div>
              {isFallback && (
                <div className="mt-1" style={{ color: UI_COLORS.textSecondary }}>
                  <span style={{ color: UI_COLORS.warning }}>Fallback:</span> {fallbackNote}
                </div>
              )}
              <div className="mt-2 border-t border-white/10 pt-2">
                <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Population data</div>
                <div>Source: <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>World Bank</a>{popDataYear && ` · ${popDataYear}`}</div>
                <div>Cadence: annual (published mid-year)</div>
                <div>Cache TTL: 24 h · status: <span style={{ color: popSource === 'worldbank' ? '#00D897' : popSource === 'cache' ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.4)' }}>{popSource === 'worldbank' ? 'fresh fetch' : popSource === 'cache' ? 'from cache' : 'built-in estimates'}</span></div>
                {popLastFetched && <div style={{ color: 'rgba(255,255,255,0.4)' }}>Last fetched: {new Date(popLastFetched).toLocaleString()}</div>}
              </div>
            </div>
          )}
        </div>

        {combinedError && (
          <div className="border-t border-white/10 px-4 py-2 font-mono text-[11px]" style={{ color: UI_COLORS.warning }}>{combinedError}</div>
        )}
      </aside>
    </div>
  );
}
