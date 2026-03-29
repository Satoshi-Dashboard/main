# Component Props & Interfaces - S04 Bitcoin Mempool Fees (Gauge)

## Main Component

### S04_MempoolGauge(props)

**Props:**
```typescript
interface S04Props {
  onOpenDonate?: () => void;
}
```

**Usage:**
```jsx
<S04_MempoolGauge onOpenDonate={() => setDonateOpen(true)} />
```

---

## Sub-Component Props

### GaugeArc({ usageBytes, maxBytes, loading, centerLabel })

```typescript
interface GaugeArcProps {
  usageBytes: number | null;   // current mempool bytes
  maxBytes: number | null;     // max mempool bytes
  loading: boolean;
  centerLabel?: string;        // default "USAGE"
}
```

**SVG Layout:**
- ViewBox: roughly 360×200
- Center: `cx=180, cy=160`
- Radius: `r=120`
- Arc path: `M (cx-r) cy A r r 0 0 1 (cx+r) cy` — semicircle
- Total arc length: `Math.PI * r`
- Fill length: `(pct / 100) * totalArcLength`

**Color Thresholds:**
- < 25%: green (#00D897 or similar)
- 25–75%: orange (`var(--accent-warning)`)
- > 75%: red (`var(--accent-red)`)

---

## Shared Services Used

### fetchMempoolNodeSnapshot()
```typescript
// From @/shared/services/mempoolApi.js
// Returns mempool node memory usage snapshot
```

### fetchMempoolOfficialUsageSnapshot()
```typescript
// From @/shared/services/mempoolApi.js
// Returns official mempool.space usage data
```

### fetchMempoolOverviewBundle()
```typescript
// From @/shared/services/mempoolApi.js
// Returns { overview, fees } bundle
```

---

## Shared Hooks

### useModuleData
```typescript
// Used multiple times — one per data source
// refreshMs: 10_000 (10 seconds)
```

### useModuleRuntimeContext
```typescript
// From @/features/module-player/ModuleRuntimeContext.js
// Provides runtime context (e.g., module size/visibility state)
```

---

## Shared Components Used

### AnimatedMetric
```typescript
// Used for fee rate displays, mempool size, etc.
// variant: "number" with appropriate decimals
```

### ModuleShell + ModuleTitle
```typescript
// From @/shared/components/module/index.js
// ModuleTitle: displays "BITCOIN MEMPOOL" header
```

---

## Color Constants

```typescript
const UI_COLORS = {
  ...SHARED_UI_COLORS,
  muted: 'rgba(255,255,255,0.38)',
};
```

| Usage          | Token                      |
|----------------|----------------------------|
| Muted values   | `rgba(255,255,255,0.38)`   |
| Positive       | `UI_COLORS.positive`       |
| Negative       | `UI_COLORS.negative`       |
| Brand          | `UI_COLORS.brand`          |
| Warning        | `UI_COLORS.warning`        |

---

## Treemap Canvas

```typescript
// Canvas element ref:
const canvasRef = useRef<HTMLCanvasElement>(null);

// Draws on mount and when data changes:
// drawTreemap(canvasRef.current, txs)
```

Canvas fills available space, redraws when fee histogram changes.

---

## Fee Display Format

| Fee Tier      | Label        | Source Field        |
|---------------|--------------|---------------------|
| Next block    | "FASTEST"    | `fees.fastestFee`   |
| ~30 min       | "30 MIN"     | `fees.halfHourFee`  |
| ~60 min       | "1 HOUR"     | `fees.hourFee`      |
| Average       | "NORMAL"     | `fees.normal`       |

All displayed in sat/vB with appropriate decimal places via `getMetricDecimals()`.
