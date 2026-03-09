import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fmt } from '@/shared/utils/formatters.js';

const LIGHTNING_WORLD_ENDPOINT = '/api/public/lightning/world';
const COUNTRIES_URL = '/api/public/geo/countries';
const UNKNOWN_COUNTRY_LABEL = 'Unknown region';
const REFRESH_INTERVAL_MS = 60_000;

const UI_COLORS = {
  lightning: '#3BA3FF',
  lightningSoft: '#6CC0FF',
  warning: 'var(--accent-warning)',
};

const NODE_DENSITY_SCALE = [
  { key: 'very-high', label: 'Very high', color: '#0A3D91', minNodes: 801, legend: '> 800' },
  { key: 'high', label: 'High', color: '#145BB8', minNodes: 201, legend: '> 200' },
  { key: 'mid', label: 'Mid', color: '#1E78D8', minNodes: 51, legend: '> 50' },
  { key: 'low', label: 'Low', color: '#49A5EB', minNodes: 11, legend: '> 10' },
  { key: 'trace', label: 'Trace', color: '#93CCF7', minNodes: 1, legend: '<= 10' },
];

const COUNTRY_NAME_ALIASES = {
  'united states': 'united states of america',
  'russian federation': 'russia',
  'korea the republic of': 'south korea',
  'czechia': 'czech republic',
  'n a': 'unknown',
};

const BTC_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

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

function normalizeCountryName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\(the\s+/gi, '(')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

function isUnknownCountryValue(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized === 'n/a' || normalized === 'na' || normalized === 'unknown';
}

function getDensityStepByCount(count) {
  const value = Number(count) || 0;
  return NODE_DENSITY_SCALE.find((step) => value >= step.minNodes) || null;
}

function getFillColor(count) {
  const step = getDensityStepByCount(count);
  return step?.color || '#141414';
}

function formatBtcFromSats(value) {
  const sats = Number(value);
  if (!Number.isFinite(sats) || sats <= 0) return '0 BTC';
  return `${BTC_FORMATTER.format(sats / 100_000_000)} BTC`;
}

function formatNextUpdateDelay(nextUpdateMs) {
  if (!Number.isFinite(nextUpdateMs)) return 'N/A';

  const diffMs = nextUpdateMs - Date.now();
  if (diffMs <= 0) return 'now';

  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.ceil(minutes / 60);
  return `${hours} h`;
}

function parseLightningCountryCounts(payload) {
  const nodes = payload?.nodes;
  if (!Array.isArray(nodes)) return [];

  const map = new Map();

  nodes.forEach((row) => {
    if (!Array.isArray(row)) return;

    const capacity = Number(row[4]);
    const channels = Number(row[5]);
    const countryMeta = row[6];
    const countryCodeRaw = String(row[7] || '').toUpperCase();
    const countryCode = /^[A-Z]{2}$/.test(countryCodeRaw) ? countryCodeRaw : '';
    const countryName = typeof countryMeta === 'string'
      ? countryMeta.trim()
      : (
        String(countryMeta?.en || '').trim()
        || String(countryMeta?.['pt-BR'] || '').trim()
        || String(Object.values(countryMeta || {})[0] || '').trim()
      );

    const normalizedName = normalizeCountryName(countryName);
    const key = countryCode || normalizedName || 'UNKNOWN';
    const existing = map.get(key) || {
      country_code: countryCode,
      country_name: countryName,
      nodes: 0,
      channels: 0,
      capacity: 0,
    };

    existing.country_code = existing.country_code || countryCode;
    existing.country_name = existing.country_name || countryName;
    existing.nodes += 1;
    existing.channels += Number.isFinite(channels) && channels > 0 ? channels : 0;
    existing.capacity += Number.isFinite(capacity) && capacity > 0 ? capacity : 0;

    map.set(key, existing);
  });

  return [...map.values()].sort((a, b) => b.nodes - a.nodes);
}

