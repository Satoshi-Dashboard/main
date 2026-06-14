import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Info from 'lucide-react/dist/esm/icons/info';
import {
  useCompactViewport,
  useCountriesGeoJson,
} from '@/features/modules/live/shared/worldMapHooks.js';
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
import { UI_COLORS as SHARED_UI_COLORS } from '@/shared/constants/colors.js';
import { ModuleShell } from '@/shared/components/module/index.js';
import S07MapContainer from './S07MapContainer.jsx';
import {
  getFillColor,
  getFillColorByPerCapita,
  formatPerCapitaValue,
  formatNextUpdateDelayMs,
} from '@/features/modules/live/shared/mapColorUtils.js';

const LIGHTNING_WORLD_ENDPOINT        = '/api/public/lightning/world';
const LIGHTNING_CHANNELS_GEO_ENDPOINT = '/api/public/lightning/channels-geo';
const LIGHTNING_FALLBACK_ENDPOINT     = '/api/public/lightning/fallback';
const REFRESH_INTERVAL_MS = 60_000;
const CHANNELS_GEO_REFRESH_MS = 5 * 60_000; // 5 min
const INITIAL_NETWORK_ROWS = 160;
const NETWORK_ROWS_BATCH = 180;
const NETWORK_ROWS_BATCH_DELAY_MS = 90;
const UNKNOWN_COUNTRY_LABEL = 'Unknown region';

const UI_COLORS = {
  ...SHARED_UI_COLORS,
  lightning:     '#3BA3FF',
  lightningSoft: '#6CC0FF',
};

// Shared color ramp — 5 levels, darkest → lightest blue
const DENSITY_COLORS = ['#0A3D91', '#145BB8', '#1E78D8', '#49A5EB', '#93CCF7'];

// Fixed scale for nodes absolute (legacy – preserves original thresholds)
const NODE_DENSITY_SCALE = [
  { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: 801, legend: '> 800'  },
  { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: 201, legend: '> 200'  },
  { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: 51,  legend: '> 50'   },
  { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: 11,  legend: '> 10'   },
  { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 1,   legend: '≤ 10'   },
];

// Fallback per-capita scale (replaced dynamically)
const PERCAPITA_FALLBACK_SCALE = [
  { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: 50,    legend: '> 50 /M'  },
  { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: 20,    legend: '> 20 /M'  },
  { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: 10,    legend: '> 10 /M'  },
  { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: 5,     legend: '> 5 /M'   },
  { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 0.001, legend: '> 0 /M'   },
];

