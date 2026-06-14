export const US_NATIONAL_DEBT_SERIES_PAGE_SIZE = 40;

export const US_NATIONAL_DEBT_RATE_WINDOW = 30;

export const ACS_POPULATION_MIN_YEAR = 2020;

export const BTC_GENESIS_TS = Date.UTC(2009, 0, 3, 18, 15, 5);

export const BTC_HALVING_INTERVAL_BLOCKS = 210_000;

export const BTC_TARGET_BLOCK_INTERVAL_MS = 10 * 60 * 1000;

export const BTC_MAX_SUPPLY = 21_000_000;

export const BTC_CURRENT_HALVING_REWARD = 3.125;

export const JOHOE_BTC_QUEUE_BUCKET_BOUNDARIES = [
  0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1,
  1.2, 1.4, 1.7, 2, 2.5, 3, 4, 5, 6, 7,
  8, 10, 12, 14, 17, 20, 25, 30, 40, 50,
  60, 70, 80, 100, 120, 140, 170, 200, 250, 300,
  400, 500, 600, 700, 800, 1000, 1200, 1400, 1700, 2000,
  2500, 3000, 4000, 5000, 6000, 7000, 8000, 10000,
];

export const JOHOE_BTC_QUEUE_GROUPS = [
  { key: 'fee_0_1', minFee: 0, maxFee: 1, bucketStart: 0, bucketEnd: 9, color: '#535154' },
  { key: 'fee_1_2', minFee: 1, maxFee: 2, bucketStart: 9, bucketEnd: 13, color: '#2C4B86' },
  { key: 'fee_2_3', minFee: 2, maxFee: 3, bucketStart: 13, bucketEnd: 15, color: '#2F73C7' },
  { key: 'fee_3_5', minFee: 3, maxFee: 5, bucketStart: 15, bucketEnd: 17, color: '#3EA1FF' },
  { key: 'fee_5_10', minFee: 5, maxFee: 10, bucketStart: 17, bucketEnd: 21, color: '#20C997' },
  { key: 'fee_10_20', minFee: 10, maxFee: 20, bucketStart: 21, bucketEnd: 25, color: '#63D471' },
  { key: 'fee_20_50', minFee: 20, maxFee: 50, bucketStart: 25, bucketEnd: 29, color: '#C8D84F' },
  { key: 'fee_50_100', minFee: 50, maxFee: 100, bucketStart: 29, bucketEnd: 33, color: '#F0BD45' },
  { key: 'fee_100_200', minFee: 100, maxFee: 200, bucketStart: 33, bucketEnd: 37, color: '#F28A2E' },
  { key: 'fee_200_500', minFee: 200, maxFee: 500, bucketStart: 37, bucketEnd: 41, color: '#E35D37' },
  { key: 'fee_500_1000', minFee: 500, maxFee: 1000, bucketStart: 41, bucketEnd: 45, color: '#C93A3A' },
  { key: 'fee_1000_plus', minFee: 1000, maxFee: null, bucketStart: 45, bucketEnd: JOHOE_BTC_QUEUE_BUCKET_BOUNDARIES.length, color: '#6B1014' },
];

export const JOHOE_BTC_QUEUE_MAX_SOURCE_AGE_MS = 3 * 60_000;

import { normalizeTimestamp, parseIsoDate } from './timeUtils.js';

export function parseSuffixedUsdNumber(value) {
  const match = String(value || '').trim().match(/^\$?\s*([\d.,]+)\s*([TMBK])?$/i);
  if (!match) return null;

  const amount = Number(String(match[1]).replace(/,/g, ''));
  if (!Number.isFinite(amount)) return null;

  const suffix = String(match[2] || '').toUpperCase();
  const multiplier = suffix === 'T'
    ? 1e12
    : suffix === 'B'
      ? 1e9
      : suffix === 'M'
        ? 1e6
        : suffix === 'K'
          ? 1e3
          : 1;

  return amount * multiplier;
}

