# Component Props & Interfaces - S32 BTC Queue

## Main Component

### BtcQueueModule (default export from S06_BtcQueue.jsx)

**Props:**
```typescript
interface S32Props {
  // No external props — self-contained with internal data fetching
}
```

**Usage:**
```jsx
<BtcQueueModule />
```

**Notes:**
- Source file is `S06_BtcQueue.jsx` (shared with the original S06 module concept, re-registered as S32)
- Wrapped in `<ModuleShell>` for full-height container
- Uses `lightweight-charts` library for the time-series chart (not Recharts)

---

## Internal State

```typescript
const chartContainerRef = useRef<HTMLDivElement>(null);
const chartRef = useRef<IChartApi | null>(null);
const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

const [selectedMetric, setSelectedMetric] = useState<'count' | 'fee' | 'weight'>('count');
const [hoverData, setHoverData] = useState<{ time: number; value: number } | null>(null);
```

---

## useModuleData Usage

```typescript
const { data: historyData, loading, error } = useModuleData(
  fetchJohoeHistory,
  {
    refreshMs: 15_000,
    initialData: null,
    keepPreviousOnError: true,
  }
);
```

Where `fetchJohoeHistory` is from `@/shared/services/btcQueueApi.js`.

---

## Metric Toggle Buttons

Rendered as a row of pill buttons per `METRIC_OPTIONS`:

```jsx
{METRIC_OPTIONS.map(({ key, label }) => (
  <button
    key={key}
    onClick={() => setSelectedMetric(key)}
    style={{
      color: selectedMetric === key ? METRIC_META[key].color : 'var(--text-secondary)',
      borderColor: selectedMetric === key ? METRIC_META[key].color : 'transparent',
    }}
  >
    {label}
  </button>
))}
```

---

## Chart Resize Handling

```typescript
// ResizeObserver watches the chart container
// On resize: chart.applyOptions({ width, height })
```

---

## Shared Services

### fetchJohoeHistory()
- **From:** `@/shared/services/btcQueueApi.js`
- **Returns:** Time-series history array with `time`, `count`, `fee`, `weight` per point

---

## Shared Components

### ModuleShell
```typescript
// From @/shared/components/module/index.js
interface ModuleShellProps {
  layout?: string;
  children: ReactNode;
}
```

### createDarkChart(container)
```typescript
// From @/shared/lib/lightweightChartConfig.js
// Returns: IChartApi (lightweight-charts instance with dark theme applied)
```

---

## Color Reference

| Metric  | Line Color                    |
|---------|-------------------------------|
| count   | `rgba(255,255,255,0.78)`      |
| fee     | `var(--accent-bitcoin)`       |
| weight  | `#7FC4FF`                     |

---

## Metric Range Options

```typescript
const RANGE_OPTIONS = [
  { key: '24h', label: '24h' },
  // Only 24h range currently supported
];
```

---

## CSS Variables Used

| Variable             | Purpose                          |
|----------------------|----------------------------------|
| `--accent-bitcoin`   | Fee metric line color, active toggle |
| `--text-secondary`   | Inactive metric toggle color     |
| `--bg-primary`       | ModuleShell background           |