// ─── Individual node network data ────────────────────────────────────────────
// API format: [lng, lat, pubkey, alias, capacity(sats), channels, country, countryCode]
function parseLightningNetworkData(payloadData) {
  const rawNodes = payloadData?.nodes;
  if (!Array.isArray(rawNodes)) return { points: [], lines: [] };

  const points = [];
  rawNodes.forEach((row) => {
    if (!Array.isArray(row)) return;
    const lng = Number(row[0]);
    const lat = Number(row[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    if (lat === 0 && lng === 0) return;
    const capacity = Number(row[4]) || 0;
    const channels = Number(row[5]) || 0;
    const countryCode = String(row[7] || '').toUpperCase() || '?';
    const countryNameRaw = typeof row[6] === 'string'
      ? row[6].trim()
      : String(row[6]?.en || row[6]?.['pt-BR'] || Object.values(row[6] || {})[0] || '').trim();
    const countryName = countryNameRaw || ISO_COUNTRY_NAMES[countryCode] || UNKNOWN_COUNTRY_LABEL;
    // Show all nodes with valid coordinates (removed capacity filter)
    points.push({
      lat, lng, capacity, channels,
      alias:       String(row[3] || '').trim() || '—',
      countryCode,
      countryName,
      pubkey:      String(row[2] || '').trim(),
    });
  });

  return { points, lines: [] };
}

function getNetworkNodeMetricColor(node, metricType, scale, avgDistByPubkey) {
  const metricValue = getNetworkMetricValue(node, metricType, avgDistByPubkey);
  return getFillColorByPerCapita(metricValue, scale);
}

const BTC_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// ─── Metric meta ─────────────────────────────────────────────────────────────

const METRIC_LABELS = {
  nodes:    'Node Count',
  channels: 'Channel Count',
  capacity: 'Total Capacity',
  dist:     'Avg channel distance',
};

function getNetworkMetricValue(node, metricType, avgDistByPubkey) {
  if (metricType === 'channels') return node.channels || 0;
  if (metricType === 'dist') return avgDistByPubkey[node.pubkey] || 0;
  return node.capacity || 0;
}

function getMetricRawValue(stats, metricType) {
  if (!stats) return 0;
  if (metricType === 'channels') return stats.channels || 0;
  if (metricType === 'capacity') return stats.capacity || 0;
  return stats.nodes || 0;
}

function formatMetricValue(value, metricType) {
  if (metricType === 'dist') return `${fmt.num(value)} km`;
  if (metricType === 'capacity') return formatBtcFromSats(value);
  return fmt.num(value);
}

function formatMetricValueShort(value, metricType) {
  if (metricType === 'dist') return `${fmt.num(value)} km`;
  if (metricType === 'capacity') {
    const btc = value / 100_000_000;
    if (btc >= 1000) return `${BTC_FORMATTER.format(btc / 1000)}k BTC`;
    return `${BTC_FORMATTER.format(btc)} BTC`;
  }
  return fmt.num(value);
}

function formatCompactTableValue(value, metricType) {
  const n = Number(value) || 0;
  if (metricType === 'capacity') {
    const btc = n / 100_000_000;
    return `${btc >= 100 ? BTC_FORMATTER.format(Math.round(btc)) : BTC_FORMATTER.format(Number(btc.toFixed(2)))} BTC`;
  }
  if (metricType === 'dist') {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k km`;
    return `${fmt.num(Math.round(n))} km`;
  }
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return fmt.num(Math.round(n));
}

// ─── Scale helpers ────────────────────────────────────────────────────────────

function computeAbsoluteScale(maxVal, metricType) {
  if (!maxVal || maxVal <= 0) return NODE_DENSITY_SCALE;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude;
  const t5 = Math.max(1, Math.round(niceMax * 0.50));
  const t4 = Math.max(1, Math.round(niceMax * 0.25));
  const t3 = Math.max(1, Math.round(niceMax * 0.10));
  const t2 = Math.max(1, Math.round(niceMax * 0.05));
  const fmtV = (v) => metricType === 'capacity' ? formatBtcFromSats(v) : metricType === 'dist' ? `${fmt.num(v)} km` : fmt.num(v);
  return [
    { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: t5, legend: `> ${fmtV(t5)}` },
    { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: t4, legend: `> ${fmtV(t4)}` },
    { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: t3, legend: `> ${fmtV(t3)}` },
    { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: t2, legend: `> ${fmtV(t2)}` },
    { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 1,  legend: `> 0`           },
  ];
}

function computePerCapitaScale(maxVal, metricType) {
  if (!maxVal || maxVal <= 0) return PERCAPITA_FALLBACK_SCALE;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude;
  const t4 = Math.max(0.001, parseFloat((niceMax * 0.50).toPrecision(2)));
  const t3 = Math.max(0.001, parseFloat((niceMax * 0.25).toPrecision(2)));
  const t2 = Math.max(0.001, parseFloat((niceMax * 0.10).toPrecision(2)));
  const t1 = Math.max(0.001, parseFloat((niceMax * 0.05).toPrecision(2)));
  const fmtLegend = (v) =>
    metricType === 'capacity'
      ? `> ${BTC_FORMATTER.format(v)} BTC /M`
      : `> ${v} /M`;
  return [
    { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: t4,    legend: fmtLegend(t4) },
    { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: t3,    legend: fmtLegend(t3) },
    { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: t2,    legend: fmtLegend(t2) },
    { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: t1,    legend: fmtLegend(t1) },
    { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 0.001, legend: metricType === 'capacity' ? '> 0 BTC /M' : '> 0 /M' },
  ];
}

function formatBtcFromSats(value) {
  const sats = Number(value);
  if (!Number.isFinite(sats) || sats <= 0) return '0 BTC';
  return `${BTC_FORMATTER.format(sats / 100_000_000)} BTC`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad, dLng = (lng2 - lng1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    const existing = map.get(key) || { country_code: countryCode, country_name: countryName, nodes: 0, channels: 0, capacity: 0 };
    existing.country_code  = existing.country_code  || countryCode;
    existing.country_name  = existing.country_name  || countryName;
    existing.nodes    += 1;
    existing.channels += Number.isFinite(channels) && channels > 0 ? channels : 0;
    existing.capacity += Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
    map.set(key, existing);
  });
  return [...map.values()].sort((a, b) => b.nodes - a.nodes);
}

export default function S07_LightningNodesMap() {
  const [payload,              setPayload]              = useState(null);
  const [fallbackPayload,     setFallbackPayload]      = useState(null);
  const [apiLoading,           setApiLoading]           = useState(true);
  const [,                     setFallbackLoaded]      = useState(false);
  const [error,                setError]                = useState(null);
  const [isBreakdownExpanded,  setIsBreakdownExpanded]  = useState(false);
  const [isMetaExpanded,       setIsMetaExpanded]       = useState(false);
  const [isDensityExpanded,    setIsDensityExpanded]    = useState(false);
  // Feature A — metric selector
  const [metricType,           setMetricType]           = useState('nodes');      // 'nodes'|'channels'|'capacity'
  const [isAbsolute,           setIsAbsolute]           = useState(true);         // true=absolute, false=per-capita
  // Feature B — layer mode
  const [layerMode,            setLayerMode]            = useState('choropleth'); // 'choropleth'|'bubble'
  const [channelsGeoLines,     setChannelsGeoLines]     = useState([]);
  const [showAllConnectionLines, setShowAllConnectionLines] = useState(true);
  const [canRenderAllConnectionLines, setCanRenderAllConnectionLines] = useState(false);
  const [visibleNetworkNodeCount, setVisibleNetworkNodeCount] = useState(INITIAL_NETWORK_ROWS);
  const [selectedPubkey,       setSelectedPubkey]       = useState(null);
  const [networkSortCol,       setNetworkSortCol]       = useState('capacity');
  const [networkSortDir,       setNetworkSortDir]       = useState('desc');
  const [nowTs,                setNowTs]                = useState(() => Date.now());

  const isCompactViewport = useCompactViewport();
  const { data: countriesGeo, loading: geoLoading, error: geoError } = useCountriesGeoJson();
  const { populationMap, popDataYear, popSource, popLastFetched } = useWorldBankPopulation();

  useEffect(() => {
    if (isCompactViewport) setIsDensityExpanded(false);
  }, [isCompactViewport]);

  // Clear pinned selection when leaving network mode
  useEffect(() => {
    if (layerMode !== 'bubble') setSelectedPubkey(null);
  }, [layerMode]);

  useEffect(() => {
    if (layerMode === 'bubble' && metricType === 'nodes') {
      setMetricType('channels');
    }
    if (layerMode !== 'bubble' && metricType === 'dist') {
      setMetricType('nodes');
    }
  }, [layerMode, metricType]);

  useEffect(() => {
    if (layerMode !== 'bubble') {
      setCanRenderAllConnectionLines(false);
      return undefined;
    }
    setCanRenderAllConnectionLines(false);
    const timer = setTimeout(() => setCanRenderAllConnectionLines(true), 900);
    return () => clearTimeout(timer);
  }, [layerMode, channelsGeoLines.length, metricType]);

  useEffect(() => {
    let active = true;

    const loadFallback = async () => {
      try {
        const res = await fetch(LIGHTNING_FALLBACK_ENDPOINT);
        if (res.ok) {
          const fallback = await res.json();
          if (active && fallback?.data) {
            setFallbackPayload({
              source_provider: fallback.source_provider || 'mempool.space',
              fetched_at: fallback.updated_at ? new Date(fallback.updated_at).getTime() : Date.now(),
              data: fallback.data,
            });
          }
        }
      } catch { /* ignore */ } finally {
        if (active) setFallbackLoaded(true);
      }
    };

    const loadFresh = async () => {
      try {
        const res = await fetch(LIGHTNING_WORLD_ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        const json = p?.data || p;
        if (!active) return;
        const newPayload = {
          source_provider: p?.source_provider || 'mempool.space',
          fetched_at: p?.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
          data: json,
        };
        setPayload(newPayload);
        setError(null);
        try {
          await fetch(LIGHTNING_FALLBACK_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPayload),
          });
        } catch { /* ignore */ }
      } catch {
        if (!active) return;
        setError('Could not load the Lightning nodes API.');
      } finally {
        if (active) setApiLoading(false);
      }
    };

    loadFallback();
    loadFresh();
    const timer = setInterval(loadFresh, REFRESH_INTERVAL_MS);
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (geoError) setError((prev) => prev || geoError);
  }, [geoError]);

  // Fetch channel geo lines (network mode only)
  useEffect(() => {
    if (layerMode !== 'bubble') return;
    let active = true;
    const load = async () => {
      try {
        const res  = await fetch(LIGHTNING_CHANNELS_GEO_ENDPOINT);
        if (!res.ok) return;
        const body = await res.json();
        const raw  = Array.isArray(body) ? body : (body?.data ?? []);
        if (!active) return;
        const lines = [];
        raw.forEach((r) => {
          if (!Array.isArray(r) || r.length < 8) return;
          const lng1 = Number(r[2]), lat1 = Number(r[3]);
          const lng2 = Number(r[6]), lat2 = Number(r[7]);
          if (!Number.isFinite(lat1) || !Number.isFinite(lng1)) return;
          if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return;
          lines.push({ lat1, lng1, lat2, lng2, pub1: String(r[0]).trim(), pub2: String(r[4]).trim() });
        });
        setChannelsGeoLines(lines);
      } catch { /* non-blocking */ }
    };
    load();
    const timer = setInterval(load, CHANNELS_GEO_REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
  }, [layerMode]);

  const nextUpdateDelay = useMemo(
    () => formatNextUpdateDelayMs((payload?.fetched_at || nowTs) + REFRESH_INTERVAL_MS),
    [payload?.fetched_at, nowTs],
  );
  const effectivePayload = payload || fallbackPayload;
  const sourceProviderLabel = effectivePayload?.source_provider || 'mempool.space';
  const showBreakdownPanel  = !isCompactViewport || isBreakdownExpanded;
  const showDensityLegend   = !isCompactViewport || isDensityExpanded;

  const isUsingFallback = !payload && !!fallbackPayload;

  const countryCounts = useMemo(() => parseLightningCountryCounts(effectivePayload?.data), [effectivePayload?.data]);

  const featureCodeByName = useMemo(() => {
    const map = new Map();
    const features = countriesGeo?.features;
    if (!Array.isArray(features)) return map;
    features.forEach((feature, idx) => {
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
    const features = countriesGeo?.features;
    if (!Array.isArray(features)) return map;
    features.forEach((feature, idx) => {
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
      const resolvedNameFromCode = featureNameByCode.get(resolvedCode) || '';
      const isoFallbackName      = ISO_COUNTRY_NAMES[resolvedCode] || '';
      const displayName          = resolvedNameFromCode || isoFallbackName;
      const baseName = isUnknownCountryValue(countryName)
        ? (displayName || (/^[A-Z]{2}$/.test(resolvedCode) ? resolvedCode : UNKNOWN_COUNTRY_LABEL))
        : (countryName || displayName || resolvedCode || UNKNOWN_COUNTRY_LABEL);
      const label = resolvedCode && displayName ? `${baseName} (${resolvedCode})` : baseName;
      return { ...row, country_label: label, country_code_resolved: resolvedCode || 'UNKNOWN' };
    });
  }, [countryCounts, featureCodeByName, featureNameByCode]);

  const metricRows = useMemo(
    () => resolvedCountryRows.filter((row) => /^[A-Z]{2}$/.test(row.country_code_resolved)),
    [resolvedCountryRows],
  );

  const networkData = useMemo(
    () => parseLightningNetworkData(effectivePayload?.data),
    [effectivePayload?.data],
  );

  const statsByCode = useMemo(() => {
    const map = {};
    metricRows.forEach((row) => {
      const c = row.country_code_resolved;
      map[c] = {
        nodes:    (map[c]?.nodes    || 0) + row.nodes,
        channels: (map[c]?.channels || 0) + row.channels,
        capacity: (map[c]?.capacity || 0) + row.capacity,
      };
    });
    return map;
  }, [metricRows]);

  const totals = useMemo(() => metricRows.reduce(
    (acc, row) => { acc.nodes += row.nodes; acc.channels += row.channels; acc.capacity += row.capacity; return acc; },
    { nodes: 0, channels: 0, capacity: 0 },
  ), [metricRows]);

  const perCapitaByCode = useMemo(() => {
    const map = {};
    metricRows.forEach((row) => {
      const c = row.country_code_resolved;
      if (!/^[A-Z]{2}$/.test(c) || populationMap[c] == null) return;
      const pop = populationMap[c];
      if (!pop) return;
      if (!map[c]) map[c] = { nodes: 0, channels: 0, capacity: 0 };
      map[c].nodes    += row.nodes    / pop;
      map[c].channels += row.channels / pop;
      map[c].capacity += row.capacity / pop / 100_000_000;
    });
    return map;
  }, [metricRows, populationMap]);

  const maxAbsoluteByMetric = useMemo(() => {
    const vals = Object.values(statsByCode);
    if (!vals.length) return { nodes: 0, channels: 0, capacity: 0 };
    return {
      nodes:    Math.max(...vals.map((s) => s.nodes)),
      channels: Math.max(...vals.map((s) => s.channels)),
      capacity: Math.max(...vals.map((s) => s.capacity)),
    };
  }, [statsByCode]);

  const maxPerCapitaByMetric = useMemo(() => {
    const vals = Object.values(perCapitaByCode);
    if (!vals.length) return { nodes: 0, channels: 0, capacity: 0 };
    return {
      nodes:    Math.max(...vals.map((s) => s.nodes    || 0)),
      channels: Math.max(...vals.map((s) => s.channels || 0)),
      capacity: Math.max(...vals.map((s) => s.capacity || 0)),
    };
  }, [perCapitaByCode]);

  const avgDistByPubkey = useMemo(() => {
    if (!channelsGeoLines.length || !channelsGeoLines[0]?.pub1) return {};
    const acc = {};
    channelsGeoLines.forEach(({ lat1, lng1, lat2, lng2, pub1, pub2 }) => {
      const d = haversineKm(lat1, lng1, lat2, lng2);
      if (!Number.isFinite(d) || d <= 0) return;
      [pub1, pub2].forEach((pub) => {
        if (!pub) return;
        if (!acc[pub]) acc[pub] = { total: 0, count: 0 };
        acc[pub].total += d;
        acc[pub].count += 1;
      });
    });
    const result = {};
    Object.entries(acc).forEach(([pub, { total, count }]) => {
      result[pub] = Math.round(total / count);
    });
    return result;
  }, [channelsGeoLines]);

  const networkMaxByMetric = useMemo(() => {
    const points = networkData.points;
    if (!points.length) return { channels: 0, capacity: 0, dist: 0 };
    return {
      channels: Math.max(...points.map((pt) => pt.channels || 0)),
      capacity: Math.max(...points.map((pt) => pt.capacity || 0)),
      dist:     Math.max(...points.map((pt) => avgDistByPubkey[pt.pubkey] || 0)),
    };
  }, [networkData.points, avgDistByPubkey]);

  const networkScale = useMemo(() => {
    const networkMetric = metricType === 'nodes' ? 'channels' : metricType;
    return computeAbsoluteScale(networkMaxByMetric[networkMetric] || 0, networkMetric);
  }, [metricType, networkMaxByMetric]);

  const activeScale = useMemo(() => {
    if (layerMode === 'bubble') return networkScale;
    if (isAbsolute) {
      if (metricType === 'nodes') return NODE_DENSITY_SCALE;
      return computeAbsoluteScale(maxAbsoluteByMetric[metricType] || 0, metricType);
    }
    return computePerCapitaScale(maxPerCapitaByMetric[metricType] || 0, metricType);
  }, [layerMode, networkScale, isAbsolute, metricType, maxAbsoluteByMetric, maxPerCapitaByMetric]);

  const maxMetricValue = layerMode === 'bubble'
    ? (networkMaxByMetric[metricType === 'nodes' ? 'channels' : metricType] || 0)
    : isAbsolute
      ? (maxAbsoluteByMetric[metricType] || 0)
      : (maxPerCapitaByMetric[metricType] || 0);

  // Flat sorted node list for network mode
  const sortedNetworkNodes = useMemo(() => {
    if (layerMode !== 'bubble') return [];
    return [...networkData.points].sort((a, b) => {
      let va, vb;
      switch (networkSortCol) {
        case 'country':  va = a.countryName.toLowerCase();       vb = b.countryName.toLowerCase();       break;
        case 'alias':    va = a.alias.toLowerCase();             vb = b.alias.toLowerCase();             break;
        case 'channels': va = a.channels;                       vb = b.channels;                        break;
        case 'dist':     va = avgDistByPubkey[a.pubkey] ?? -1;  vb = avgDistByPubkey[b.pubkey] ?? -1;   break;
        default:         va = a.capacity;                       vb = b.capacity;
      }
      if (networkSortDir === 'asc') return va > vb ? 1 : va < vb ? -1 : 0;
      return va < vb ? 1 : va > vb ? -1 : 0;
    });
  }, [layerMode, networkData.points, networkSortCol, networkSortDir, avgDistByPubkey]);

  // Keep the latest list length in a ref so the progressive pump never reads
  // a stale closure, and the reset effect can depend on the length only —
  // payload refetches every 60 s create a new array identity with same data.
  const sortedNetworkNodesLengthRef = useRef(0);
  useEffect(() => {
    sortedNetworkNodesLengthRef.current = sortedNetworkNodes.length;
  }, [sortedNetworkNodes]);

  useEffect(() => {
    if (layerMode !== 'bubble') return undefined;

    setVisibleNetworkNodeCount(INITIAL_NETWORK_ROWS);
    if (sortedNetworkNodesLengthRef.current <= INITIAL_NETWORK_ROWS) return undefined;

    let cancelled = false;
    let timer = null;

    const pump = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setVisibleNetworkNodeCount((current) => {
          const total = sortedNetworkNodesLengthRef.current;
          const next = Math.min(total, current + NETWORK_ROWS_BATCH);
          if (next < total) pump();
          return next;
        });
      }, NETWORK_ROWS_BATCH_DELAY_MS);
    };

    pump();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [layerMode, sortedNetworkNodes.length, networkSortCol, networkSortDir, metricType]);

  const visibleNetworkNodes = useMemo(
    () => sortedNetworkNodes.slice(0, visibleNetworkNodeCount),
    [sortedNetworkNodes, visibleNetworkNodeCount],
  );

  const remainingNetworkNodes = Math.max(0, sortedNetworkNodes.length - visibleNetworkNodes.length);

  const handleNetworkSort = (col) => {
    if (networkSortCol === col) setNetworkSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setNetworkSortCol(col); setNetworkSortDir('desc'); }
  };

  const handleMetricTypeChange = (value) => {
    setMetricType(value);
    if (layerMode === 'bubble' && ['channels', 'capacity', 'dist'].includes(value)) {
      setNetworkSortCol(value);
      setNetworkSortDir('desc');
    }
  };

  const displayRows = useMemo(() => {
    if (isAbsolute) {
      return [...resolvedCountryRows].sort((a, b) => {
        return getMetricRawValue(b, metricType) - getMetricRawValue(a, metricType);
      });
    }
    return resolvedCountryRows
      .filter((row) => /^[A-Z]{2}$/.test(row.country_code_resolved) && populationMap[row.country_code_resolved] != null)
      .map((row) => {
        const pc = perCapitaByCode[row.country_code_resolved];
        const pcVal = pc
          ? (metricType === 'nodes' ? pc.nodes : metricType === 'channels' ? pc.channels : pc.capacity)
          : 0;
        return { ...row, perCapitaActive: pcVal };
      })
      .sort((a, b) => b.perCapitaActive - a.perCapitaActive);
  }, [resolvedCountryRows, isAbsolute, metricType, populationMap, perCapitaByCode]);

  // ── Country hover tooltip (choropleth mode) — mirrors the S06 pattern ──
  const tooltipRef = useRef(null);
  const hoverDataRef = useRef({});
  useEffect(() => {
    hoverDataRef.current = { statsByCode, perCapitaByCode, isAbsolute, metricType, featureNameByCode };
  }, [statsByCode, perCapitaByCode, isAbsolute, metricType, featureNameByCode]);

  const handleHoverCountry = useCallback((code, evt) => {
    const el = tooltipRef.current;
    if (!el) return;
    if (!code || !evt) {
      el.style.display = 'none';
      return;
    }
    const hover = hoverDataRef.current;
    const name = hover.featureNameByCode?.get(code) || ISO_COUNTRY_NAMES[code] || code;
    let valueLabel;
    if (hover.isAbsolute) {
      const val = getMetricRawValue(hover.statsByCode?.[code], hover.metricType);
      valueLabel = formatMetricValue(val, hover.metricType);
    } else {
      const pc = hover.perCapitaByCode?.[code];
      const pcVal = pc
        ? (hover.metricType === 'nodes' ? pc.nodes : hover.metricType === 'channels' ? pc.channels : pc.capacity)
        : 0;
      valueLabel = formatPerCapitaValue(pcVal, hover.metricType);
    }
    el.textContent = `${name} (${code}): ${valueLabel} — ${METRIC_LABELS[hover.metricType] || ''}`;
    el.style.display = 'block';
    el.style.left = `${evt.offsetX + 14}px`;
    el.style.top  = `${evt.offsetY - 10}px`;
  }, []);

  const maxChannels        = Number(effectivePayload?.data?.maxChannels)  || 0;
  const maxLiquidity       = Number(effectivePayload?.data?.maxLiquidity) || 0;
  const avgChannelsPerNode = totals.nodes > 0 ? totals.channels / totals.nodes : 0;
  const hasCountryData     = countryCounts.length > 0;
  const isLoading          = (!hasCountryData && apiLoading && !fallbackPayload) || (!hasCountryData && geoLoading);
  const isMapLoading       = (!effectivePayload && apiLoading) || (!countriesGeo && geoLoading);
  // Legend title
  const legendTitle = layerMode === 'bubble'
    ? metricType === 'capacity'
      ? 'Capacity Concentration'
      : metricType === 'dist'
        ? 'Avg channel distance'
        : 'Channel Concentration'
    : !isAbsolute
    ? `${METRIC_LABELS[metricType]} per capita`
    : metricType === 'nodes'    ? 'Node Concentration'
    : metricType === 'channels' ? 'Channel Concentration'
    :                             'Capacity Concentration';

  return (
    <ModuleShell className="lg:flex-row">

      {/* ══ MAP SURFACE (blank canvas) ═══════════════════════════════════════ */}
      <div className="visual-map-surface relative h-[50dvh] min-h-[280px] min-w-0 flex-none sm:min-h-[320px] lg:h-auto lg:min-h-0 lg:flex-1">

        {/* Floating HTML tooltip (country hover, choropleth mode) */}
        <div
          ref={tooltipRef}
          style={{ display: 'none', position: 'absolute', pointerEvents: 'none', zIndex: 1002 }}
          className="rounded border border-white/15 bg-[#080808]/95 px-3 py-1.5 font-mono text-[12px] text-white/80 shadow-lg backdrop-blur-sm"
        />

        {geoLoading || !countriesGeo ? (
          <div className="h-full w-full p-6">
            <div className="skeleton h-full w-full rounded-md" />
          </div>
        ) : (
          <S07MapContainer
            layerMode={layerMode}
            countriesGeo={countriesGeo}
            statsByCode={statsByCode}
            perCapitaByCode={perCapitaByCode}
            isAbsolute={isAbsolute}
            metricType={metricType}
            activeScale={activeScale}
            networkData={networkData}
            channelsGeoLines={channelsGeoLines}
            showConnectionLines={showAllConnectionLines && canRenderAllConnectionLines}
            selectedPubkey={selectedPubkey}
            onSelectNode={setSelectedPubkey}
            onHoverCountry={handleHoverCountry}
          />
        )}

        {/* ── Bottom badge ── */}
        <div className="visual-integrity-lock absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-[#080808]/92 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm sm:bottom-5 sm:px-5 sm:py-2 sm:text-[12px]">
          {isLoading ? (
            <div className="skeleton" style={{ width: 190, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">
                {isAbsolute ? METRIC_LABELS[metricType] : `${METRIC_LABELS[metricType]} /M`}
                {layerMode === 'bubble' ? ' · Network' : ''}:{' '}
              </span>
              <span className="font-bold text-white">
                {(layerMode === 'bubble' && metricType === 'dist')
                  ? formatMetricValueShort(maxMetricValue, metricType)
                  : isAbsolute
                    ? formatMetricValueShort(totals[metricType === 'capacity' ? 'capacity' : metricType], metricType)
                    : 'per-capita view'
                }
              </span>
            </>
          )}
        </div>

        {/* ── Map overlays: legend + network toggle ── */}
        {!isMapLoading && countryCounts.length > 0 && (
          <>
            {isCompactViewport && (
              <button
                type="button"
                onClick={() => setIsDensityExpanded((prev) => !prev)}
                className="visual-integrity-lock absolute left-3 top-3 z-[1001] min-h-[40px] rounded border border-white/15 bg-[#080808]/90 px-3 py-2 font-mono text-[12px] text-white/80 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                aria-expanded={showDensityLegend}
                aria-controls="s07-density-legend"
                aria-label={showDensityLegend ? 'Hide Legend' : 'Show Legend'}
              >
                {showDensityLegend ? 'Hide Legend' : 'Show Legend'}
              </button>
            )}

            <div
              className={`visual-integrity-lock absolute z-[1000] flex flex-col gap-1.5 ${
                isCompactViewport ? 'left-3 top-14' : 'left-3 top-3 sm:left-4 sm:top-4'
              }`}
            >
              {/* Density legend */}
              {showDensityLegend && (
                <div
                  id="s07-density-legend"
                  className="max-w-[calc(100vw-1.5rem)] rounded border border-white/15 bg-[#080808]/92 px-3 py-2.5 font-mono text-[12px] backdrop-blur-sm"
                >
                  <div className="mb-1 text-[12px] text-white/85">{legendTitle}</div>
                  {!isAbsolute && (
                    <div className="mb-1.5 text-[11px] text-white/45">Per 1M people</div>
                  )}
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {activeScale.map((step) => (
                      <span key={step.key} className="inline-flex min-w-0 items-center gap-2 text-white/80">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ background: step.color, boxShadow: `0 0 6px ${step.color}` }}
                        />
                        <span className="text-[11px] text-white/82">{step.label}</span>
                        <span className="min-w-0 text-[11px] text-white/55">{step.legend}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show all lines toggle (network mode) */}
              {layerMode === 'bubble' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllConnectionLines((prev) => {
                      const next = !prev;
                      if (next) setCanRenderAllConnectionLines(true);
                      return next;
                    });
                  }}
                  className="visual-integrity-lock self-start rounded border border-white/15 bg-[#080808]/90 px-3 py-1.5 font-mono text-[12px] text-white/75 backdrop-blur-sm transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                  style={{ color: showAllConnectionLines ? 'rgba(255,255,255,0.75)' : UI_COLORS.lightning }}
                  title={showAllConnectionLines ? 'Hide background connection lines' : 'Show background connection lines'}
                >
                  {showAllConnectionLines
                    ? (canRenderAllConnectionLines ? 'Hide all lines' : 'Loading all lines...')
                    : 'Show all lines'}
                </button>
              )}

              {/* Choropleth / Network toggle */}
              <button
                type="button"
                onClick={() => setLayerMode((m) => m === 'choropleth' ? 'bubble' : 'choropleth')}
                className="visual-integrity-lock self-start rounded border border-white/15 bg-[#080808]/90 px-3 py-1.5 font-mono text-[12px] backdrop-blur-sm transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                style={{ color: layerMode === 'bubble' ? UI_COLORS.lightning : 'rgba(255,255,255,0.70)' }}
                title={layerMode === 'choropleth' ? 'Show Network View' : 'Show Heatmap View'}
              >
                {layerMode === 'choropleth' ? 'Network View' : 'Heatmap View'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ══ ASIDE PANEL ══════════════════════════════════════════════════════ */}
      <aside className={`visual-integrity-lock relative flex h-[50dvh] min-h-0 w-full flex-none flex-col overflow-hidden border-t border-white/10 bg-[#111111] lg:h-auto lg:border-l lg:border-t-0 ${layerMode === 'bubble' ? 'lg:w-[560px] xl:w-[620px]' : 'lg:w-[320px]'}`}>

        {layerMode === 'choropleth' && (
          <>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[12px] tracking-wide text-white/60">
              Global Lightning Network
              <button
                type="button"
                onClick={() => setIsMetaExpanded((prev) => !prev)}
                className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] transition hover:border-white/25 hover:bg-white/[0.06]"
                aria-label="Data Info"
                aria-expanded={isMetaExpanded}
                aria-controls="s07-meta-panel"
              >
                <Info size={13} style={{ color: isMetaExpanded ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.55)' }} />
              </button>
            </div>

            <div className="border-b border-white/10 px-3 py-2">
              {isCompactViewport && (
                <button
                  type="button"
                  onClick={() => setIsBreakdownExpanded((prev) => !prev)}
                  className="flex min-h-[44px] w-full items-center justify-between rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-left font-mono text-[12px] text-white/70 transition hover:border-white/20"
                  aria-expanded={showBreakdownPanel}
                  aria-controls="s07-breakdown-panel"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.08em] text-white/45">Network Summary</span>
                    <span className="block truncate text-[12px] text-white/78">{fmt.num(totals.nodes)} nodes without Tor</span>
                  </span>
                  <span style={{ color: UI_COLORS.lightning }}>{isBreakdownExpanded ? 'Hide' : 'View'}</span>
                </button>
              )}
              {showBreakdownPanel && (
                <div id="s07-breakdown-panel" className={`${isCompactViewport ? 'mt-2' : ''} grid grid-cols-2 gap-1.5 font-mono text-[12px]`}>
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
                    <div className="text-white/50">Avg ch/node</div>
                    <div className="text-white/85">{avgChannelsPerNode.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Metric selector — adapts to layerMode ── */}
        <div className="border-b border-white/10 px-3 py-2">
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-white/45">Table Metric</div>
          <div className="flex items-center gap-1">
            <div className="relative min-w-0 flex-1">
              <select
                value={metricType}
                onChange={(e) => handleMetricTypeChange(e.target.value)}
                name="s07MetricType"
                aria-label="Select map metric"
                className="w-full appearance-none rounded border border-white/15 py-2 pl-3 pr-8 font-mono text-[12px] transition hover:border-white/25 focus:outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                style={{
                  cursor: 'pointer',
                  background: '#1a1a24',
                  color: 'rgba(255,255,255,0.85)',
                  accentColor: UI_COLORS.lightning,
                  colorScheme: 'dark',
                }}
              >
                {layerMode === 'bubble' ? (
                  <>
                    <option value="channels" style={{ background: '#1a1a24' }}>By Channels</option>
                    <option value="capacity" style={{ background: '#1a1a24' }}>By Capacity</option>
                    <option value="dist" style={{ background: '#1a1a24' }}>Avg channel distance</option>
                  </>
                ) : (
                  <>
                    <option value="nodes"    style={{ background: '#1a1a24' }}>Node Count</option>
                    <option value="channels" style={{ background: '#1a1a24' }}>Channel Count</option>
                    <option value="capacity" style={{ background: '#1a1a24' }}>Total Capacity</option>
                  </>
                )}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40">▼</span>
            </div>
            {/* Abs / Per capita — choropleth only */}
            {layerMode !== 'bubble' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAbsolute(true)}
                  aria-pressed={isAbsolute}
                  className="flex-none rounded border px-2.5 py-2 font-mono text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                  style={isAbsolute
                    ? { borderColor: UI_COLORS.lightning, color: UI_COLORS.lightning, backgroundColor: 'rgba(59,163,255,0.1)' }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }}
                >
                  Absolute
                </button>
                <button
                  type="button"
                  onClick={() => setIsAbsolute(false)}
                  aria-pressed={!isAbsolute}
                  className="flex-none rounded border px-2.5 py-2 font-mono text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                  style={!isAbsolute
                    ? { borderColor: UI_COLORS.lightning, color: UI_COLORS.lightning, backgroundColor: 'rgba(59,163,255,0.1)' }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }}
                >
                  Per 1M
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Breakdown list — nodes in Network mode, countries in Choropleth ── */}
        <div className="scrollbar-hidden-mobile min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-6 w-full rounded" />
              ))}
            </div>
          ) : layerMode === 'bubble' ? (
            /* ── Network mode: sortable flat node table ── */
            <div className="w-full font-mono">
              {remainingNetworkNodes > 0 && (
                <div className="mb-2 rounded border border-white/8 bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/55">
                  Showing {fmt.num(visibleNetworkNodes.length)} of {fmt.num(sortedNetworkNodes.length)} nodes. Loading the rest in the background...
                </div>
              )}
              {isCompactViewport ? (
                <div className="space-y-2">
                  {visibleNetworkNodes.map((node, i) => {
                    const color = getNetworkNodeMetricColor(node, metricType, activeScale, avgDistByPubkey);
                    const isNodeSelected = node.pubkey === selectedPubkey;
                    const avgDist = avgDistByPubkey[node.pubkey];
                    return (
                      <button
                        key={`${node.pubkey || node.alias}-${i}`}
                        type="button"
                        onClick={() => setSelectedPubkey((p) => (p === node.pubkey ? null : node.pubkey))}
                        className="w-full rounded-md border px-3 py-2 text-left transition hover:bg-white/[0.04]"
                        style={{
                          background: isNodeSelected ? 'rgba(59,163,255,0.08)' : 'rgba(255,255,255,0.02)',
                          borderColor: isNodeSelected ? 'rgba(59,163,255,0.45)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-2.5 w-2.5 flex-none rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                          <div className="min-w-0 flex-1">
                            <div className="break-words text-[12px] leading-5 text-white" title={node.alias}>{node.alias}</div>
                            <div className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-white/48" title={node.countryName}>{node.countryName}</div>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded border border-white/8 bg-white/[0.02] px-2 py-1">
                            <div className="text-white/38">Channels</div>
                            <div className="mt-0.5 tabular-nums" style={{ color: UI_COLORS.lightning }}>{formatCompactTableValue(node.channels, 'channels')}</div>
                          </div>
                          <div className="rounded border border-white/8 bg-white/[0.02] px-2 py-1">
                            <div className="text-white/38">Capacity</div>
                            <div className="mt-0.5 tabular-nums" style={{ color: '#FF80AA' }}>{formatCompactTableValue(node.capacity, 'capacity')}</div>
                          </div>
                          <div className="rounded border border-white/8 bg-white/[0.02] px-2 py-1">
                            <div className="text-white/38">Distance</div>
                            <div className="mt-0.5 tabular-nums text-white/62">{avgDist != null ? formatCompactTableValue(avgDist, 'dist') : '—'}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="sticky top-0 z-10 mb-1 grid grid-cols-[10px_112px_minmax(220px,1.8fr)_92px_108px_96px] gap-x-3 border-b border-white/[0.07] pb-1.5" style={{ background: '#111111' }}>
                    <span />
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('country')}
                      title="Sort by country"
                      className="flex items-center gap-1 text-left text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'country' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      {networkSortCol === 'country' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'} Country
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('alias')}
                      title="Sort by node alias"
                      className="flex items-center gap-1 text-left text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'alias' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      {networkSortCol === 'alias' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'} Node
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('channels')}
                      title="Sort by channels"
                      className="flex items-center justify-end gap-1 text-right text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'channels' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      Channels {networkSortCol === 'channels' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('capacity')}
                      title="Sort by capacity"
                      className="flex items-center justify-end gap-1 text-right text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'capacity' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      Capacity {networkSortCol === 'capacity' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('dist')}
                      title="Sort by average channel distance"
                      className="flex items-center justify-end gap-1 text-right text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'dist' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      Distance {networkSortCol === 'dist' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'}
                    </button>
                  </div>

                  {visibleNetworkNodes.map((node, i) => {
                    const color = getNetworkNodeMetricColor(node, metricType, activeScale, avgDistByPubkey);
                    const isNodeSelected = node.pubkey === selectedPubkey;
                    const avgDist = avgDistByPubkey[node.pubkey];
                    return (
                      <button
                        key={`${node.pubkey || node.alias}-${i}`}
                        type="button"
                        onClick={() => setSelectedPubkey((p) => (p === node.pubkey ? null : node.pubkey))}
                        className="grid w-full grid-cols-[10px_112px_minmax(220px,1.8fr)_92px_108px_96px] items-center gap-x-3 rounded py-1.5 pl-1.5 pr-1 text-left transition hover:bg-white/[0.04]"
                        style={{
                          background: isNodeSelected ? 'rgba(59,163,255,0.08)' : 'transparent',
                          borderLeft: isNodeSelected ? `2px solid ${UI_COLORS.lightning}` : '2px solid transparent',
                        }}
                        title={`${node.countryName} | ${node.alias} | ${formatCompactTableValue(node.channels, 'channels')} channels | ${formatCompactTableValue(node.capacity, 'capacity')} | ${avgDist != null ? formatCompactTableValue(avgDist, 'dist') : 'No distance data'}`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 3px ${color}` }} />
                        <span className="text-[11px] uppercase tracking-[0.06em] text-white/56" title={node.countryName}>{node.countryName}</span>
                        <span className="break-words pr-2 text-[12px] leading-5 text-white/86" title={node.alias}>{node.alias}</span>
                        <span className="text-right text-[12px] tabular-nums" style={{ color: UI_COLORS.lightning }} title={String(node.channels)}>{formatCompactTableValue(node.channels, 'channels')}</span>
                        <span className="text-right text-[12px] tabular-nums" style={{ color: '#FF80AA' }} title={formatCompactTableValue(node.capacity, 'capacity')}>{formatCompactTableValue(node.capacity, 'capacity')}</span>
                        <span className="text-right text-[12px] tabular-nums text-white/46" title={avgDist != null ? formatCompactTableValue(avgDist, 'dist') : 'No distance data'}>{avgDist != null ? formatCompactTableValue(avgDist, 'dist') : '—'}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            /* ── Choropleth mode: country aggregates ── */
            <div className="space-y-1">
              {displayRows.map((item, index) => {
                const code  = item.country_code_resolved;
                const stats = statsByCode[code] || { nodes: 0, channels: 0, capacity: 0 };
                let dotColor, valueLabel;
                if (isAbsolute) {
                  const val = getMetricRawValue(stats, metricType);
                  dotColor   = metricType === 'nodes' ? getFillColor(val, NODE_DENSITY_SCALE) : getFillColorByPerCapita(val, activeScale);
                  valueLabel = formatMetricValue(val, metricType);
                } else {
                  const pc     = perCapitaByCode[code];
                  const pcVal  = pc ? (metricType === 'nodes' ? pc.nodes : metricType === 'channels' ? pc.channels : pc.capacity) : 0;
                  dotColor   = getFillColorByPerCapita(pcVal, activeScale);
                  valueLabel = formatPerCapitaValue(pcVal, metricType);
                }
                return (
                  <div
                    key={`${item.country_label}-${code}-${index}`}
                    className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="inline-block h-2 w-2 flex-none rounded-sm" style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }} />
                      <span className="truncate font-mono text-[12px] sm:text-[13px]" style={{ color: 'rgba(255,255,255,0.8)' }} title={item.country_label}>
                        {item.country_label}
                      </span>
                    </span>
                    <span className="flex-none font-mono text-[12px] sm:text-[13px]" style={{ color: dotColor }} title={valueLabel}>
                      {valueLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Meta footer */}
        <div className="relative border-t border-white/10 px-3 py-2 font-mono text-[11px]">
          <div className="hidden flex-wrap items-center gap-2 text-white/65 lg:flex">
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5">
              src:{' '}
              <a href="https://mempool.space" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                {sourceProviderLabel}
              </a>
            </span>
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/75">
              refresh: {nextUpdateDelay === 'N/A' ? 'N/A' : nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`}
            </span>
            {!isAbsolute && (
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
              className="ml-auto rounded border border-white/10 bg-white/[0.02] px-2 py-1 text-white/70 transition hover:border-white/20"
              aria-expanded={isMetaExpanded}
              aria-controls="s07-meta-panel"
            >
              {isMetaExpanded ? 'Menos' : 'Detalles'}
            </button>
          </div>

          {isMetaExpanded && (
            <div id="s07-meta-panel" className="scrollbar-hidden-mobile absolute inset-x-3 bottom-[calc(100%+0.5rem)] z-20 max-h-[min(42vh,20rem)] overflow-y-auto rounded border border-white/10 bg-[#111111]/96 px-2 py-1.5 text-white/55 shadow-[0_14px_36px_rgba(0,0,0,0.42)] backdrop-blur-sm lg:static lg:inset-auto lg:bottom-auto lg:mt-2 lg:max-h-none lg:overflow-visible lg:bg-white/[0.02] lg:shadow-none lg:backdrop-blur-0">
              <div>
                Source:{' '}
                <a href="https://mempool.space/graphs/lightning/nodes-channels-map" target="_blank" rel="noreferrer" style={{ color: UI_COLORS.lightningSoft, textDecoration: 'none' }}>
                  mempool.space/graphs/lightning
                </a>
              </div>
              <div>API: {LIGHTNING_WORLD_ENDPOINT}</div>
              <div>Latest data: {effectivePayload?.fetched_at ? `${fmt.date(effectivePayload.fetched_at)} ${fmt.time(effectivePayload.fetched_at)}` : 'N/A'}{isUsingFallback && <span className="text-amber-400 ml-1">(cached)</span>}</div>
              <div>Refresh cadence: every {Math.round(REFRESH_INTERVAL_MS / 60_000)} min</div>
              <div>Max channels (node): {fmt.num(maxChannels)}</div>
              <div>Max liquidity (node): {formatBtcFromSats(maxLiquidity)}</div>
              <div>Note: Tor nodes excluded from metrics</div>
              <div className="mt-2 border-t border-white/10 pt-2">
                <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Population Data</div>
                <div>
                  Source:{' '}
                  <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                    World Bank
                  </a>
                  {popDataYear && ` · ${popDataYear}`}
                </div>
                <div>Cadence: annual (published mid-year)</div>
                <div>
                  Cache TTL: 24h · status:{' '}
                  <span style={{ color: popSource === 'worldbank' ? '#00D897' : popSource === 'cache' ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.4)' }}>
                    {popSource === 'worldbank' ? 'updated' : popSource === 'cache' ? 'from cache' : 'embedded estimates'}
                  </span>
                </div>
                {popLastFetched && (
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>Last update: {new Date(popLastFetched).toLocaleString()}</div>
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
    </ModuleShell>
  );
}