export function parsePercentValue(value) {
  const parsed = Number(String(value || '').replace(/[%+,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function firstFiniteNumber(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) return value;
  }
  return null;
}

export function sizeUnitToBytes(unit) {
  const normalized = String(unit || '').trim().toUpperCase();
  if (!normalized || normalized === 'B' || normalized.startsWith('BYTE')) return 1;
  if (normalized === 'KB') return 1e3;
  if (normalized === 'MB') return 1e6;
  if (normalized === 'GB') return 1e9;
  if (normalized === 'TB') return 1e12;
  return null;
}

export function parseSizedValueToBytes(value, defaultUnit = '') {
  if (value == null) return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const fallbackMultiplier = sizeUnitToBytes(defaultUnit);
    return fallbackMultiplier ? value * fallbackMultiplier : value;
  }

  const match = String(value).trim().match(/([\d.,]+)\s*(TB|GB|MB|KB|B|BYTES?)?/i);
  if (!match) return null;

  const amount = Number(String(match[1]).replace(/,/g, ''));
  if (!Number.isFinite(amount)) return null;

  const unitMultiplier = sizeUnitToBytes(match[2] || defaultUnit);
  return unitMultiplier ? amount * unitMultiplier : amount;
}

export function parseMemoryUsagePairText(value) {
  if (typeof value !== 'string') return null;

  const match = value.match(/([\d.,]+)\s*(TB|GB|MB|KB|B)?\s*(?:\/|of)\s*([\d.,]+)\s*(TB|GB|MB|KB|B)?/i);
  if (!match) return null;

  const usageUnit = match[2] || match[4] || 'MB';
  const maxUnit = match[4] || usageUnit;
  const usageBytes = parseSizedValueToBytes(`${match[1]} ${usageUnit}`);
  const maxBytes = parseSizedValueToBytes(`${match[3]} ${maxUnit}`);

  if (!Number.isFinite(usageBytes) || !Number.isFinite(maxBytes)) return null;

  return {
    usageBytes,
    maxBytes,
    label: value.trim(),
  };
}

export function normalizeOfficialMempoolUsage(raw) {
  const data = raw?.data ?? raw?.mempoolInfo ?? raw;

  const textPair = [
    data?.label,
    data?.memory_usage_label,
    data?.memoryUsageLabel,
    data?.summary,
    data?.text,
    data?.value,
  ]
    .map(parseMemoryUsagePairText)
    .find(Boolean) || null;

  let usageBytes = firstFiniteNumber(
    parseSizedValueToBytes(data?.usage_bytes, 'B'),
    parseSizedValueToBytes(data?.usageBytes, 'B'),
    parseSizedValueToBytes(data?.memory_usage_bytes, 'B'),
    parseSizedValueToBytes(data?.memoryUsageBytes, 'B'),
    parseSizedValueToBytes(data?.used_bytes, 'B'),
    parseSizedValueToBytes(data?.usedBytes, 'B'),
    parseSizedValueToBytes(data?.usage),
    parseSizedValueToBytes(data?.used),
    parseSizedValueToBytes(data?.memory_usage),
    parseSizedValueToBytes(data?.memoryUsage),
    parseSizedValueToBytes(data?.current),
    textPair?.usageBytes ?? null,
  );

  let maxBytes = firstFiniteNumber(
    parseSizedValueToBytes(data?.maxmempool_bytes, 'B'),
    parseSizedValueToBytes(data?.maxMempoolBytes, 'B'),
    parseSizedValueToBytes(data?.max_bytes, 'B'),
    parseSizedValueToBytes(data?.maxBytes, 'B'),
    parseSizedValueToBytes(data?.limit_bytes, 'B'),
    parseSizedValueToBytes(data?.limitBytes, 'B'),
    parseSizedValueToBytes(data?.maxmempool),
    parseSizedValueToBytes(data?.maxMempool),
    parseSizedValueToBytes(data?.max),
    parseSizedValueToBytes(data?.limit),
    parseSizedValueToBytes(data?.memory_limit),
    parseSizedValueToBytes(data?.memoryLimit),
    parseSizedValueToBytes(data?.capacity),
    textPair?.maxBytes ?? null,
  );

  if (Number.isFinite(usageBytes) && Number.isFinite(maxBytes) && usageBytes <= 10_000 && maxBytes <= 10_000) {
    usageBytes *= 1e6;
    maxBytes *= 1e6;
  }

  return {
    usage: usageBytes,
    maxmempool: maxBytes,
    label: textPair?.label || null,
    cached_at: raw?._meta?.cachedAt ?? null,
    scraper_name: raw?._meta?.scraper ?? null,
  };
}

export function estimateBitcoinCirculatingSupply(ts) {
  const targetTs = Number(ts);
  if (!Number.isFinite(targetTs) || targetTs <= BTC_GENESIS_TS) return 0;

  let remainingBlocks = Math.floor((targetTs - BTC_GENESIS_TS) / BTC_TARGET_BLOCK_INTERVAL_MS);
  let reward = 50;
  let era = 0;
  let total = 0;

  while (remainingBlocks > 0 && reward > 0) {
    const eraBlocks = Math.min(remainingBlocks, BTC_HALVING_INTERVAL_BLOCKS);
    total += eraBlocks * reward;
    remainingBlocks -= eraBlocks;
    era += 1;
    reward = 50 / (2 ** era);
  }

  return Math.min(BTC_MAX_SUPPLY, total);
}

export function buildS15GoldSnapshot(raw) {
  const marketCapUsd = parseSuffixedUsdNumber(raw?.marketCap);
  const priceUsdPerOunce = parseSuffixedUsdNumber(raw?.price);
  const marketCapTrillions = Number.isFinite(marketCapUsd) ? Number((marketCapUsd / 1e12).toFixed(2)) : null;

  return {
    id: String(raw?.id || 'GOLD').toUpperCase(),
    market_cap_usd: marketCapUsd,
    market_cap_trillions: marketCapTrillions,
    price_usd_per_ounce: priceUsdPerOunce,
    change_today_pct: parsePercentValue(raw?.changeTodayPct),
    source: String(raw?.source || 'companiesmarketcap.com'),
    page_url: typeof raw?.url === 'string' ? raw.url : 'https://companiesmarketcap.com/gold/marketcap/',
    assets_url: typeof raw?.assetsUrl === 'string' ? raw.assetsUrl : 'https://companiesmarketcap.com/assets-by-market-cap/',
    scraper_cached_at: typeof raw?._meta?.cachedAt === 'string' ? raw._meta.cachedAt : null,
    scraper_name: typeof raw?._meta?.scraper === 'string' ? raw._meta.scraper : null,
  };
}

export function toChartPoint(ts, price) {
  return {
    ts,
    price,
    date: new Date(ts)
      .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      .replace('/', '.'),
  };
}

export function validateArray(value) {
  return Array.isArray(value) && value.length > 0;
}

export function validateObject(value) {
  return Boolean(value && typeof value === 'object');
}

export function validateS15GoldPayload(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && Number.isFinite(value.market_cap_usd)
      && value.market_cap_usd > 0
      && Number.isFinite(value.market_cap_trillions)
      && value.market_cap_trillions > 0,
  );
}

