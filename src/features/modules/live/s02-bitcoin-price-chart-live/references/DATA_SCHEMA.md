# Data Schema - S02 Bitcoin Price Chart

## Input Data Structures

### Live Price Data

**From:** `/api/btc/spot` (Binance)

**Structure:**
```typescript
interface SpotPrice {
  usd: number;           // BTC/USD price with up to 2 decimals
  timestamp: number;     // Unix milliseconds
}
```

**Example:**
```json
{
  "usd": 45250.50,
  "timestamp": 1710000000000
}
```

**Validation:**
- `usd` must be a positive finite number (>0, not NaN, not Infinity)
- `timestamp` must be a positive integer
- If validation fails, previous price is retained

---

### Historical Price Data

**From:** `/api/btc/history` (Binance + formatting)

**Structure:**
```typescript
interface HistoryPoint {
  ts: number;              // Unix milliseconds
  price: number;           // Closing price from OHLC
  tooltipLabel: string;    // Formatted time (e.g., "3/10 2:30 PM")
}

type HistoryArray = HistoryPoint[];
```

**Example:**
```json
[
  {
    "ts": 1709913600000,
    "price": 44800.25,
    "tooltipLabel": "3/10 12:00 AM"
  },
  {
    "ts": 1709917200000,
    "price": 45120.50,
    "tooltipLabel": "3/10 1:00 AM"
  },
  {
    "ts": 1710003600000,
    "price": 45250.75,
    "tooltipLabel": "3/11 12:00 AM"
  }
]
```

**Validation:**
- Array length ≥ 2 (chart requires at least 2 points)
- All `price` values: positive finite numbers (>0)
- `ts` values in chronological order (monotonically increasing)
- If validation fails, previous chart data is retained, loading set to false

---

## Internal State (Component)

### Component State Variables

```typescript
// Price state
const [livePrice, setLivePrice] = useState<number | null>(null);

// Chart/range state
const [activeLabel, setActiveLabel] = useState<string>('LIVE');
const [chartData, setChartData] = useState<HistoryPoint[]>([]);
const [loading, setLoading] = useState<boolean>(true);

// Interaction state
const [hoverData, setHoverData] = useState<{
  price: number;
  label: string | null;
} | null>(null);

// UI state
const [showAvgLine, setShowAvgLine] = useState<boolean>(false);
```

---

## Derived Data

### Active Range

**Calculation:**
```javascript
const RANGES = [
  { label: 'LIVE', days: 1, interval: '15m', live: true },
  { label: '1D', days: 1, interval: '5m' },
  { label: '1W', days: 7, interval: '1h' },
  { label: '1M', days: 30, interval: '1h' },
  { label: '3M', days: 90, interval: '1d' },
  { label: '1Y', days: 365, interval: '1d' },
  { label: '5Y', days: 1825, interval: '1d' },
];

const activeRange = RANGES.find(range => range.label === activeLabel) ?? RANGES[0];
// Result: { label: 'LIVE', days: 1, interval: '15m', live: true }
```

**Usage:**
- `activeRange.days` - Used as query param for API
- `activeRange.interval` - Used as query param for API
- `activeRange.live` - Used to show live indicator dot on button

---

### Price Statistics

**High Price:**
```javascript
const prices = hasChart
  ? chartData
      .map(point => point.price)
      .filter(Number.isFinite)
  : [];

const high = hasChart ? Math.max(...prices) : null;
// Result: 45500.75 (highest price in current range)
```

**Low Price:**
```javascript
const low = hasChart ? Math.min(...prices) : null;
// Result: 44200.25 (lowest price in current range)
```

**Average Price:**
```javascript
const avgPrice = prices.length
  ? prices.reduce((sum, price) => sum + price, 0) / prices.length
  : null;
// Result: 45100.50 (average of all prices in range)

const hasAvg = Number.isFinite(avgPrice);
// Result: true (allows AVG button to be enabled)
```

---

### Price Change (Delta)

**Start Price (period open):**
```javascript
const startPrice = hasChart ? Number(chartData[0]?.price) : null;
// Result: 44800.25 (first candle in range)
```

**End Price (current/hovering):**
```javascript
const endPrice = Number.isFinite(livePrice) && livePrice > 0
  ? livePrice                          // Live price if available & positive
  : hasChart
    ? Number(chartData.at(-1)?.price)  // Last candle price
    : null;
// Result: 45250.75 (current/hovering price)
```

**Delta (absolute change):**
```javascript
const delta = Number.isFinite(startPrice) && Number.isFinite(endPrice) && startPrice > 0
  ? endPrice - startPrice
  : null;
// Result: 450.50 (absolute difference)
```

**Delta Percent (relative change):**
```javascript
const deltaPct = delta !== null && startPrice > 0
  ? (delta / startPrice) * 100
  : null;
// Result: 1.004 (percent change, e.g., 1% up)
```

**Has Valid Change:**
```javascript
const hasChange = Number.isFinite(delta) && Number.isFinite(deltaPct);
// Result: true (both values are valid)
```

**Direction:**
```javascript
const isUp = hasChange ? delta >= 0 : true;
// Result: true (positive delta = up)
```

---

### Line Color

