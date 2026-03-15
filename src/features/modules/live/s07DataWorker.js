/**
 * s07DataWorker.js — Web Worker for S07 LightningNodesMap heavy computations
 *
 * Runs OFF the main thread. No DOM, no React, no imports from other modules.
 * All required utilities are inlined here to keep the worker self-contained.
 *
 * Input message: { type: 'PROCESS', payload, channelsGeoLines, populationMap, featureCodeByName, featureNameByCode }
 * Output message: { type: 'RESULT', ...allDerivedData } | { type: 'ERROR', message }
 */

// ─── Inlined constants (mirrors geoCountryUtils.js) ──────────────────────────

const ISO_COUNTRY_NAMES = {
  AD: 'Andorra', AE: 'UAE', AG: 'Antigua & Barbuda',
  AI: 'Anguilla', AW: 'Aruba', BB: 'Barbados',
  BH: 'Bahrain', BL: 'St. Barthelemy', BM: 'Bermuda',
  BN: 'Brunei', BQ: 'Bonaire', BS: 'Bahamas',
  BT: 'Bhutan', BV: 'Bouvet Island', CC: 'Cocos Islands',
  CK: 'Cook Islands', CV: 'Cape Verde', CW: 'Curacao',
  CX: 'Christmas Island', DJ: 'Djibouti', DM: 'Dominica',
  EH: 'W. Sahara', FJ: 'Fiji', FK: 'Falkland Islands',
  FM: 'Micronesia', FO: 'Faroe Islands', GD: 'Grenada',
  GG: 'Guernsey', GI: 'Gibraltar', GL: 'Greenland',
  GP: 'Guadeloupe', GQ: 'Eq. Guinea', GU: 'Guam',
  GW: 'Guinea-Bissau', HK: 'Hong Kong', HM: 'Heard Island',
  IM: 'Isle of Man', IO: 'British Indian Ocean',
  JE: 'Jersey', KI: 'Kiribati', KM: 'Comoros',
  KN: 'St. Kitts & Nevis', KY: 'Cayman Islands',
  LC: 'St. Lucia', LI: 'Liechtenstein', MF: 'St. Martin',
  MH: 'Marshall Islands', MO: 'Macao', MP: 'N. Mariana Islands',
  MQ: 'Martinique', MS: 'Montserrat', MT: 'Malta',
  MU: 'Mauritius', MV: 'Maldives', NF: 'Norfolk Island',
  NR: 'Nauru', NU: 'Niue', PF: 'French Polynesia',
  PM: 'St. Pierre & Miquelon', PN: 'Pitcairn', PR: 'Puerto Rico',
  PW: 'Palau', RE: 'Reunion', SC: 'Seychelles',
  SH: 'St. Helena', SJ: 'Svalbard', SM: 'San Marino',
  SS: 'South Sudan', ST: 'Sao Tome & Principe', SX: 'Sint Maarten',
  TC: 'Turks & Caicos', TF: 'French S. Territories',
  TK: 'Tokelau', TL: 'Timor-Leste', TO: 'Tonga',
  TV: 'Tuvalu', UM: 'U.S. Minor Islands',
  VA: 'Vatican', VC: 'St. Vincent', VG: 'British Virgin Islands',
  VI: 'U.S. Virgin Islands', VU: 'Vanuatu', WF: 'Wallis & Futuna',
  WS: 'Samoa', XK: 'Kosovo', YT: 'Mayotte',
};

const COUNTRY_NAME_ALIASES = {
  'united states': 'united states of america',
  'russian federation': 'russia',
  'korea the republic of': 'south korea',
  'czechia': 'czech republic',
  'n a': 'unknown',
};

const UNKNOWN_COUNTRY_LABEL = 'Unknown region';

// ─── Pure utility functions ───────────────────────────────────────────────────

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

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Heavy computations ───────────────────────────────────────────────────────

