# Component Props & Interfaces - S02 Bitcoin Price Chart

## Main Component

### S02_PriceChart()

**Props:** None (component is self-contained)

**Usage:**
```jsx
<S02_PriceChart />
// Rendered within ModuleShell by ModulePage
```

**Internal Hooks:**
- `useModuleData(fetchBtcSpot, { refreshMs: 10_000, ... })` - Polls live price
- `useEffect` - Handles historical data fetching and range switching
- `useState` - Manages chart data, active range, hover state, etc.

**Notes:**
- Component receives no props from parent
- All state is internal
- Data fetching is automatic (10s polling for live price, on-demand for history)
- Renders within ModuleShell which provides background color and layout

---

## Sub-Component Props

### ChartSection

**Props:**
```typescript
interface ChartSectionProps {
  chartData: Array<{
    ts: number;
    price: number;
    tooltipLabel: string;
  }>;
  showAvgLine: boolean;
  hasAvg: boolean;
  avgPrice: number | null;
  lineColor: string;  // Hex color: "#00D897" or "#FF4757"
  onHoverChange: (hoverData: {
    price: number;
    label: string | null;
  } | null) => void;
}
```

**Usage:**
```jsx
<ChartSection
  chartData={chartData}
  showAvgLine={showAvgLine}
  hasAvg={hasAvg}
  avgPrice={avgPrice}
  lineColor={lineColor}
  onHoverChange={setHoverData}
/>
```

**Behavior:**
- Renders lightweight-charts instance
- Subscribes to crosshair movement (desktop)
- Handles touch scrubbing (mobile)
- Calls `onHoverChange` with price and label on interaction
- Calls `onHoverChange(null)` when leaving chart

**Memoization:**
- Wrapped with `memo()` to prevent recreating chart on parent re-renders
- Only re-initializes chart when dependencies change

**Dependencies for chart recreation:**
- `hoverLabelMap` - remapped when chartData changes
- `lineColor` - changes when delta direction changes
- `onHoverChange` - callback function (from parent state setter)

---

### Time Range Buttons

**Not a separate component, but within S02_PriceChart:**

```typescript
interface RangeDefinition {
  label: string;      // "LIVE", "1D", "1W", "1M", "3M", "1Y", "5Y"
  days: number;       // API param
  interval: string;   // API param: "15m", "5m", "1h", "1d"
  live?: boolean;     // true only for LIVE range
}

const RANGES: RangeDefinition[] = [
  { label: 'LIVE', days: 1, interval: '15m', live: true },
  { label: '1D', days: 1, interval: '5m' },
  // ... etc
];
```

**Button Behavior:**
```jsx
<button
  onClick={() => setActiveLabel(label)}
  aria-pressed={isActive}
  // ... styling based on isActive state
>
  {live && <span className="live-indicator" />}
  {label}
</button>
```

---

### Stats Cards

**Not separate components, but rendered in grid:**

```typescript
interface StatCard {
  label: string;    // "HIGH", "AVG", "LOW"
  value: number | null;
  color: string;    // CSS color variable or hex
}

const statsToDisplay = [
  { label: 'HIGH', value: high, color: 'var(--accent-green)' },
  { label: 'AVG', value: hasAvg ? avgPrice : null, color: 'var(--accent-bitcoin)' },
  { label: 'LOW', value: low, color: 'var(--accent-red)' },
];
```

**Rendering:**
```jsx
{statsToDisplay.map(({ label, value, color }) => (
  <div key={label} className="stat-card">
    <div style={{ color }}>{label}</div>
    <AnimatedMetric value={value} variant="usd" decimals={0} />
  </div>
))}
```

---

## Shared Components/Hooks Used

### AnimatedMetric

**From:** `src/shared/components/common/AnimatedMetric.jsx`

