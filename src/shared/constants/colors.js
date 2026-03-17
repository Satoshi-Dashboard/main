/**
 * Centralized color system for Satoshi Dashboard
 * Derived from CSS variables in src/index.css
 * Maps semantic colors to hex values for JS/canvas usage
 */

// Primary theme colors (from CSS variables)
export const COLORS = {
  // Backgrounds
  bg: {
    primary: '#0A0A0F',
    card: '#12121A',
  },

  // Semantic accents
  accent: {
    bitcoin: '#F7931A',
    green: '#00D897',
    red: '#FF4757',
  },

  // Text
  text: {
    primary: '#E8E6E3',
  },

  // Canvas/chart utility colors (dark theme variants)
  canvas: {
    dark1: '#111111',
    dark2: '#141414',
    dark3: '#141418',
    border: '#252530',
    scrollbar: '#2a2a2a',
  },
};

// Chart/visualization specific palettes
export const CHART_COLORS = {
  // Fee tier colors (S05 Long-Term Trend FEE_SCALE)
  feeTiers: {
    veryHigh: '#c25200',
    high: '#cd6618',
    medium: '#e0861a',
    low: '#f0a91c',
  },

  // Mempool gauge colors
  mempool: {
    orange: COLORS.accent.bitcoin,
    green: COLORS.accent.green,
    red: COLORS.accent.red,
  },
};

// Density/heatmap colors (S07, S06)
export const DENSITY_COLORS = {
  // Lightning density gradient (S07)
  lightning: [
    '#1a1a2e',
    '#16213e',
    '#0f3460',
    '#533483',
    '#a23b72',
    '#f18f01',
    '#ff6b35',
  ],

  // Node density gradient (S06)
  nodes: [
    '#1a1a2e',
    '#16213e',
    '#0f3460',
    '#533483',
    '#a23b72',
    '#f18f01',
    '#ff6b35',
  ],
};

// Wealth/address distribution tier colors (S13)
export const WEALTH_TIERS = [
  { threshold: '> $10M', key: 10000000, color: '#c25200' },
  { threshold: '> $1M', key: 1000000, color: '#cd6618' },
  { threshold: '> $100K', key: 100000, color: '#d6751e' },
  { threshold: '> $10K', key: 10000, color: '#df8824' },
  { threshold: '> $1K', key: 1000, color: '#e89a2a' },
  { threshold: '> $100', key: 100, color: '#f0a91c' },
  { threshold: '> $1', key: 1, color: '#f8bb31' },
];

/**
 * Shared semantic UI color tokens for module components.
 * Maps semantic names to CSS variable references (token-first policy).
 * Modules with extra colors spread locally: { ...UI_COLORS, lightning: '#3BA3FF' }
 */
export const UI_COLORS = {
  brand:         'var(--accent-bitcoin)',
  positive:      'var(--accent-green)',
  negative:      'var(--accent-red)',
  warning:       'var(--accent-warning)',
  textPrimary:   'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary:  'var(--text-tertiary)',
  bgMain:        '#111111',
  bgElevated:    'var(--bg-elevated)',
  border:        'rgba(255,255,255,0.08)',
};

export default COLORS;
