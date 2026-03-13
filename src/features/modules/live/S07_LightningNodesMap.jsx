import { useEffect, useMemo, useState } from 'react';
import { GeoJSON, MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fmt } from '@/shared/utils/formatters.js';

const LIGHTNING_WORLD_ENDPOINT = '/api/public/lightning/world';
const COUNTRIES_URL = '/api/public/geo/countries';
const WB_POP_URL = 'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&per_page=500&mrv=1';
const REFRESH_INTERVAL_MS = 60_000;
const UNKNOWN_COUNTRY_LABEL = 'Unknown region';

const UI_COLORS = {
  lightning: '#3BA3FF',
  lightningSoft: '#6CC0FF',
  warning: 'var(--accent-warning)',
};

// Built-in population estimates (millions) — fallback until World Bank API responds
const POPULATION_FALLBACK = {
  US: 335, DE: 84, FR: 68, GB: 68, CA: 40, NL: 17.9, CH: 8.7,
  RU: 145, AU: 26, ES: 47, KR: 52, CZ: 10.9, SE: 10.5, IT: 60,
  AT: 9.1, FI: 5.5, NO: 5.5, DK: 5.9, PL: 37.7, BE: 11.6,
  SG: 6, HK: 7.5, JP: 125, CN: 1410, IN: 1440, BR: 215,
  ZA: 62, MX: 130, AR: 46, CL: 19.6, CO: 52, PE: 33,
  TR: 85, UA: 43, RO: 19, HU: 9.7, GR: 10.4, PT: 10.2,
  IL: 9.7, AE: 9.9, SA: 36, EG: 105, NG: 220, KE: 56,
  TH: 72, ID: 275, MY: 33, PH: 115, VN: 98, PK: 230,
  BD: 170, TW: 23.6, NZ: 5.1, IE: 5.1, LU: 0.66, IS: 0.37,
  LT: 2.8, LV: 1.8, EE: 1.3, SK: 5.5, SI: 2.1, HR: 3.9,
  BG: 6.5, RS: 6.8, MD: 2.5, GE: 3.7, AM: 3, AZ: 10.1,
  KZ: 19.5, UZ: 36, BY: 9.4, CY: 1.2, MT: 0.54,
};

const NODE_DENSITY_SCALE = [
  { key: 'very-high', label: 'Very high', color: '#0A3D91', minNodes: 801, legend: '> 800' },
  { key: 'high',      label: 'High',      color: '#145BB8', minNodes: 201, legend: '> 200' },
  { key: 'mid',       label: 'Mid',       color: '#1E78D8', minNodes: 51,  legend: '> 50'  },
  { key: 'low',       label: 'Low',       color: '#49A5EB', minNodes: 11,  legend: '> 10'  },
  { key: 'trace',     label: 'Trace',     color: '#93CCF7', minNodes: 1,   legend: '<= 10' },
];

// Fallback per-capita scale — replaced dynamically by computePerCapitaScale
const NODE_PERCAPITA_SCALE = [
  { key: 'very-high', label: 'Very high', color: '#0A3D91', minVal: 50,    legend: '> 50 /M'  },
  { key: 'high',      label: 'High',      color: '#145BB8', minVal: 20,    legend: '> 20 /M'  },
  { key: 'mid',       label: 'Mid',       color: '#1E78D8', minVal: 10,    legend: '> 10 /M'  },
  { key: 'low',       label: 'Low',       color: '#49A5EB', minVal: 5,     legend: '> 5 /M'   },
  { key: 'trace',     label: 'Trace',     color: '#93CCF7', minVal: 0.001, legend: '> 0 /M'   },
];