export function validateCountryBusinessPayload(value) {
  return validateObject(value) && Array.isArray(value.country_counts);
}

export function validateUsNationalDebtSeries(value) {
  return Array.isArray(value)
    && value.length >= 2
    && value.every((row) => row?.record_date && Number.isFinite(Number(row?.total_debt)));
}

export function validateUsPopulationEstimate(value) {
  return validateObject(value) && Number.isFinite(Number(value.population));
}

export function normalizeNumericBucketArray(value) {
  if (!Array.isArray(value) || value.length !== JOHOE_BTC_QUEUE_BUCKET_BOUNDARIES.length) {
    return null;
  }

  const normalized = value.map((item) => Number(item));
  return normalized.every((item) => Number.isFinite(item) && item >= 0) ? normalized : null;
}

export function sumBucketSlice(buckets, start, end) {
  if (!Array.isArray(buckets)) return null;
  let total = 0;
  for (let index = start; index < end; index += 1) {
    const value = Number(buckets[index]);
    if (!Number.isFinite(value)) return null;
    total += value;
  }
  return total;
}

export function toFiniteNumberOrNull(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function buildJohoeGroupedBands(point) {
  return JOHOE_BTC_QUEUE_GROUPS.map((band) => ({
    key: band.key,
    label: band.maxFee == null ? `${band.minFee}+` : `${band.minFee}-${band.maxFee}`,
    longLabel: band.maxFee == null ? `${band.minFee}+ sat/vB` : `${band.minFee}-${band.maxFee} sat/vB`,
    minFee: band.minFee,
    maxFee: band.maxFee,
    color: band.color,
    count: sumBucketSlice(point.countBuckets, band.bucketStart, band.bucketEnd),
    weight: sumBucketSlice(point.weightBuckets, band.bucketStart, band.bucketEnd),
    fee: sumBucketSlice(point.feeBuckets, band.bucketStart, band.bucketEnd),
  }));
}

export function normalizeJohoePoint(rawPoint, { preferLatestKeys = false } = {}) {
  const timestampSeconds = Number(rawPoint?.snapshotTsUnix ?? rawPoint?.timestamp);
  const snapshotTs = typeof rawPoint?.snapshotTs === 'string'
    ? rawPoint.snapshotTs
    : (typeof rawPoint?.date === 'string' ? rawPoint.date : null);
  const fetchedAt = typeof rawPoint?.fetchedAt === 'string'
    ? rawPoint.fetchedAt
    : (typeof rawPoint?.fetched_at === 'string' ? rawPoint.fetched_at : null);
  const ts = Number.isFinite(timestampSeconds)
    ? timestampSeconds * 1000
    : (snapshotTs ? Date.parse(snapshotTs) : null);
  const countBuckets = normalizeNumericBucketArray(rawPoint?.countBuckets);
  const weightBuckets = normalizeNumericBucketArray(rawPoint?.weightBuckets);
  const feeBuckets = normalizeNumericBucketArray(rawPoint?.feeBuckets);

  if (!Number.isFinite(ts) || !countBuckets || !weightBuckets || !feeBuckets) {
    return null;
  }

  const sumCount = sumBucketSlice(countBuckets, 0, countBuckets.length);
  const sumWeight = sumBucketSlice(weightBuckets, 0, weightBuckets.length);
  const sumFee = sumBucketSlice(feeBuckets, 0, feeBuckets.length);

  const countTotal = preferLatestKeys
    ? (toFiniteNumberOrNull(rawPoint?.latest?.count) ?? toFiniteNumberOrNull(rawPoint?.count) ?? toFiniteNumberOrNull(rawPoint?.countTotal) ?? sumCount)
    : (toFiniteNumberOrNull(rawPoint?.countTotal) ?? toFiniteNumberOrNull(rawPoint?.count) ?? toFiniteNumberOrNull(rawPoint?.latest?.count) ?? sumCount);
  const weightTotal = preferLatestKeys
    ? (toFiniteNumberOrNull(rawPoint?.latest?.weight) ?? toFiniteNumberOrNull(rawPoint?.weight) ?? toFiniteNumberOrNull(rawPoint?.weightTotal) ?? sumWeight)
    : (toFiniteNumberOrNull(rawPoint?.weightTotal) ?? toFiniteNumberOrNull(rawPoint?.weight) ?? toFiniteNumberOrNull(rawPoint?.latest?.weight) ?? sumWeight);
  const feeTotal = preferLatestKeys
    ? (toFiniteNumberOrNull(rawPoint?.latest?.fee) ?? toFiniteNumberOrNull(rawPoint?.fee) ?? toFiniteNumberOrNull(rawPoint?.feeTotal) ?? sumFee)
    : (toFiniteNumberOrNull(rawPoint?.feeTotal) ?? toFiniteNumberOrNull(rawPoint?.fee) ?? toFiniteNumberOrNull(rawPoint?.latest?.fee) ?? sumFee);

  if (
    !Number.isFinite(countTotal)
    || !Number.isFinite(weightTotal)
    || !Number.isFinite(feeTotal)
  ) {
    return null;
  }

  return {
    ts,
    snapshotTsUnix: Number.isFinite(timestampSeconds) ? timestampSeconds : Math.floor(ts / 1000),
    snapshotTs: snapshotTs ?? new Date(ts).toISOString(),
    fetchedAt,
    date: snapshotTs ?? new Date(ts).toISOString(),
    countTotal,
    weightTotal,
    feeTotal,
    countBuckets,
    weightBuckets,
    feeBuckets,
    groupedBands: buildJohoeGroupedBands({ countBuckets, weightBuckets, feeBuckets }),
  };
}

export function validateJohoeHistoryPayload(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && Array.isArray(value.points)
      && value.points.length > 0
      && value.points.every((point) => normalizeJohoePoint(point) !== null),
  );
}

