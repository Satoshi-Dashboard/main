const WHOLE_USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const COUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toCompactParts(value) {
  const absolute = Math.abs(Number(value));
  if (!Number.isFinite(absolute)) return null;
  if (absolute >= 1e12) return { divisor: 1e12, suffix: 'T', digits: 2 };
  if (absolute >= 1e9) return { divisor: 1e9, suffix: 'B', digits: 2 };
  if (absolute >= 1e6) return { divisor: 1e6, suffix: 'M', digits: 1 };
  if (absolute >= 1e3) return { divisor: 1e3, suffix: 'K', digits: 1 };
  return null;
}

function formatUsdUnsigned(value, { compact = false } = {}) {
  const amount = Math.abs(Number(value));
  if (!Number.isFinite(amount)) return '—';

  if (!compact) {
    return WHOLE_USD_FORMATTER.format(Math.round(amount));
  }

  if (amount < 1e6) {
    return WHOLE_USD_FORMATTER.format(Math.round(amount));
  }

  const parts = toCompactParts(amount);
  if (!parts) {
    return WHOLE_USD_FORMATTER.format(Math.round(amount));
  }

  return `$${(amount / parts.divisor).toFixed(parts.digits)}${parts.suffix}`;
}

export function formatUsdWhole(value) {
  return formatUsdUnsigned(value, { compact: false });
}

export function formatUsdCompact(value) {
  return formatUsdUnsigned(value, { compact: true });
}

export function formatUsdSigned(value, { compact = false } = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}${formatUsdUnsigned(amount, { compact })}`;
}

export function formatNumber(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return COUNT_FORMATTER.format(Math.round(amount));
}

export function formatNumberCompact(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  const parts = toCompactParts(amount);
  if (!parts) return COUNT_FORMATTER.format(Math.round(amount));
  return `${(Math.abs(amount) / parts.divisor).toFixed(parts.digits)}${parts.suffix}`;
}

export function formatDateLabel(value) {
  const raw = String(value || '');
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00Z`)
    : new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return DATE_FORMATTER.format(date);
}

export function formatDateTimeLabel(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return DATE_TIME_FORMATTER.format(date);
}

export function splitCurrencyGroups(value) {
  return formatUsdWhole(value).split(',');
}

export function projectCurrencyValue(baseValue, ratePerSecond, baseAt, now = Date.now()) {
  const base = Number(baseValue);
  const rate = Number(ratePerSecond);
  const from = new Date(baseAt).getTime();
  if (!Number.isFinite(base)) return 0;
  if (!Number.isFinite(rate) || !Number.isFinite(from)) return base;
  const elapsedSeconds = Math.max(0, (now - from) / 1000);
  return base + (rate * elapsedSeconds);
}

export function projectSessionDelta(ratePerSecond, openedAt, now = Date.now()) {
  return projectCurrencyValue(0, ratePerSecond, openedAt, now);
}

export function getDebtPressureTone(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return 'neutral';
  return amount > 0 ? 'pressure' : 'relief';
}

export function buildUsDebtRateCards(model) {
  if (!model || typeof model !== 'object') return [];
  return [
    { label: 'PER SECOND', value: model.rate_per_second },
    { label: 'PER MINUTE', value: model.rate_per_minute },
    { label: 'PER HOUR', value: model.rate_per_hour },
    { label: 'PER DAY', value: model.rate_per_day },
    { label: 'PER WEEK', value: model.rate_per_week },
    { label: 'PER YEAR', value: model.rate_per_year },
  ];
}
