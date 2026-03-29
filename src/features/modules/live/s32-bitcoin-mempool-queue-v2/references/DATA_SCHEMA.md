# Data Schema - S32 BTC Queue

## API Response: /api/public/mempool/live

### Raw History Entry

```typescript
interface HistoryEntry {
  time: number;    // Unix timestamp (seconds or milliseconds)
  count: number;   // Pending TX count
  fee: number;     // Total fees in satoshis
  weight: number;  // Mempool weight in vbytes
}
```

### fetchJohoeHistory() Return

```javascript
// Returns the raw API payload
// Component destructures into chart-ready points per metric
```

---

## Chart Data Transformation

The component maps raw history to `lightweight-charts` format per selected metric:

```javascript
// For metric key = 'count'
points = history.map(d => ({
  time: toTimestampSeconds(d.time),
  value: d.count
}));

// For metric key = 'fee'
points = history.map(d => ({
  time: toTimestampSeconds(d.time),
  value: d.fee     // in satoshis; formatValue converts to BTC via / 1e8
}));

// For metric key = 'weight'
points = history.map(d => ({
  time: toTimestampSeconds(d.time),
  value: d.weight  // in vbytes; formatValue converts to vMB via / 1e6
}));
```

**lightweight-charts requires:**
- `time`: number (Unix seconds, must be sorted ascending, no duplicates)
- `value`: number

---

## Metric Options and Configuration

```typescript
const METRIC_OPTIONS = [
  { key: 'count',  label: 'COUNT'  },
  { key: 'fee',    label: 'FEE'    },
  { key: 'weight', label: 'WEIGHT' },
];

interface MetricMeta {
  label: string;
  color: string;
  heroLabel: string;
  bandLabel: string;
  formatValue: (v: number) => string;
  formatFull: (v: number) => string;
}

const METRIC_META: Record<string, MetricMeta> = {
  count: {
    label: 'TX COUNT',
    color: 'rgba(255,255,255,0.78)',
    heroLabel: 'Pending Transaction Count in BTC',
    bandLabel: 'Transactions',
    formatValue: (v) => compact(v),         // e.g., "185.4K"
    formatFull:  (v) => intl.format(v),     // e.g., "185,432"
  },
  fee: {
    label: 'TOTAL FEES',
    color: 'var(--accent-bitcoin)',
    heroLabel: 'Pending Transaction Fee in BTC',
    bandLabel: 'BTC',
    formatValue: (v) => `${satsToBtc(v).toFixed(4)} BTC`,   // e.g., "0.4500 BTC"
    formatFull:  (v) => satsToBtc(v).toFixed(6),
  },
  weight: {
    label: 'QUEUE WEIGHT',
    color: '#7FC4FF',
    heroLabel: 'Mempool Weight (vMB)',
    bandLabel: 'vMB',
    formatValue: (v) => `${(v / 1e6).toFixed(2)} vMB`,     // e.g., "8.20 vMB"
    formatFull:  (v) => `${(v / 1e6).toFixed(4)} vMB`,
  },
};
```

---

## Unit Conversion Helpers

```javascript
function satsToBtc(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric / 1e8 : 0;
}
// satoshis → BTC: 45_000_000_000 / 1e8 = 450 BTC

// vbytes → vMB:
const vMB = weight / 1_000_000;
// e.g., 8_200_000 / 1e6 = 8.2 vMB
```

---

## Component State

```typescript
const [selectedMetric, setSelectedMetric] = useState<'count' | 'fee' | 'weight'>('count');
// Controls which metric column is used for chart values and hero display
```

---

## lightweight-charts Integration

```javascript
// Chart created via shared config
const chart = createDarkChart(containerRef.current);
const series = chart.addSeries(LineSeries, {
  color: METRIC_META[metric].color,
  lineWidth: 2,
  // area fill settings
});

// Data set:
series.setData(points);  // points: Array<{ time: number, value: number }>

// Chart cleanup on unmount:
chart.remove();
```

**Chart theme:** `createDarkChart()` from `@/shared/lib/lightweightChartConfig.js`
**Font:** `CHART_FONT` constant from same module

---

## Color Utilities

```javascript
function hexToRgb(hex): { r, g, b } | null
function rgba(color, alpha): string
function softenLineColor(color, index, total): string
// softenLineColor reduces opacity for multi-series gradient rendering
```