export function validateJohoeLatestPayload(value) {
  return normalizeJohoePoint(value, { preferLatestKeys: true, preferTotalKeys: false }) !== null;
}

export function normalizeJohoeHistoryResponse(raw, range) {
  const points = Array.isArray(raw?.points) ? raw.points.map((point) => normalizeJohoePoint(point)).filter(Boolean) : [];
  return {
    range,
    label: typeof raw?.dataset?.label === 'string' ? raw.dataset.label : range,
    resolution: typeof raw?.dataset?.resolution === 'string' ? raw.dataset.resolution : null,
    rolling: Boolean(raw?.dataset?.rolling),
    pointCount: points.length,
    points,
    meta: {
      source: typeof raw?.source === 'string' ? raw.source : 'johoe',
      provider: typeof raw?.provider === 'string' ? raw.provider : 'api.zatobox.io',
      network: typeof raw?.network === 'string' ? raw.network : 'btc',
      pollIntervalMs: toFiniteNumberOrNull(raw?._meta?.pollIntervalMs),
      cachedAt: typeof raw?._meta?.cachedAt === 'string' ? raw._meta.cachedAt : null,
      lastSuccessfulSyncAt: typeof raw?._meta?.lastSuccessfulSyncAt === 'string' ? raw._meta.lastSuccessfulSyncAt : null,
      stale: Boolean(raw?._meta?.stale),
    },
  };
}