// Static fallback names for territories/microstates absent from most GeoJSON datasets
const ISO_COUNTRY_NAMES = {
  AD: 'Andorra',      AE: 'UAE',            AG: 'Antigua & Barbuda',
  AI: 'Anguilla',     AW: 'Aruba',          BB: 'Barbados',
  BH: 'Bahrain',      BL: 'St. Barthélemy', BM: 'Bermuda',
  BN: 'Brunei',       BQ: 'Bonaire',        BS: 'Bahamas',
  BT: 'Bhutan',       BV: 'Bouvet Island',  CC: 'Cocos Islands',
  CK: 'Cook Islands', CV: 'Cape Verde',     CW: 'Curaçao',
  CX: 'Christmas Island', DJ: 'Djibouti',   DM: 'Dominica',
  EH: 'W. Sahara',    FJ: 'Fiji',           FK: 'Falkland Islands',
  FM: 'Micronesia',   FO: 'Faroe Islands',  GD: 'Grenada',
  GG: 'Guernsey',     GI: 'Gibraltar',      GL: 'Greenland',
  GP: 'Guadeloupe',   GQ: 'Eq. Guinea',     GU: 'Guam',
  GW: 'Guinea-Bissau',HK: 'Hong Kong',      HM: 'Heard Island',
  IM: 'Isle of Man',  IO: 'British Indian Ocean',
  JE: 'Jersey',       KI: 'Kiribati',       KM: 'Comoros',
  KN: 'St. Kitts & Nevis', KY: 'Cayman Islands',
  LC: 'St. Lucia',    LI: 'Liechtenstein',  MF: 'St. Martin',
  MH: 'Marshall Islands', MO: 'Macao',      MP: 'N. Mariana Islands',
  MQ: 'Martinique',   MS: 'Montserrat',     MT: 'Malta',
  MU: 'Mauritius',    MV: 'Maldives',       NF: 'Norfolk Island',
  NR: 'Nauru',        NU: 'Niue',           PF: 'French Polynesia',
  PM: 'St. Pierre & Miquelon', PN: 'Pitcairn', PR: 'Puerto Rico',
  PW: 'Palau',        RE: 'Réunion',        SC: 'Seychelles',
  SH: 'St. Helena',   SJ: 'Svalbard',       SM: 'San Marino',
  SS: 'South Sudan',  ST: 'São Tomé & Príncipe', SX: 'Sint Maarten',
  TC: 'Turks & Caicos', TF: 'French S. Territories',
  TK: 'Tokelau',      TL: 'Timor-Leste',    TO: 'Tonga',
  TV: 'Tuvalu',       UM: 'U.S. Minor Islands',
  VA: 'Vatican',      VC: 'St. Vincent',    VG: 'British Virgin Islands',
  VI: 'U.S. Virgin Islands', VU: 'Vanuatu', WF: 'Wallis & Futuna',
  WS: 'Samoa',        XK: 'Kosovo',         YT: 'Mayotte',
};

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
  const value = Number(count) || 0;
  if (value <= 0) return '#141414';
  return getDensityStepByCount(value)?.color || '#141414';
}

function getDensityLabel(count) {
  return getDensityStepByCount(count)?.label || 'No data';
}

function computePerCapitaScale(maxVal) {
  if (!maxVal || maxVal <= 0) return NODE_PERCAPITA_SCALE;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude;
  const t4 = Math.max(1, Math.round(niceMax * 0.50));
  const t3 = Math.max(1, Math.round(niceMax * 0.25));
  const t2 = Math.max(1, Math.round(niceMax * 0.10));
  const t1 = Math.max(1, Math.round(niceMax * 0.05));
  return [
    { key: 'very-high', label: 'Very high', color: '#0A3D91', minVal: t4,    legend: `> ${t4} /M` },
    { key: 'high',      label: 'High',      color: '#145BB8', minVal: t3,    legend: `> ${t3} /M` },
    { key: 'mid',       label: 'Mid',       color: '#1E78D8', minVal: t2,    legend: `> ${t2} /M` },
    { key: 'low',       label: 'Low',       color: '#49A5EB', minVal: t1,    legend: `> ${t1} /M` },
    { key: 'trace',     label: 'Trace',     color: '#93CCF7', minVal: 0.001, legend: '> 0 /M'    },
  ];
}

