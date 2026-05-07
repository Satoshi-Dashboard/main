---
code: S32
title: BTC Queue
description: Live Bitcoin mempool queue visualization using lightweight-charts with TX count, total fees, and queue weight metrics over 24h history
category: live
status: published
providers:
  - mempool.space
refreshSeconds: 15
---

# BTC Queue (S32)

## Description

The BTC Queue module renders a live mempool queue chart using `lightweight-charts`. It shows:

- **TX Count:** Pending transaction count over 24 hours
- **Total Fees:** Pending transaction fees in BTC over 24 hours
- **Queue Weight:** Mempool weight in virtual megabytes (vMB) over 24 hours
- **Hero Metric:** Current value for selected metric displayed prominently
- **Line Chart:** `lightweight-charts` line series with area fill, dark theme
- **Metric Toggle:** Switch between COUNT, FEE, WEIGHT views

## Data Sources

### Mempool Live History
- **Source:** mempool.space via internal API
- **Endpoint:** `/api/public/mempool/live`
- **Purpose:** Provides 24h historical queue data points for charting
- **Refresh Rate:** 15 seconds

### Mempool Overview Bundle
- **Source:** mempool.space via internal API
- **Endpoint:** `/api/public/mempool/overview`
- **Purpose:** Current mempool snapshot for hero metric display
- **Refresh Rate:** 15 seconds

### Data Fetch Function
- `fetchJohoeHistory()` from `@/shared/services/btcQueueApi.js`
- Returns time-series array with `time`, `count`, `fee` (sats), `weight` (vbytes) per entry

## Component Structure

### Main Component (default export from S06_BtcQueue.jsx)

Wrapped in `<ModuleShell>`, uses `lightweight-charts` API directly via `useRef` and `useEffect`.

### Metric Options
```javascript
const METRIC_OPTIONS = [
  { key: 'count',  label: 'COUNT'  },
  { key: 'fee',    label: 'FEE'    },
  { key: 'weight', label: 'WEIGHT' },
];
```

### METRIC_META Configuration
Each metric has: `label`, `color`, `heroLabel`, `bandLabel`, `formatValue`, `formatFull`

- **count:** White line — formats as compact number
- **fee:** Bitcoin orange (`var(--accent-bitcoin)`) — formats as BTC (divides sats by 1e8)
- **weight:** Light blue (`#7FC4FF`) — formats as vMB (divides by 1e6)

### Chart Config
- Library: `lightweight-charts` (`LineSeries`)
- Theme: `createDarkChart()` from `@/shared/lib/lightweightChartConfig.js`
- Font: `CHART_FONT` constant
- Area fill below line with gradient

### Data Flow
```
useModuleData(fetchJohoeHistory, { refreshMs: 15_000 })
  → raw time-series data
  → transformed to { time: seconds, value: metric[key] }
  → set on LineSeries via series.setData(points)
```

### Helper Functions
- `satsToBtc(value)`: Divides by 1e8
- `toTimestampSeconds(value)`: Normalizes ms or s timestamp to seconds
- `toTimestampMs(value)`: Normalizes to milliseconds
- `clamp(value, min, max)`: Numeric clamp utility
- `hexToRgb(hex)`, `rgba(color, alpha)`: Color manipulation utilities
- `softenLineColor(color, index, total)`: Gradient softening for multi-series

## Props

```typescript
interface S32Props {
  // No required external props — self-contained with internal data fetching
}
```

## Styling

- Container: `ModuleShell`, dark background `#111111`
- Chart area: fills available space via flex-1
- Metric toggle: pill-style buttons, active state uses metric color
- Font: monospace for all labels and values