export function normalizeJohoeLatestResponse(raw) {
  const latestPoint = normalizeJohoePoint(raw, { preferLatestKeys: true, preferTotalKeys: false });
  if (!latestPoint) return null;

  return {
    ...latestPoint,
    meta: {
      source: typeof raw?.source === 'string' ? raw.source : 'johoe',
      provider: typeof raw?.provider === 'string' ? raw.provider : 'api.zatobox.io',
      network: typeof raw?.network === 'string' ? raw.network : 'btc',
      sourceRange: typeof raw?.sourceRange === 'string' ? raw.sourceRange : null,
      resolution: typeof raw?._meta?.resolution === 'string' ? raw._meta.resolution : null,
      pollIntervalMs: toFiniteNumberOrNull(raw?._meta?.pollIntervalMs),
      cachedAt: typeof raw?._meta?.cachedAt === 'string' ? raw._meta.cachedAt : null,
      lastSuccessfulSyncAt: typeof raw?._meta?.lastSuccessfulSyncAt === 'string' ? raw._meta.lastSuccessfulSyncAt : null,
      stale: Boolean(raw?._meta?.stale),
    },
  };
}

export function getJohoePointAgeMs(point, nowMs = Date.now()) {
  const snapshotMs = Number(point?.ts);
  if (!Number.isFinite(snapshotMs)) return null;
  return Math.max(0, nowMs - snapshotMs);
}

export function getJohoeHistoryAgeMs(payload, nowMs = Date.now()) {
  const latestPoint = Array.isArray(payload?.points) ? payload.points.at(-1) : null;
  return getJohoePointAgeMs(latestPoint, nowMs);
}

export function isJohoeSourceFresh(ageMs) {
  return Number.isFinite(ageMs) && ageMs <= JOHOE_BTC_QUEUE_MAX_SOURCE_AGE_MS;
}

export function assertFreshJohoeHistoryPayload(payload, providerLabel) {
  const ageMs = getJohoeHistoryAgeMs(payload);
  if (!isJohoeSourceFresh(ageMs)) {
    throw new PublicFeedError(`Johoe BTC queue history (24h) from ${providerLabel} is stale`);
  }
  return payload;
}