**Props:**
```typescript
interface AnimatedMetricProps {
  value: number;
  variant?: "number" | "usd" | "hashrate" | "percent";
  decimals?: number;
  suffix?: string;
  signed?: boolean;
  inline?: boolean;
  className?: string;
  style?: CSSProperties;
  color?: string;  // CSS color for the text
}
```

**Usage in S02:**
```jsx
{/* Live price */}
<AnimatedMetric value={displayPrice} variant="usd" decimals={2} inline />

{/* Delta */}
<AnimatedMetric
  value={delta}
  variant="usd"
  decimals={2}
  signed
  inline
  color={isUp ? 'var(--accent-green)' : 'var(--accent-red)'}
/>

{/* Percentage change */}
<AnimatedMetric
  value={deltaPct}
  variant="percent"
  decimals={2}
  signed
  inline
  color={isUp ? 'var(--accent-green)' : 'var(--accent-red)'}
/>

{/* Stat cards (HIGH/AVG/LOW) */}
<AnimatedMetric value={value} variant="usd" decimals={0} inline />
```

**Behavior:**
- Smoothly animates from previous value to new value
- Formats number based on variant
- Applies locale formatting (thousand separators, etc.)

---

### useModuleData

**From:** `src/shared/hooks/useModuleData.js`

**Props:**
```typescript
interface UseModuleDataOptions {
  refreshMs?: number;           // 10_000 = 10 seconds
  initialData?: any;            // null (not used)
  keepPreviousOnError?: boolean; // true = retain stale data on error
  transform?: (raw: any) => any; // Optional transformation function
}

function useModuleData(
  fetcher: () => Promise<T>,
  options?: UseModuleDataOptions
): void
```

**Usage in S02:**
```javascript
useModuleData(fetchBtcSpot, {
  refreshMs: 10_000,
  transform: (spot) => {
    if (spot) applyPrice(spot.usd);
    return spot;
  },
});
```

**Behavior:**
- Calls `fetchBtcSpot()` immediately on mount
- Polls every `refreshMs` milliseconds
- On success: Calls `transform` function with result
- On error: Logs error, keeps previous data (due to `keepPreviousOnError: true`)
- No return value — updates component state via callback

**Function Signature:**
```typescript
function fetchBtcSpot(): Promise<{
  usd: number;
  timestamp: number;
}>

function applyPrice(newPrice: number): void {
  if (!Number.isFinite(newPrice) || newPrice <= 0) return;
  setLivePrice(newPrice);
}
```

---

### ModuleShell

**From:** `src/shared/components/module/ModuleShell.jsx`

**Props:**
```typescript
interface ModuleShellProps {
  layout?: "flex-col" | "flex-row" | "none";
  bg?: string;                  // Background color hex
  overflow?: "visible" | "hidden" | "auto";
  className?: string;           // Additional Tailwind classes
  children?: ReactNode;
}
```

**Usage in S02:**
```jsx
<ModuleShell className="px-3.5 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4 lg:px-[22px] lg:pb-4 lg:pt-5">
  {/* Content */}
</ModuleShell>
```

