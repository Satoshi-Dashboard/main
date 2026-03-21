/**
 * Shared color/scale utilities for choropleth map modules (S06, S07, S08).
 *
 * These functions are identical across map modules — extracted here
 * to eliminate duplication. Each module provides its own color arrays
 * and density scales; these functions operate on them generically.
 */

/**
 * Compute a dynamic per-capita scale based on the maximum observed value.
 * Generates 5 tiers at 50%, 25%, 10%, 5% of a "nice" rounded max.
 *
 * @param {number}   maxVal        Maximum per-capita value in the dataset.
 * @param {object[]} fallbackScale Fallback scale if maxVal is invalid.
 * @param {string[]} colors        Array of 5 colors [veryHigh, high, mid, low, trace].
 * @returns {object[]} Scale array with { key, label, color, minVal, legend }.
 */
export function computePerCapitaScale(maxVal, fallbackScale, colors = ['#FF6A00', '#FF8C1A', '#FFAA33', '#FFC266', '#FFD9A0']) {
  if (!maxVal || maxVal <= 0) return fallbackScale;

  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude;
  const t4 = Math.max(1, Math.round(niceMax * 0.50));
  const t3 = Math.max(1, Math.round(niceMax * 0.25));
  const t2 = Math.max(1, Math.round(niceMax * 0.10));
  const t1 = Math.max(1, Math.round(niceMax * 0.05));

  return [
    { key: 'very-high', label: 'Very high', color: colors[0], minVal: t4,    legend: `> ${t4} /M` },
    { key: 'high',      label: 'High',      color: colors[1], minVal: t3,    legend: `> ${t3} /M` },
    { key: 'mid',       label: 'Mid',       color: colors[2], minVal: t2,    legend: `> ${t2} /M` },
    { key: 'low',       label: 'Low',       color: colors[3], minVal: t1,    legend: `> ${t1} /M` },
    { key: 'trace',     label: 'Trace',     color: colors[4], minVal: 0.001, legend: '> 0 /M'    },
  ];
}

/**
 * Get fill color for a country by its absolute count using a density scale.
 *
 * @param {number}   count        Absolute count value.
 * @param {object[]} densityScale Array with { minNodes|minBusinesses|min, color }.
 * @param {string}   [emptyColor='#141414'] Color when count is 0 or invalid.
 * @returns {string} Hex color string.
 */
export function getFillColor(count, densityScale, emptyColor = '#141414') {
  const value = Number(count) || 0;
  if (value <= 0) return emptyColor;

  // Support both minNodes, minBusinesses, and generic min field names
  for (const step of densityScale) {
    const threshold = step.minNodes ?? step.minBusinesses ?? step.min ?? 0;
    if (value >= threshold) return step.color;
  }
  return emptyColor;
}

/**
 * Get fill color for a country by its per-capita value.
 *
 * @param {number}   perCapita Per-capita value (e.g., nodes per million).
 * @param {object[]} scale     Per-capita scale with { minVal, color }.
 * @param {string}   [emptyColor='#141414'] Color for zero/invalid values.
 * @returns {string} Hex color string.
 */
export function getFillColorByPerCapita(perCapita, scale, emptyColor = '#141414') {
  const v = Number(perCapita) || 0;
  if (v <= 0) return emptyColor;
  const match = scale.find((s) => v >= s.minVal);
  return match?.color || scale[scale.length - 1]?.color || emptyColor;
}

/**
 * Get the density step object for a given absolute count.
 *
 * @param {number}   count        Absolute count.
 * @param {object[]} densityScale Density scale array.
 * @returns {object|null} Matching scale step or null.
 */
export function getDensityStepByCount(count, densityScale) {
  const value = Number(count) || 0;
  for (const step of densityScale) {
    const threshold = step.minNodes ?? step.minBusinesses ?? step.min ?? 0;
    if (value >= threshold) return step;
  }
  return null;
}

/**
 * Format a per-capita value for display (e.g., "12.5 /M" or "0.83 /M").
 *
 * @param {number} value Per-capita value.
 * @returns {string} Formatted string.
 */
export function formatPerCapitaValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return '0.0 /M';
  return numericValue >= 10 ? `${numericValue.toFixed(1)} /M` : `${numericValue.toFixed(2)} /M`;
}

/**
 * Format a next-update ISO timestamp into a human-friendly delay string.
 *
 * @param {string} nextUpdateIso ISO timestamp of the next scheduled update.
 * @returns {string} e.g., "~5m", "~2h", "soon", or a fallback.
 */
export function formatNextUpdateDelay(nextUpdateIso) {
  if (!nextUpdateIso) return '';
  const diff = new Date(nextUpdateIso).getTime() - Date.now();
  if (diff <= 0) return 'soon';
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'soon';
  if (mins < 60) return `~${mins}m`;
  const hours = Math.round(mins / 60);
  return `~${hours}h`;
}
