# Data Schema - S28 BTC Dominance

## Static Data (Current Implementation)

The module currently uses hardcoded static arrays defined at the top of the component file.

### ANNUAL_RETURNS Array

```javascript
const ANNUAL_RETURNS = [
  { year: number, pct: number, live?: boolean }
]
```

**Example:**
```json
[
  { "year": 2011, "pct": 1467 },
  { "year": 2013, "pct": 5870 },
  { "year": 2014, "pct": -61 },
  { "year": 2025, "pct": 25.85, "live": true }
]
```

- `year`: Calendar year integer
- `pct`: Annual return as a percentage (can be negative for bear years)
- `live`: Optional boolean — marks the current in-progress year

### Summary Statistics

```javascript
const CAGR    = 136.03;   // Compound Annual Growth Rate (%)
const STD_DEV = 85.85;    // Standard deviation / annual volatility (%)
const SHARPE  = 0.66;     // Sharpe ratio
```

### BEST_MONTHS / WORST_MONTHS

```javascript
const BEST_MONTHS = [
  { label: string, pct: number }   // pct is positive
]
const WORST_MONTHS = [
  { label: string, pct: number }   // pct is negative
]
```

### KEY_STATS

```javascript
const KEY_STATS = [
  { label: string, value: string, color: string }
]
```

Example:
```json
[
  { "label": "Max Drawdown",   "value": "-84.2%", "color": "#FF4757" },
  { "label": "Positive Years", "value": "12/15",  "color": "#00D897" },
  { "label": "Best Year",      "value": "2013",   "color": "#F7931A" }
]
```

---

## Computed Chart Layout Values

These are derived from `ANNUAL_RETURNS` at module initialization:

```javascript
MAX_POS_RAW = Math.max(...ANNUAL_RETURNS.map(d => d.pct))    // e.g., 5870
MAX_NEG_RAW = Math.abs(Math.min(...ANNUAL_RETURNS.map(d => d.pct))) // e.g., 73

Y_POS_MAX = Math.ceil(MAX_POS_RAW / 1000) * 1000  // rounds up to nearest 1000 = 6000
TICK_STEP = Y_POS_MAX <= 2000 ? 500 : 1000         // e.g., 1000

CH_NEG = 100       // fixed pixel height for negative bars zone
CH_POS = CH - CH_NEG
ZERO_Y = MT + CH_POS    // y-coordinate of zero line in SVG space
```

---

## SVG Coordinate System

```
VW = 900, VH = 500 (viewBox)
ML = 62   (left margin, for Y-axis labels)
MR = 16   (right margin)
MT = 38   (top margin)
MB = 38   (bottom margin)
CW = VW - ML - MR  = 822 (chart width)
CH = VH - MT - MB  = 424 (chart height total)
```

### Y Scale Function

```javascript
function yScale(v) {
  if (v >= 0) {
    // Positive: map [0, Y_POS_MAX] → [ZERO_Y, MT]
    return ZERO_Y - (v / Y_POS_MAX) * CH_POS;
  }
  // Negative: map [0, -MAX_NEG_RAW] → [ZERO_Y, ZERO_Y + CH_NEG]
  return ZERO_Y + (Math.abs(v) / MAX_NEG_RAW) * CH_NEG;
}
```

---

## Hover State

```javascript
// hover state: null or one ANNUAL_RETURNS entry
const [hover, setHover] = useState(null);
// hover shape: { year: number, pct: number, live?: boolean }
```

Tooltip renders:
- Year (+ live dot if `d.live`)
- Annual return formatted via `formatPct(pct)`
- "Bull Year" (green) or "Bear Year" (red)

---

## Format Helper

```javascript
function formatPct(pct) {
  // Examples:
  // 5870  → "+5,870%"
  // -73   → "-73%"
  // 25.85 → "+25.85%"
}
```