export function assertFreshJohoeLatestPayload(payload, providerLabel) {
  const ageMs = getJohoePointAgeMs(payload);
  if (!isJohoeSourceFresh(ageMs)) {
    throw new PublicFeedError(`Johoe BTC queue latest from ${providerLabel} is stale`);
  }
  return payload;
}

export function stripJohoeBandMeta(band) {
  return {
    key: band.key,
    label: band.maxFee == null ? `${band.minFee}+` : `${band.minFee}-${band.maxFee}`,
    longLabel: band.maxFee == null ? `${band.minFee}+ sat/vB` : `${band.minFee}-${band.maxFee} sat/vB`,
    minFee: band.minFee,
    maxFee: band.maxFee,
    color: band.color,
  };
}

export function buildJohoeViewPoint(point) {
  return {
    ts: point.ts,
    snapshot_ts_unix: point.snapshotTsUnix,
    snapshot_ts: point.snapshotTs,
    fetched_at: point.fetchedAt,
    totals: {
      count: point.countTotal,
      weight: point.weightTotal,
      fee: point.feeTotal,
    },
    series: {
      count: point.groupedBands.map((band) => band.count),
      weight: point.groupedBands.map((band) => band.weight),
      fee: point.groupedBands.map((band) => band.fee),
    },
  };
}

export function buildJohoeCompactPoints(points) {
  const pointCount = points.length;
  const timestamps = new Array(pointCount);
  const snapshotTs = new Array(pointCount);
  const fetchedAt = new Array(pointCount);
  const totals = {
    count: new Array(pointCount),
    weight: new Array(pointCount),
    fee: new Array(pointCount),
  };
  const series = {
    count: JOHOE_BTC_QUEUE_GROUPS.map(() => new Array(pointCount)),
    weight: JOHOE_BTC_QUEUE_GROUPS.map(() => new Array(pointCount)),
    fee: JOHOE_BTC_QUEUE_GROUPS.map(() => new Array(pointCount)),
  };

  points.forEach((point, pointIndex) => {
    timestamps[pointIndex] = point.ts;
    snapshotTs[pointIndex] = point.snapshot_ts ?? null;
    fetchedAt[pointIndex] = point.fetched_at ?? null;
    totals.count[pointIndex] = point.totals.count;
    totals.weight[pointIndex] = point.totals.weight;
    totals.fee[pointIndex] = point.totals.fee;

    point.series.count.forEach((value, bandIndex) => {
      series.count[bandIndex][pointIndex] = value;
    });
    point.series.weight.forEach((value, bandIndex) => {
      series.weight[bandIndex][pointIndex] = value;
    });
    point.series.fee.forEach((value, bandIndex) => {
      series.fee[bandIndex][pointIndex] = value;
    });
  });

  return {
    point_count: pointCount,
    ts: timestamps,
    snapshot_ts: snapshotTs,
    fetched_at: fetchedAt,
    totals,
    series,
  };
}

export function downsampleJohoeCompactPoints(pointsMatrix, maxPoints) {
  const pointCount = Number(pointsMatrix?.point_count || pointsMatrix?.ts?.length || 0);
  if (!Number.isFinite(maxPoints) || maxPoints <= 0 || pointCount <= maxPoints) {
    return pointsMatrix;
  }

  const lastIndex = pointCount - 1;
  const sampledIndexes = new Set([0, lastIndex]);
  const step = (pointCount - 1) / Math.max(1, maxPoints - 1);

  for (let sampleIndex = 1; sampleIndex < maxPoints - 1; sampleIndex += 1) {
    sampledIndexes.add(Math.round(sampleIndex * step));
  }

  const indexes = [...sampledIndexes].sort((a, b) => a - b);
  const pick = (values) => indexes.map((index) => values[index]);

  return {
    point_count: indexes.length,
    ts: pick(pointsMatrix.ts || []),
    totals: {
      count: pick(pointsMatrix?.totals?.count || []),
      weight: pick(pointsMatrix?.totals?.weight || []),
      fee: pick(pointsMatrix?.totals?.fee || []),
    },
    series: {
      count: (pointsMatrix?.series?.count || []).map(pick),
      weight: (pointsMatrix?.series?.weight || []).map(pick),
      fee: (pointsMatrix?.series?.fee || []).map(pick),
    },
  };
}