function getFillColorByPerCapita(perCapita, scale) {
  const v = Number(perCapita) || 0;
  if (v <= 0) return '#141414';
  return ((scale || NODE_PERCAPITA_SCALE).find((s) => v >= s.minVal) || {}).color || '#93CCF7';
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
  return `${Math.ceil(minutes / 60)} h`;
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
  const [viewMode, setViewMode] = useState('country'); // 'country' | 'perCapita'
  const [populationMap, setPopulationMap] = useState(POPULATION_FALLBACK);
  const [popDataYear, setPopDataYear] = useState(null);
  const [popSource, setPopSource] = useState('fallback'); // 'fallback' | 'worldbank' | 'cache'
  const [popLastFetched, setPopLastFetched] = useState(null);
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
    if (isCompactViewport) setIsDensityExpanded(false);
  }, [isCompactViewport]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(LIGHTNING_WORLD_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        const json = p?.data || p;
        if (!active) return;
        setPayload({
          source_provider: p?.source_provider || 'mempool.space',
          fetched_at: p?.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
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
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(COUNTRIES_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        const geo = p?.data || p;
        if (!active) return;
        setCountriesGeo(geo);
      } catch {
        if (active) setError((prev) => prev || 'Could not load country boundaries.');
      } finally {
        if (active) setGeoLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // World Bank population — localStorage cache, TTL 24 h (data is annual)
  useEffect(() => {
    const CACHE_KEY = 'wb_pop_v1';
    const TTL_MS = 24 * 60 * 60 * 1000;
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
          return () => { active = false; };
        }
      }
    } catch { /* ignore */ }

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
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ map, year, fetchedAt })); } catch { /* storage full */ }
          apply(map, year, new Date(fetchedAt).toISOString(), 'worldbank');
        }
      } catch { /* keep fallback */ }
    })();

    return () => { active = false; };
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
      const directCode = String(row.country_code || '').toUpperCase();
      const countryName = String(row.country_name || '').trim();
      const normalizedName = normalizeCountryName(countryName);
      const aliasedName = COUNTRY_NAME_ALIASES[normalizedName] || normalizedName;
      const inferredCode = featureCodeByName.get(aliasedName) || '';
      const resolvedCode = /^[A-Z]{2}$/.test(directCode) ? directCode : inferredCode;
      const resolvedNameFromCode = featureNameByCode.get(resolvedCode) || '';
      const isoFallbackName = ISO_COUNTRY_NAMES[resolvedCode] || '';
      const displayName = resolvedNameFromCode || isoFallbackName;
      const baseName = isUnknownCountryValue(countryName)
        ? (displayName || (/^[A-Z]{2}$/.test(resolvedCode) ? resolvedCode : UNKNOWN_COUNTRY_LABEL))
        : (countryName || displayName || resolvedCode || UNKNOWN_COUNTRY_LABEL);
      const label = resolvedCode && displayName
        ? `${baseName} (${resolvedCode})`
        : baseName;
      return { ...row, country_label: label, country_code_resolved: resolvedCode || 'UNKNOWN' };
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
      map[code] = {
        nodes: (map[code]?.nodes || 0) + row.nodes,
        channels: (map[code]?.channels || 0) + row.channels,
        capacity: (map[code]?.capacity || 0) + row.capacity,
      };
    });
    return map;
  }, [metricRows]);

  const totals = useMemo(() => metricRows.reduce(
    (acc, row) => { acc.nodes += row.nodes; acc.channels += row.channels; acc.capacity += row.capacity; return acc; },
    { nodes: 0, channels: 0, capacity: 0 },
  ), [metricRows]);

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

  const maxCount = useMemo(
    () => resolvedCountryRows.length ? Math.max(...resolvedCountryRows.map((r) => r.nodes)) : 0,
    [resolvedCountryRows],
  );

  const maxPerCapita = useMemo(() => {
    const vals = Object.values(perCapitaByCode);
    return vals.length ? Math.max(...vals) : 0;
  }, [perCapitaByCode]);

  const activePerCapitaScale = useMemo(() => computePerCapitaScale(maxPerCapita), [maxPerCapita]);

  const allCountries = useMemo(() => resolvedCountryRows, [resolvedCountryRows]);

  const displayRows = useMemo(() => {
    if (viewMode === 'country') return allCountries;
    return allCountries
      .filter((row) => /^[A-Z]{2}$/.test(row.country_code_resolved) && populationMap[row.country_code_resolved] != null)
      .map((row) => ({ ...row, perCapita: row.nodes / populationMap[row.country_code_resolved] }))
      .sort((a, b) => b.perCapita - a.perCapita);
  }, [allCountries, viewMode, populationMap]);

  const maxChannels = Number(payload?.data?.maxChannels) || 0;
  const maxLiquidity = Number(payload?.data?.maxLiquidity) || 0;
  const avgChannelsPerNode = totals.nodes > 0 ? totals.channels / totals.nodes : 0;
  const isLoading = apiLoading || geoLoading;

  return (
    <div className="visual-integrity-lock flex h-full w-full flex-col bg-[#111111] lg:flex-row">
      <div className="visual-map-surface relative min-h-[260px] min-w-0 flex-1 sm:min-h-[320px] lg:min-h-0">
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
                key={`lightning-${maxCount}-${countryCounts.length}-${viewMode}`}
                data={countriesGeo}
                style={(feature) => {
                  const code = getFeatureCountryCode(feature);
                  const fillColor = viewMode === 'perCapita'
                    ? getFillColorByPerCapita(perCapitaByCode[code], activePerCapitaScale)
                    : getFillColor(statsByCode[code]?.nodes || 0);
                  return { color: '#2d2d2d', weight: 0.7, fillColor, fillOpacity: 0.9 };
                }}
                onEachFeature={(feature, layer) => {
                  const code = getFeatureCountryCode(feature);
                  const name = getFeatureCountryName(feature, 0);
                  const stats = statsByCode[code] || { nodes: 0, channels: 0, capacity: 0 };
                  const displayCode = code && code !== '-99' ? code : UNKNOWN_COUNTRY_LABEL;
                  const tooltipText = viewMode === 'perCapita'
                    ? (() => {
                        const pc = perCapitaByCode[code];
                        if (pc == null || pc <= 0) return `${name} (${displayCode}): no data`;
                        const step = activePerCapitaScale.find((s) => pc >= s.minVal);
                        return `${name} (${displayCode}): ${Math.round(pc)} /M — ${step?.label ?? 'Trace'}`;
                      })()
                    : `${name} (${displayCode}): ${fmt.num(stats.nodes)} nodes — ${fmt.num(stats.channels)} ch — ${formatBtcFromSats(stats.capacity)} — ${getDensityLabel(stats.nodes)}`;
                  layer.bindTooltip(tooltipText, { sticky: true, opacity: 0.95 });
                }}
              />
            )}
          </MapContainer>
        )}

        <div className="visual-integrity-lock absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-[#080808]/92 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm sm:bottom-5 sm:px-5 sm:py-2 sm:text-[12px]">
          {isLoading ? (
            <div className="skeleton" style={{ width: 190, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">Lightning Nodes (clearnet): </span>
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
                className="visual-integrity-lock absolute left-3 top-3 z-[1001] rounded border border-white/15 bg-[#080808]/90 px-2 py-1 font-mono text-[11px] text-white/80 backdrop-blur-sm"
              >
                {isDensityExpanded ? '◧' : '◨'} Density
              </button>
            )}

            {showDensityLegend && (() => {
              const activeScale = viewMode === 'perCapita' ? activePerCapitaScale : NODE_DENSITY_SCALE;
              const legendTitle = viewMode === 'perCapita' ? 'Per-capita Lightning density' : 'Lightning node concentration';
              return (
                <div className={`visual-integrity-lock absolute z-[1000] rounded border border-white/15 bg-[#080808]/88 px-2.5 py-2 font-mono text-[11px] backdrop-blur-sm ${isCompactViewport ? 'left-3 top-12' : 'left-3 top-3 sm:left-4 sm:top-4'}`}>
                  <div className="mb-0.5 text-white/75">{legendTitle}</div>
                  {viewMode === 'perCapita' && (
                    <div className="mb-1.5 text-white/40" style={{ fontSize: '9px' }}>nodes per million inhabitants</div>
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
          Global Lightning Network
        </div>

        <div className="border-b border-white/10 px-3 py-2">
          {isCompactViewport && (
            <button
              type="button"
              onClick={() => setIsBreakdownExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between rounded border border-white/10 bg-white/[0.02] px-2 py-1.5 text-left font-mono text-[11px] text-white/70 transition hover:border-white/20"
            >
              <span>Network summary (Tor excluded) · {fmt.num(totals.nodes)} nodes</span>
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
                <div className="text-white/50">Avg ch / node</div>
                <div className="text-white/85">{avgChannelsPerNode.toFixed(1)}</div>
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
                ? { borderColor: UI_COLORS.lightning, color: UI_COLORS.lightning, backgroundColor: 'rgba(59,163,255,0.1)' }
                : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent' }}
            >
              Node count
            </button>
            <button
              type="button"
              onClick={() => setViewMode('perCapita')}
              className="flex-1 rounded border px-2 py-1 font-mono text-[10px] transition"
              style={viewMode === 'perCapita'
                ? { borderColor: UI_COLORS.lightning, color: UI_COLORS.lightning, backgroundColor: 'rgba(59,163,255,0.1)' }
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
                  : getFillColor(item.nodes);
                const valueLabel = viewMode === 'perCapita' && item.perCapita != null
                  ? `${Math.round(item.perCapita)} /M`
                  : fmt.num(item.nodes);
                return (
                  <div
                    key={`${item.country_label}-${item.country_code_resolved}-${index}`}
                    className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="inline-block h-2 w-2 flex-none rounded-sm" style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }} />
                      <span className="truncate font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {item.country_label}
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
              <a href="https://mempool.space" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                {sourceProviderLabel}
              </a>
            </span>
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/75">
              refresh: {nextUpdateDelay === 'N/A' ? 'N/A' : (nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`)}
            </span>
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
                <a href="https://mempool.space/graphs/lightning/nodes-channels-map" target="_blank" rel="noreferrer" style={{ color: UI_COLORS.lightningSoft, textDecoration: 'none' }}>
                  mempool.space/graphs/lightning
                </a>
              </div>
              <div>API: {LIGHTNING_WORLD_ENDPOINT}</div>
              <div>Last snapshot: {payload?.fetched_at ? `${fmt.date(payload.fetched_at)} ${fmt.time(payload.fetched_at)}` : 'N/A'}</div>
              <div>Refresh target: every {Math.round(REFRESH_INTERVAL_MS / 60_000)} min</div>
              <div>Peak channels (single node): {fmt.num(maxChannels)}</div>
              <div>Peak liquidity (single node): {formatBtcFromSats(maxLiquidity)}</div>
              <div>Note: Tor nodes excluded from all metrics</div>
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