**Color Selection:**
```javascript
const ACCENT_GREEN = '#00D897';
const ACCENT_RED = '#FF4757';

const lineColor = isUp ? ACCENT_GREEN : ACCENT_RED;
// Result: '#00D897' if price up, '#FF4757' if price down
```

**Used By:**
- Area series line stroke
- Area series fill top color (with opacity)
- Crosshair marker background
- Stat cards (HIGH uses green, LOW uses red)

---

### Display Price (Hover)

**Selection Logic:**
```javascript
const displayPrice = hoverData ? hoverData.price : livePrice;
// Shows hovered price if user is touching/hovering chart, else live price
```

**Used By:**
- Main price display (large text)
- Delta/% change calculations (recalculated when hovering)

---

### Hover Map

**Optimization for Performance:**
```javascript
const hoverLabelMap = useMemo(() => {
  const map = new Map();
  chartData.forEach((point) => {
    const time = Math.floor(point.ts / 1000);  // Convert to Unix seconds
    map.set(time, point.tooltipLabel);         // Map time → label
  });
  return map;
}, [chartData]);
// Result: Map<number, string> e.g., Map(7) { 1709913600 => "3/10 12:00 AM", ... }
```

**Purpose:**
- Avoids searching chartData array on every crosshair move
- O(1) lookup time instead of O(n)
- Memoized so only recomputes when chartData changes

---

### Chart Display Data

**Format for lightweight-charts:**
```javascript
const areaData = chartData.map((point) => ({
  time: Math.floor(point.ts / 1000),  // Convert ms to Unix seconds
  value: point.price,                  // Price value
}));
// Result: [{ time: 1709913600, value: 44800.25 }, ...]
```

**lightweight-charts expects:**
- `time` as Unix seconds (not milliseconds)
- `value` as number
- Array in chronological order

---

### Average Line Data

**When Shown:**
```javascript
if (showAvgLine && hasAvg && Number.isFinite(avgPrice)) {
  avgSeries.setData(areaData.map((point) => ({
    time: point.time,
    value: avgPrice  // Horizontal line at avg price
  })));
}
```

**Result:**
```javascript
[
  { time: 1709913600, value: 45100.50 },
  { time: 1709917200, value: 45100.50 },
  // ... all points have same avgPrice value = horizontal line
]
```

---

## Data Cache

**In-Memory Cache:**
```typescript
const dataCache: Record<string, HistoryPoint[]> = {};

// Key structure
const key = `${activeLabel}_${interval}`;
// Example keys: "LIVE_15m", "1W_1h", "1Y_1d"

// Cache check
if (dataCache[key]) {
  setChartData(dataCache[key]);
  return;
}

// Cache store
dataCache[key] = history;
```

**Cache Lifespan:**
- Per session (cleared on page reload)
- No expiration (historical data assumed unchanging)
- Max size: ~7 entries (one per RANGE)

---

## Loading States

### Chart Loading

```javascript
const [loading, setLoading] = useState<boolean>(true);

// Set to loading when:
// 1. activeLabel changes (useEffect)
setLoading(true);

// Set to false when:
// 1. Cache hit
// 2. Fetch completes successfully
// 3. Fetch fails (error handling)
```

**UI Behavior:**
- `loading === true` → Show skeleton loader (48 wave bars)
- `loading === false && hasChart` → Show actual chart
- `loading === false && !hasChart` → Empty chart area (rare, only if API returns empty)

### Price Loading

```javascript
const [livePrice, setLivePrice] = useState<number | null>(null);

// Update when:
// useModuleData(fetchBtcSpot, { ... }) fetches new spot price
const applyPrice = useCallback((newPrice) => {
  if (!Number.isFinite(newPrice) || newPrice <= 0) return;
  setLivePrice(newPrice);
}, []);
```

**UI Behavior:**
- `livePrice === null` → Show skeleton loader in price area
- `livePrice !== null` → Show price with AnimatedMetric

---

## Error Handling Strategy

### Fetch Failures

**Live Price Error:**
```javascript
// In useModuleData error handler
keepPreviousOnError: true  // Don't clear livePrice on error
// Result: Stale price shown if API fails
```

**Historical Data Error:**
```javascript
try {
  const history = await fetchBtcHistory(activeRange.days, activeRange.interval);
  if (history?.length) {
    dataCache[key] = history;
    setChartData(history);
  }
} catch {
  // Keep previous chart view on fetch failure
  // Don't update chartData — old data stays visible
}
```

**Result:**
- Chart shows previous range data if API fails
- No sudden blank chart on network error
- User can try again by switching ranges

---

## Type Definitions for AI Agents

```typescript
// Input from API
interface ApiSpotPrice {
  usd: number;
  timestamp: number;
}

interface ApiHistoryPoint {
  ts: number;
  price: number;
  tooltipLabel: string;
}

type ApiHistoryResponse = ApiHistoryPoint[];

// Internal component state
interface PriceChartState {
  livePrice: number | null;
  activeLabel: string;
  chartData: ApiHistoryPoint[];
  loading: boolean;
  hoverData: {
    price: number;
    label: string | null;
  } | null;
  showAvgLine: boolean;
}

// Derived stats
interface PriceStats {
  high: number | null;
  low: number | null;
  avgPrice: number | null;
  startPrice: number | null;
  endPrice: number | null;
  delta: number | null;
  deltaPct: number | null;
  isUp: boolean;
  lineColor: string;
}
```