export function toUtcDayMs(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return null;
  return date.getTime();
}

export function normalizeDebtToPennyRows(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .map((row) => {
      const recordDate = String(row?.record_date || '').slice(0, 10);
      const totalDebt = Number(row?.tot_pub_debt_out_amt);
      const debtHeldPublic = Number(row?.debt_held_public_amt);
      const intragovHoldings = Number(row?.intragov_hold_amt);

      if (!recordDate || !Number.isFinite(totalDebt) || totalDebt <= 0) {
        return null;
      }

      return {
        record_date: recordDate,
        total_debt: totalDebt,
        debt_held_public: Number.isFinite(debtHeldPublic) ? debtHeldPublic : null,
        intragovernmental_holdings: Number.isFinite(intragovHoldings) ? intragovHoldings : null,
      };
    })
    .filter(Boolean);
}

export function normalizeUsPopulationEstimate(payload, year) {
  const row = Array.isArray(payload?.[1]) ? payload[1] : null;
  const geography = String(row?.[0] || 'United States').trim() || 'United States';
  const population = Number(row?.[1]);

  if (!Number.isFinite(population) || population <= 0) {
    return null;
  }

  return {
    geography,
    population: Math.round(population),
    dataset_year: year,
    dataset: `ACS 1-Year ${year}`,
    series: 'B01003_001E',
  };
}

export function computeUsNationalDebtRates(series) {
  const ordered = [...series].sort((a, b) => String(a.record_date).localeCompare(String(b.record_date)));
  const latest = ordered.at(-1) || null;
  const previous = ordered.at(-2) || null;
  const trailingWindow = ordered.slice(-Math.min(US_NATIONAL_DEBT_RATE_WINDOW, ordered.length));
  const earliest = trailingWindow[0] || null;
  const latestMs = toUtcDayMs(latest?.record_date);
  const earliestMs = toUtcDayMs(earliest?.record_date);
  const previousMs = toUtcDayMs(previous?.record_date);

  let ratePerSecond = null;
  if (latest && earliest && Number.isFinite(latestMs) && Number.isFinite(earliestMs) && latestMs > earliestMs) {
    ratePerSecond = (Number(latest.total_debt) - Number(earliest.total_debt)) / ((latestMs - earliestMs) / 1000);
  }

  if ((!Number.isFinite(ratePerSecond) || ratePerSecond === null) && latest && previous && Number.isFinite(latestMs) && Number.isFinite(previousMs) && latestMs > previousMs) {
    ratePerSecond = (Number(latest.total_debt) - Number(previous.total_debt)) / ((latestMs - previousMs) / 1000);
  }

  const safeRatePerSecond = Number.isFinite(ratePerSecond) ? ratePerSecond : 0;

  return {
    latest,
    previous,
    windowStart: earliest?.record_date || latest?.record_date || null,
    windowEnd: latest?.record_date || null,
    windowObservations: trailingWindow.length,
    ratePerSecond: safeRatePerSecond,
    ratePerMinute: safeRatePerSecond * 60,
    ratePerHour: safeRatePerSecond * 60 * 60,
    ratePerDay: safeRatePerSecond * 60 * 60 * 24,
    ratePerWeek: safeRatePerSecond * 60 * 60 * 24 * 7,
    ratePerYear: safeRatePerSecond * 60 * 60 * 24 * 365,
  };
}

