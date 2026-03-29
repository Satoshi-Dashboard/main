# Data Schema - S05 Bitcoin Mempool Trend

## API Response

### fetchMempoolOverviewBundle() → { overview, fees }

Same shape as documented in S04 — see `s04-bitcoin-mempool-fees/references/DATA_SCHEMA.md`.

```typescript
interface MempoolResponse {
  overview: {
    block_height: number;
    mempool_size: number;     // pending TX count
    mempool_bytes: number;    // current mempool size in bytes
    vsize?: number;
  };
  fees: {
    fastestFee: number;       // sat/vB
    halfHourFee: number;      // sat/vB
    hourFee: number;          // sat/vB
    normal: number;           // sat/vB
    minimumFee?: number;      // sat/vB
  };
}
```

---

## Treemap Generation

The module uses `genTxs()` and `binaryTreemap()` to generate a visual block layout from fee histogram data:

### Transaction Generation: genTxs(feeRange, txCount, blockSize)

```typescript
interface TxEntry {
  size: number;   // estimated bytes per transaction (min 100)
  color: string;  // hex color based on fee tier
}
```

**Input parameters:**
- `feeRange`: number[] — sorted fee rates from mempool histogram
- `txCount`: number — total pending transaction count (caps at 160 for rendering)
- `blockSize`: number — reference block size (typically 1,000,000 bytes)

**Output:** Array of up to 160 TxEntry objects sorted by size descending.

### Fee Color Scale

```javascript
const FEE_SCALE = [
  { max: 2,        color: '#00FFCC', label: '<2'   },   // Cyan: very cheap
  { max: 10,       color: '#00FF88', label: '2-10'  },   // Green: cheap
  { max: 50,       color: '#FFD700', label: '10-50' },   // Gold: moderate
  { max: Infinity, color: '#FF8C00', label: '>50'   },   // Orange: expensive
];
```

### Binary Treemap Layout: binaryTreemap(items, x, y, w, h)

Recursive halving algorithm that splits the available area proportionally by `item.size`:

```typescript
interface TreemapBlock {
  size: number;   // from TxEntry
  color: string;  // from TxEntry
  x: number;      // SVG/canvas x position
  y: number;      // SVG/canvas y position
  w: number;      // block width
  h: number;      // block height
}
```

---

## Canvas Rendering

The visualization draws onto an HTML5 `<canvas>` element:

```javascript
function drawTreemap(canvas, txs) {
  // Clears canvas
  // Calls binaryTreemap to compute layout
  // Fills each block with ctx.fillRect(x, y, w, h)
  // Applies block color from tx.color
}
```

---

## Display Metrics Derived from API

| Metric           | Source                       | Format          |
|------------------|------------------------------|-----------------|
| TX Count         | `overview.mempool_size`      | Compact number  |
| Mempool Size     | `overview.mempool_bytes`     | MB / KB         |
| Fastest Fee      | `fees.fastestFee`            | sat/vB          |
| Normal Fee       | `fees.normal`                | sat/vB          |
| Block Height     | `overview.block_height`      | Integer         |

---

## Responsive Behavior

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const windowWidth = useWindowWidth();
```

Used to adjust canvas dimensions and label visibility.