/**
 * Parses raw node rows from /api/public/lightning/world into
 * { points: [...], lines: [] } (lines come from channelsGeoLines separately).
 */
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
    const countryNameRaw =
      typeof row[6] === 'string'
        ? row[6].trim()
        : String(row[6]?.en || row[6]?.['pt-BR'] || Object.values(row[6] || {})[0] || '').trim();
    const countryName = countryNameRaw || ISO_COUNTRY_NAMES[countryCode] || UNKNOWN_COUNTRY_LABEL;
    if (!channels || capacity < 500_000) return;
    points.push({
      lat,
      lng,
      capacity,
      channels,
      alias: String(row[3] || '').trim() || '—',
      countryCode,
      countryName,
      pubkey: String(row[2] || '').trim(),
    });
  });

  return { points, lines: [] };
}

/**
 * Aggregates raw nodes into per-country stats arrays.
 */
function parseLightningCountryCounts(payloadData) {
  const nodes = payloadData?.nodes;
  if (!Array.isArray(nodes)) return [];
  const map = new Map();
  nodes.forEach((row) => {
    if (!Array.isArray(row)) return;
    const capacity = Number(row[4]);
    const channels = Number(row[5]);
    const countryMeta = row[6];
    const countryCodeRaw = String(row[7] || '').toUpperCase();
    const countryCode = /^[A-Z]{2}$/.test(countryCodeRaw) ? countryCodeRaw : '';
    const countryName =
      typeof countryMeta === 'string'
        ? countryMeta.trim()
        : String(countryMeta?.en || '').trim() ||
          String(countryMeta?.['pt-BR'] || '').trim() ||
          String(Object.values(countryMeta || {})[0] || '').trim();
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

/**
 * Resolves country rows: matches API country codes/names to GeoJSON feature codes.
 */
function resolveCountryRows(countryCounts, featureCodeByName, featureNameByCode) {
  return countryCounts.map((row) => {
    const directCode = String(row.country_code || '').toUpperCase();
    const countryName = String(row.country_name || '').trim();
    const normalizedName = normalizeCountryName(countryName);
    const aliasedName = COUNTRY_NAME_ALIASES[normalizedName] || normalizedName;
    const inferredCode = featureCodeByName.get ? featureCodeByName.get(aliasedName) || '' : (featureCodeByName[aliasedName] || '');
    const resolvedCode = /^[A-Z]{2}$/.test(directCode) ? directCode : inferredCode;
    const resolvedNameFromCode = featureNameByCode.get
      ? featureNameByCode.get(resolvedCode) || ''
      : (featureNameByCode[resolvedCode] || '');
    const isoFallbackName = ISO_COUNTRY_NAMES[resolvedCode] || '';
    const displayName = resolvedNameFromCode || isoFallbackName;
    const baseName = isUnknownCountryValue(countryName)
      ? displayName || (/^[A-Z]{2}$/.test(resolvedCode) ? resolvedCode : UNKNOWN_COUNTRY_LABEL)
      : countryName || displayName || resolvedCode || UNKNOWN_COUNTRY_LABEL;
    const label =
      resolvedCode && displayName ? `${baseName} (${resolvedCode})` : baseName;
    return { ...row, country_label: label, country_code_resolved: resolvedCode || 'UNKNOWN' };
  });
}

/**
 * Computes average channel geographic distance per node pubkey (km).
 */
function computeAvgDistByPubkey(channelsGeoLines) {
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
}

/**
 * Builds statsByCode, perCapitaByCode, maxAbsoluteByMetric, maxPerCapitaByMetric.
 */
function computeCountryStats(metricRows, populationMap) {
  // statsByCode
  const statsByCode = {};
  metricRows.forEach((row) => {
    const c = row.country_code_resolved;
    if (!statsByCode[c]) statsByCode[c] = { nodes: 0, channels: 0, capacity: 0 };
    statsByCode[c].nodes    += row.nodes;
    statsByCode[c].channels += row.channels;
    statsByCode[c].capacity += row.capacity;
  });

  // totals
  const totals = metricRows.reduce(
    (acc, row) => {
      acc.nodes    += row.nodes;
      acc.channels += row.channels;
      acc.capacity += row.capacity;
      return acc;
    },
    { nodes: 0, channels: 0, capacity: 0 },
  );

  // perCapitaByCode (values per million inhabitants)
  const perCapitaByCode = {};
  metricRows.forEach((row) => {
    const c = row.country_code_resolved;
    if (!/^[A-Z]{2}$/.test(c)) return;
    const popM = populationMap[c];
    if (!popM) return;
    if (!perCapitaByCode[c]) perCapitaByCode[c] = { nodes: 0, channels: 0, capacity: 0 };
    perCapitaByCode[c].nodes    += row.nodes    / popM;
    perCapitaByCode[c].channels += row.channels / popM;
    perCapitaByCode[c].capacity += row.capacity / popM / 100_000_000; // BTC/M
  });

  // maxAbsoluteByMetric
  const absVals = Object.values(statsByCode);
  const maxAbsoluteByMetric = absVals.length
    ? {
        nodes:    Math.max(...absVals.map((s) => s.nodes)),
        channels: Math.max(...absVals.map((s) => s.channels)),
        capacity: Math.max(...absVals.map((s) => s.capacity)),
      }
    : { nodes: 0, channels: 0, capacity: 0 };

  // maxPerCapitaByMetric
  const pcVals = Object.values(perCapitaByCode);
  const maxPerCapitaByMetric = pcVals.length
    ? {
        nodes:    Math.max(...pcVals.map((s) => s.nodes    || 0)),
        channels: Math.max(...pcVals.map((s) => s.channels || 0)),
        capacity: Math.max(...pcVals.map((s) => s.capacity || 0)),
      }
    : { nodes: 0, channels: 0, capacity: 0 };

  return { statsByCode, totals, perCapitaByCode, maxAbsoluteByMetric, maxPerCapitaByMetric };
}

/**
 * Computes max metric values for network (bubble) mode.
 */
function computeNetworkMaxByMetric(points, avgDistByPubkey) {
  if (!points.length) return { channels: 0, capacity: 0, dist: 0 };
  return {
    channels: Math.max(...points.map((pt) => pt.channels || 0)),
    capacity: Math.max(...points.map((pt) => pt.capacity || 0)),
    dist:     Math.max(...points.map((pt) => avgDistByPubkey[pt.pubkey] || 0)),
  };
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = (event) => {
  const { type, payload, channelsGeoLines, populationMap, featureCodeByName, featureNameByCode } = event.data;

  if (type !== 'PROCESS') return;

  try {
    // 1. Parse network node points (canvas scatter map)
    const networkPoints = parseLightningNetworkData(payload).points;

    // 2. Country aggregation for choropleth/bubble layers
    const countryCounts = parseLightningCountryCounts(payload);

    // 3. Resolve country codes/names against GeoJSON features
    //    featureCodeByName and featureNameByCode arrive as plain objects (Maps can't be structured-cloned)
    const resolvedCountryRows = resolveCountryRows(countryCounts, featureCodeByName, featureNameByCode);

    // 4. Metric rows — only confirmed ISO-2 codes
    const metricRows = resolvedCountryRows.filter((row) => /^[A-Z]{2}$/.test(row.country_code_resolved));

    // 5. Country stats (statsByCode, perCapita, maxima)
    const { statsByCode, totals, perCapitaByCode, maxAbsoluteByMetric, maxPerCapitaByMetric } =
      computeCountryStats(metricRows, populationMap);

    // 6. Average channel geographic distance per pubkey (haversine over all lines)
    const avgDistByPubkey = computeAvgDistByPubkey(channelsGeoLines);

    // 7. Max metric values for network canvas mode
    const networkMaxByMetric = computeNetworkMaxByMetric(networkPoints, avgDistByPubkey);

    self.postMessage({
      type: 'RESULT',
      networkPoints,
      resolvedCountryRows,
      metricRows,
      statsByCode,
      totals,
      perCapitaByCode,
      maxAbsoluteByMetric,
      maxPerCapitaByMetric,
      avgDistByPubkey,
      networkMaxByMetric,
    });
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: String(err?.message || err) });
  }
};