export function buildUsNationalDebtSnapshot(series, populationEstimate, projectionBaseAt) {
  const rates = computeUsNationalDebtRates(series);
  const totalDebt = Number(rates.latest?.total_debt);
  const debtHeldPublic = Number(rates.latest?.debt_held_public);
  const intragovernmentalHoldings = Number(rates.latest?.intragovernmental_holdings);
  const population = Number(populationEstimate?.population);
  const debtPerPerson = Number.isFinite(totalDebt) && Number.isFinite(population) && population > 0
    ? totalDebt / population
    : null;
  const latestOfficialDelta = rates.previous
    ? Number(rates.latest.total_debt) - Number(rates.previous.total_debt)
    : null;

  if (!Number.isFinite(totalDebt) || totalDebt <= 0) {
    throw new PublicFeedError('U.S. national debt payload is incomplete');
  }

  return {
    total_debt: totalDebt,
    debt_held_public: Number.isFinite(debtHeldPublic) ? debtHeldPublic : null,
    intragovernmental_holdings: Number.isFinite(intragovernmentalHoldings) ? intragovernmentalHoldings : null,
    official_record_date: rates.latest?.record_date || null,
    previous_record_date: rates.previous?.record_date || null,
    latest_official_delta: Number.isFinite(latestOfficialDelta) ? latestOfficialDelta : null,
    projection_base_at: projectionBaseAt,
    interpolation_window_start: rates.windowStart,
    interpolation_window_end: rates.windowEnd,
    interpolation_window_observations: rates.windowObservations,
    population: Number.isFinite(population) ? population : null,
    population_dataset_year: populationEstimate?.dataset_year || null,
    population_dataset: populationEstimate?.dataset || null,
    population_series: populationEstimate?.series || null,
    debt_per_person: Number.isFinite(debtPerPerson) ? debtPerPerson : null,
    debt_per_taxpayer: null,
    debt_per_adult: null,
    rate_per_second: rates.ratePerSecond,
    rate_per_minute: rates.ratePerMinute,
    rate_per_hour: rates.ratePerHour,
    rate_per_day: rates.ratePerDay,
    rate_per_week: rates.ratePerWeek,
    rate_per_year: rates.ratePerYear,
    methodology: {
      interpolation: `Projected real-time interpolation from the trailing ${rates.windowObservations} official Treasury observations.`,
      population_basis: populationEstimate?.dataset
        ? `${populationEstimate.dataset} table ${populationEstimate.series}`
        : null,
      official_series: 'Debt to the Penny',
    },
  };
}

export function normalizeBtcMapCountryAreaResponse(value) {
  if (!Array.isArray(value)) return null;
  const row = value.find((item) => String(item?.tags?.type || '').toLowerCase() === 'country') || value[0];
  const code = String(row?.tags?.iso_a2 || '').toUpperCase();
  const name = String(row?.tags?.name || '').trim();
  if (!/^[A-Z]{2}$/.test(code) || !name) return null;
  return {
    country_code: code,
    country_name: name,
    area_id: Number(row?.id) || null,
    resolved_at: normalizeTimestamp(),
  };
}

export function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current);
  return out;
}

export function parseBigMacUsd(csvText) {
  const lines = String(csvText || '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new PublicFeedError('Big Mac CSV is empty');
  }

  const header = parseCsvLine(lines[0]);
  const isoIndex = header.indexOf('iso_a3');
  const dateIndex = header.indexOf('date');
  const priceIndex = header.indexOf('dollar_price');
  if (isoIndex < 0 || dateIndex < 0 || priceIndex < 0) {
    throw new PublicFeedError('Big Mac CSV columns missing');
  }

  let latest = null;
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    if (row[isoIndex] !== 'USA') continue;

    const price = Number(row[priceIndex]);
    const date = new Date(row[dateIndex]);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (!Number.isFinite(date.getTime())) continue;

    if (!latest || date > latest.date) {
      latest = {
        price,
        date,
      };
    }
  }

  if (!latest) {
    throw new PublicFeedError('Big Mac USA row missing');
  }

  return {
    usd: latest.price,
    as_of: latest.date.toISOString().slice(0, 10),
  };
}

export function candlesNeeded(interval, days) {
  if (interval === '5m')  return days * 288;
  if (interval === '15m') return days * 96;
  if (interval === '30m') return days * 48;
  if (interval === '1h')  return days * 24;
  return days;
}

export function historyFeedKey(days, interval) {
  return `binanceHistory_${days}_${interval}`;
}
