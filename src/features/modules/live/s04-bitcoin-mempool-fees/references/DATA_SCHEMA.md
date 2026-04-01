# Data Schema - S04 Bitcoin Mempool Fees (Gauge)

## API Response Shapes

### fetchMempoolOverviewBundle() → { overview, fees }

```typescript
interface MempoolOverview {
  block_height: number;
  mempool_size: number;      // pending TX count
  mempool_bytes: number;     // mempool size in bytes
  vsize?: number;            // virtual size in bytes
}

interface MempoolFees {
  fastestFee: number;        // sat/vB — next block
  halfHourFee: number;       // sat/vB — ~30 min
  hourFee: number;           // sat/vB — ~60 min
  normal: number;            // sat/vB — average
  minimumFee?: number;       // sat/vB — minimum relay fee
}
```

### fetchMempoolNodeSnapshot() → node data (for usage gauge)

Used to populate the `GaugeArc` component with `usageBytes` vs `maxBytes`.

```typescript
interface NodeSnapshot {
  mempool_bytes: number;     // current usage
  max_mempool_bytes: number; // configured max
}
```

---

## Computed Display Values

### Fee Rate Conversion

```javascript
function btcKbToSatVb(value) {
  // Converts BTC/KB (some API formats) to sat/vB
  return value * 100_000;
}
```

### Memory Formatting

```javascript
function formatMemory(bytes) {
  if (bytes < 1_000_000) return { value: bytes / 1e3, unit: 'KB', decimals: 1 };
  return { value: bytes / 1e6, unit: 'MB', decimals: 1 };
}
```

### Virtual MB

```javascript
function toVmb(bytes) {
  return parseFloat((bytes / 1e6).toFixed(1));  // e.g., 124.5 vMB
}
```

---

## Treemap Visualization Data

### genTxs(feeRange, txCount, blockSize)

Generates synthetic transaction representations from the fee histogram:

```typescript
interface TxEntry {
  size: number;    // estimated tx size in bytes (min 100)
  color: string;  // hex color based on fee rate
}
```

**Max 160 transactions rendered for performance.**

### Fee Color Scale

```javascript
const FEE_SCALE = [
  { max: 2,        color: '#00FFCC' },  // Very low: cyan
  { max: 10,       color: '#00FF88' },  // Low: green
  { max: 50,       color: '#FFD700' },  // Medium: gold
  { max: Infinity, color: '#FF8C00' },  // High: orange
];
```

### Treemap Canvas Rendering

- **Function:** `drawTreemap(canvas, txs)` — renders binary treemap on `<canvas>`
- **Algorithm:** `binaryTreemap(items, x, y, w, h)` — recursive halving layout
- **Each block:** One synthetic transaction colored by fee rate

---

## Gauge Arc Computation

```typescript
interface GaugeArcProps {
  usageBytes: number | null;   // current mempool size in bytes
  maxBytes: number | null;     // max configured mempool size in bytes
  loading: boolean;
  centerLabel?: string;        // e.g., "USAGE"
}
```

```javascript
const pct = hasData ? Math.min((usageMB / maxMB) * 100, 100) : 0;
```

SVG semicircle arc at center (180, 160), radius 120:
- Background arc: gray
- Progress arc: colored by percentage fill

---

## Metric Decimals Helper

```javascript
function getMetricDecimals(value) {
  if (Number.isInteger(value)) return 0;
  if (Math.abs(value) >= 10) return 1;
  return 2;
}
```

Used to determine decimal places for AnimatedMetric displays.