**Behavior:**
- Provides consistent background color (#111111)
- Applies layout flexbox (flex-col by default)
- Handles overflow behavior
- S02 customizes with responsive padding

---

## Constants & Colors

### Colors

**Used in S02:**
```javascript
const BITCOIN_ORANGE = '#F7931A';  // Bitcoin's official color (not used currently)
const ACCENT_GREEN = '#00D897';    // Up/positive indicator
const ACCENT_RED = '#FF4757';      // Down/negative indicator
```

**Chart Colors:**
```javascript
// Area series
lineColor: ACCENT_GREEN or ACCENT_RED
topColor: `${lineColor}33`      // 33% opacity (light fill)
bottomColor: `${lineColor}00`   // 0% opacity (transparent)

// Average line
color: 'rgba(255,255,255,0.58)' // White at 58% opacity

// Crosshair
vertLine: 'rgba(255,255,255,0.24)'  // 24% opacity
horzLine: 'rgba(255,255,255,0.12)'  // 12% opacity
```

### CSS Variables (via Tailwind)

```javascript
// In button/text styling
color: 'rgba(255,255,255, 0.32)' // Inactive state (32% opacity)
color: 'rgba(255,255,255, 0.5)'  // Medium emphasis
color: 'rgba(255,255,255, 0.45)' // Button disabled/inactive
color: 'rgba(255,255,255, 0.25)' // Very dim (loading state)
color: 'white'                    // Active/primary
```

---

## Lightweight Charts Configuration

**From:** `src/shared/lib/lightweightChartConfig.js`

**Function:**
```typescript
function createDarkChart(
  container: HTMLElement,
  options?: ChartOptions
): IChartApi
```

**Used in ChartSection:**
```javascript
const chart = createDarkChart(container, {
  localization: { locale: 'en-US' },
  crosshair: { /* ... */ },
  rightPriceScale: { /* ... */ },
  timeScale: { /* ... */ },
});
```

**Key Options:**
- `localization` - Formats times/dates for user's locale
- `crosshair` - Vertical and horizontal lines for hover
- `rightPriceScale` - Hidden (no Y-axis labels)
- `timeScale` - Hidden (no X-axis labels)
- `timeVisible` - true (shows time in crosshair tooltip)
- `barSpacing` - 7px between candles
- `minBarSpacing` - 1.8px minimum

---

## Fetch Functions

### fetchBtcSpot

**From:** `src/shared/services/priceApi.js`

**Signature:**
```typescript
function fetchBtcSpot(): Promise<{
  usd: number;
  timestamp: number;
}>
```

**Usage:**
```javascript
useModuleData(fetchBtcSpot, { refreshMs: 10_000, ... })
```

**Implementation (expected):**
```javascript
async function fetchBtcSpot() {
  const response = await fetch('/api/btc/spot');
  const data = await response.json();
  return data;  // { usd: 45250.50, timestamp: 1710000000000 }
}
```

---

### fetchBtcHistory

**From:** `src/shared/services/priceApi.js`

**Signature:**
```typescript
function fetchBtcHistory(
  days: number,
  interval: string
): Promise<Array<{
  ts: number;
  price: number;
  tooltipLabel: string;
}>>
```

**Usage:**
```javascript
const history = await fetchBtcHistory(activeRange.days, activeRange.interval);
// activeRange.days = 7, activeRange.interval = "1h"
```

**Implementation (expected):**
```javascript
async function fetchBtcHistory(days, interval) {
  const response = await fetch(`/api/btc/history?days=${days}&interval=${interval}`);
  const data = await response.json();
  return data;  // Array of { ts, price, tooltipLabel }
}
```

---

## Type Definitions for Agents

When creating a similar price chart module (e.g., for Ethereum):

```typescript
// Input from API
interface SpotPriceInput {
  usd: number;
  timestamp: number;
}

interface HistoryPointInput {
  ts: number;
  price: number;
  tooltipLabel: string;
}

// Component Props (external)
interface PriceChartModuleProps {
  // No props — self-contained
}

// Component State (internal)
interface PriceChartState {
  livePrice: number | null;
  activeLabel: string;
  chartData: HistoryPointInput[];
  loading: boolean;
  hoverData: { price: number; label: string | null } | null;
  showAvgLine: boolean;
}

// Derived Data
interface PriceChartStats {
  high: number | null;
  low: number | null;
  avgPrice: number | null;
  delta: number | null;
  deltaPct: number | null;
  isUp: boolean;
  lineColor: string;
  displayPrice: number | null;
}

// Range Configuration
interface TimeRange {
  label: string;
  days: number;
  interval: string;
  live?: boolean;
}

// Fetch Functions
type FetchSpot = () => Promise<SpotPriceInput>;
type FetchHistory = (days: number, interval: string) => Promise<HistoryPointInput[]>;
```
