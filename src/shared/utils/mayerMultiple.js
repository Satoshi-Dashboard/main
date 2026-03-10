const DAY_MS = 86_400_000;

export const MAYER_SMA_WINDOW = 200;
export const MAYER_EXTREME_UNDERVALUE = 0.8;
export const MAYER_FAIR_VALUE = 1.0;
export const MAYER_HISTORICAL_AVERAGE = 1.3;
export const MAYER_OVERVALUED = 2.4;

function normalizePricePoint(point) {
  const ts = Number(point?.ts);
  const price = Number(point?.price);

  if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return {
    ...point,
    ts,
    price,
  };
}

export function getMayerState(mm) {
  const value = Number(mm);

  if (!Number.isFinite(value)) {
    return {
      key: 'neutral',
      label: 'Neutral',
      color: 'var(--text-secondary)',
    };
  }

  if (value < MAYER_FAIR_VALUE) {
    return {
      key: 'undervalued',
      label: 'Undervalued',
      color: 'var(--accent-green)',
    };
  }

  if (value > MAYER_OVERVALUED) {
    return {
      key: 'overvalued',
      label: 'Overvalued',
      color: 'var(--accent-red)',
    };
  }

  return {
    key: 'neutral',
    label: 'Neutral',
    color: 'var(--accent-warning)',
  };
}

export function calcularMayerMultiple(pricePoints = []) {
  const normalizedPoints = (Array.isArray(pricePoints) ? pricePoints : [])
    .map(normalizePricePoint)
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  const window = [];
  let rollingSum = 0;

  return normalizedPoints.map((point) => {
    window.push(point.price);
    rollingSum += point.price;

    if (window.length > MAYER_SMA_WINDOW) {
      rollingSum -= window.shift();
    }

    const hasSma = window.length >= MAYER_SMA_WINDOW;
    const sma200 = hasSma ? (rollingSum / MAYER_SMA_WINDOW) : null;
    const mayerMultiple = hasSma && sma200 > 0 ? point.price / sma200 : null;
    const state = getMayerState(mayerMultiple);

    return {
      ...point,
      sma200,
      mayerMultiple,
      mayerState: state.key,
      mayerLabel: state.label,
      mayerColor: state.color,
    };
  });
}

export function sliceMayerSeriesByDays(series = [], days = 365) {
  const validSeries = Array.isArray(series) ? series.filter((point) => Number.isFinite(point?.ts)) : [];
  if (!validSeries.length) return [];

  const latestTs = Number(validSeries.at(-1)?.ts);
  if (!Number.isFinite(latestTs)) return validSeries;

  const cutoff = latestTs - (Math.max(1, Number(days) || 0) * DAY_MS);
  const filtered = validSeries.filter((point) => point.ts >= cutoff);

  if (filtered.length) return filtered;
  return [validSeries.at(-1)];
}

export function buildCurrentMayerSnapshot(series = [], livePrice = null) {
  const validSeries = (Array.isArray(series) ? series : [])
    .filter((point) => Number.isFinite(point?.mayerMultiple) && Number.isFinite(point?.sma200));

  if (!validSeries.length) {
    return {
      currentPrice: Number.isFinite(livePrice) && livePrice > 0 ? livePrice : null,
      currentSma200: null,
      currentMayerMultiple: null,
      previousMayerMultiple: null,
      changePct: null,
      state: getMayerState(null),
      latestPoint: null,
    };
  }

  const latestPoint = validSeries.at(-1);
  const previousPoint = validSeries.at(-2) || null;
  const currentPrice = Number.isFinite(livePrice) && livePrice > 0 ? livePrice : latestPoint.price;
  const currentSma200 = latestPoint.sma200;
  const currentMayerMultiple = Number.isFinite(currentPrice) && Number.isFinite(currentSma200) && currentSma200 > 0
    ? currentPrice / currentSma200
    : latestPoint.mayerMultiple;
  const previousMayerMultiple = previousPoint?.mayerMultiple ?? null;
  const changePct = Number.isFinite(previousMayerMultiple) && previousMayerMultiple > 0 && Number.isFinite(currentMayerMultiple)
    ? ((currentMayerMultiple - previousMayerMultiple) / previousMayerMultiple) * 100
    : null;

  return {
    currentPrice,
    currentSma200,
    currentMayerMultiple,
    previousMayerMultiple,
    changePct,
    state: getMayerState(currentMayerMultiple),
    latestPoint,
  };
}

export function buildRangeChange(currentValue, series = []) {
  const validSeries = (Array.isArray(series) ? series : [])
    .filter((point) => Number.isFinite(point?.mayerMultiple));

  if (!Number.isFinite(currentValue) || !validSeries.length) {
    return {
      absolute: null,
      percent: null,
      startValue: null,
    };
  }

  const startValue = validSeries[0]?.mayerMultiple;
  if (!Number.isFinite(startValue) || startValue <= 0) {
    return {
      absolute: null,
      percent: null,
      startValue: null,
    };
  }

  const absolute = currentValue - startValue;
  const percent = (absolute / startValue) * 100;

  return {
    absolute,
    percent,
    startValue,
  };
}

export const calculateMayerMultiple = calcularMayerMultiple;