export default function S07_LightningNodesMap() {
  const [payload, setPayload] = useState(null);
  const [countriesGeo, setCountriesGeo] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);
  const [isDensityExpanded, setIsDensityExpanded] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
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
        const res = await fetch(LIGHTNING_WORLD_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        const json = payload?.data || payload;
        if (!active) return;
        setPayload({
          source_provider: payload?.source_provider || 'mempool.space',
          fetched_at: payload?.updated_at ? new Date(payload.updated_at).getTime() : Date.now(),
          data: json,
        });
        setError(null);
      } catch {
        if (!active) return;
        setError('Could not load Lightning nodes world API.');
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
        const payload = await res.json();
        const geo = payload?.data || payload;
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

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const countryCounts = useMemo(() => parseLightningCountryCounts(payload?.data), [payload?.data]);
  const nextUpdateDelay = useMemo(
    () => formatNextUpdateDelay((payload?.fetched_at || nowTs) + REFRESH_INTERVAL_MS),
    [payload?.fetched_at, nowTs],
  );
  const sourceProviderLabel = payload?.source_provider || 'mempool.space';
  const showBreakdownPanel = !isCompactViewport || isBreakdownExpanded;
  const showDensityLegend = !isCompactViewport || isDensityExpanded;

  const featureCodeByName = useMemo(() => {
    const map = new Map();
    const features = countriesGeo?.features;
    if (!Array.isArray(features)) return map;

    features.forEach((feature, idx) => {
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (!code) return;
      const normalized = normalizeCountryName(name);
      if (!normalized) return;
      map.set(normalized, code);
    });

    return map;
  }, [countriesGeo]);

  const featureNameByCode = useMemo(() => {
    const map = new Map();
    const features = countriesGeo?.features;
    if (!Array.isArray(features)) return map;

    features.forEach((feature, idx) => {
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (!code) return;
      map.set(code, name);
    });

    return map;
  }, [countriesGeo]);

  const resolvedCountryRows = useMemo(() => {
    return countryCounts.map((row) => {
      const directCode = String(row.country_code || '').toUpperCase();
      const countryName = String(row.country_name || '').trim();
      const normalizedName = normalizeCountryName(countryName);
      const aliasedName = COUNTRY_NAME_ALIASES[normalizedName] || normalizedName;
      const inferredCode = featureCodeByName.get(aliasedName) || '';
      const resolvedCode = /^[A-Z]{2}$/.test(directCode) ? directCode : inferredCode;
      const resolvedNameFromCode = featureNameByCode.get(resolvedCode) || '';
      const baseName = isUnknownCountryValue(countryName)
        ? UNKNOWN_COUNTRY_LABEL
        : (countryName || resolvedNameFromCode || resolvedCode || UNKNOWN_COUNTRY_LABEL);
      const label = resolvedCode && resolvedNameFromCode
        ? `${baseName} (${resolvedCode})`
        : baseName;

      return {
        ...row,
        country_label: label,
        country_code_resolved: resolvedCode || 'UNKNOWN',
      };
    });
  }, [countryCounts, featureCodeByName, featureNameByCode]);

  const metricRows = useMemo(
    () => resolvedCountryRows.filter((row) => /^[A-Z]{2}$/.test(row.country_code_resolved)),
    [resolvedCountryRows],
  );

  const statsByCode = useMemo(() => {
    const map = {};

    metricRows.forEach((row) => {
      const code = row.country_code_resolved;
      if (!/^[A-Z]{2}$/.test(code)) return;

      map[code] = {
        nodes: (map[code]?.nodes || 0) + row.nodes,
        channels: (map[code]?.channels || 0) + row.channels,
        capacity: (map[code]?.capacity || 0) + row.capacity,
      };
    });

    return map;
  }, [metricRows]);

  const totals = useMemo(() => {
    return metricRows.reduce((acc, row) => {
      acc.nodes += row.nodes;
      acc.channels += row.channels;
      acc.capacity += row.capacity;
      return acc;
    }, { nodes: 0, channels: 0, capacity: 0 });
  }, [metricRows]);

  const maxCount = useMemo(() => {
    if (!resolvedCountryRows.length) return 0;
    return Math.max(...resolvedCountryRows.map((row) => row.nodes));
  }, [resolvedCountryRows]);

  const allCountries = useMemo(() => resolvedCountryRows, [resolvedCountryRows]);
  const avgChannelsPerNode = totals.nodes > 0 ? totals.channels / totals.nodes : 0;
  const maxChannels = Number(payload?.data?.maxChannels) || 0;
  const maxLiquidity = Number(payload?.data?.maxLiquidity) || 0;
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
              <div>No country data returned by Lightning world API.</div>
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
                key={`countries-${maxCount}-${countryCounts.length}`}
                data={countriesGeo}
                style={(feature) => {
                  const code = getFeatureCountryCode(feature);
                  const nodes = statsByCode[code]?.nodes || 0;
                  return {
                    color: '#2d2d2d',
                    weight: 0.7,
                    fillColor: getFillColor(nodes),
                    fillOpacity: 0.9,
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const code = getFeatureCountryCode(feature);
                  const name = getFeatureCountryName(feature, 0);
                  const countryStats = statsByCode[code] || { nodes: 0, channels: 0, capacity: 0 };
                  const displayCode = code && code !== '-99' ? code : UNKNOWN_COUNTRY_LABEL;
                  layer.bindTooltip(
                    `${name} (${displayCode}): ${fmt.num(countryStats.nodes)} nodes - ${fmt.num(countryStats.channels)} channels - ${formatBtcFromSats(countryStats.capacity)}`,
                    { sticky: true, opacity: 0.95 },
                  );
                }}
              />
            )}
          </MapContainer>
        )}

        <div className="absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-black/75 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm sm:bottom-5 sm:px-5 sm:py-2 sm:text-[12px]">
          {isLoading ? (
            <div className="skeleton" style={{ width: 190, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">Public Lightning Nodes: </span>
              <span className="text-white/45">(Tor nodes excluded) </span>
              <span className="font-bold text-white">{fmt.num(totals.nodes)}</span>
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
                <div className="mb-1 text-white/75">Node density</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {NODE_DENSITY_SCALE.map((step) => (
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
          Lightning Nodes by Country ({fmt.num(allCountries.length)})
        </div>

        <div className="border-b border-white/10 px-3 py-2">
          {isCompactViewport && (
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-left font-mono text-[11px] text-white/70 transition hover:border-white/20"
            >
              <span>Lightning breakdown (Tor nodes excluded) ({fmt.num(totals.nodes)} nodes)</span>
              <span style={{ color: UI_COLORS.lightning }}>{isBreakdownExpanded ? 'Hide' : 'Show'}</span>
            </button>
          )}

          {showBreakdownPanel && (
            <div className={`${isCompactViewport ? 'mt-2' : ''} grid grid-cols-2 gap-1.5 font-mono text-[11px]`}>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Nodes</div>
                <div className="text-white/85">{fmt.num(totals.nodes)}</div>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Channels</div>
                <div className="text-white/85">{fmt.num(totals.channels)}</div>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Capacity</div>
                <div className="text-white/85">{formatBtcFromSats(totals.capacity)}</div>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                <div className="text-white/50">Avg channels / node</div>
                <div className="text-white/85">{avgChannelsPerNode.toFixed(1)}</div>
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
              {allCountries.map((item, index) => (
                <div
                  key={`${item.country_label}-${item.country_code_resolved}-${index}`}
                  className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
                >
                  <span className="truncate font-mono text-[11px] text-white/80">
                    {item.country_label}
                  </span>
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: getFillColor(item.nodes) }}
                  >
                    {fmt.num(item.nodes)}
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
              <a href="https://mempool.space" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                {sourceProviderLabel}
              </a>
            </span>
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/75">
              refresh: {nextUpdateDelay === 'N/A' ? 'N/A' : (nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`)}
            </span>
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
                <a href="https://mempool.space/graphs/lightning/nodes-channels-map" target="_blank" rel="noreferrer" style={{ color: UI_COLORS.lightningSoft, textDecoration: 'none' }}>
                  https://mempool.space/graphs/lightning/nodes-channels-map
                </a>
              </div>
              <div>
                API: {LIGHTNING_WORLD_ENDPOINT}
              </div>
              <div>
                Last snapshot: {payload?.fetched_at ? `${fmt.date(payload.fetched_at)} ${fmt.time(payload.fetched_at)}` : 'N/A'}
              </div>
              <div>
                Refresh target: every {Math.round(REFRESH_INTERVAL_MS / 60_000)} min
              </div>
              <div>
                Peak channels (single node): {fmt.num(maxChannels)}
              </div>
              <div>
                Peak liquidity (single node): {formatBtcFromSats(maxLiquidity)}
              </div>
              <div>
                Lightning metrics: (Tor nodes excluded)
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
