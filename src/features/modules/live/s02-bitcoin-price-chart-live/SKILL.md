---
code: S02
title: Bitcoin Price Chart
description: Interactive lightweight-charts display of BTC price over multiple time ranges (live, 1D, 1W, 1M, 3M, 1Y, 5Y)
category: live
status: published
providers:
  - Binance
refreshSeconds: 15
---

# Bitcoin Price Chart (S02)

## Description

The Bitcoin Price Chart module displays historical and live Bitcoin price data using lightweight-charts, a high-performance charting library. It provides:

- **Time Range Selection:** LIVE (15m candles), 1D, 1W, 1M, 3M, 1Y, 5Y views
- **Interactive Chart:** Desktop crosshair + mobile touch scrubbing support
- **Live Price Updates:** Real-time BTC/USD from Binance (10s refresh)
- **Average Price Line:** Optional toggle to show average price in selected range
- **Price Statistics:** HIGH, AVG, LOW prices for current range
- **Delta Tracking:** Price change and % change from period start to current/hovering price

## Data Sources

### Live Price (10s refresh)
- **Source:** Binance API
- **Endpoint:** `/api/btc/spot`
- **Returns:** `{ usd: number, timestamp: number }`
- **Fallback:** Keeps previous price on error

### Historical Price (loaded per range)
- **Source:** Binance API
- **Endpoint:** `/api/btc/history`
- **Query Params:** `days` (1, 7, 30, 90, 365, 1825), `interval` (15m, 5m, 1h, 1d)
- **Returns:** Array of OHLC candles with computed tooltip labels

## Component Structure

### Main Component: S02_PriceChart()

The module manages:
1. **Active Range State** - which time period to display
2. **Live Price State** - current spot price from Binance
3. **Chart Data State** - historical prices for the selected range
4. **Hover State** - crosshair/touch position details
5. **Average Line Toggle** - show/hide average price overlay

### Sub-Components

#### ChartSection({ chartData, showAvgLine, hasAvg, avgPrice, lineColor, onHoverChange })

Wraps the lightweight-charts library and handles all chart rendering, interactions.

**Props:**
- `chartData` (array): Array of price points with timestamp and tooltip labels
- `showAvgLine` (boolean): Whether to display the average price line
- `hasAvg` (boolean): Whether average could be calculated (>0 prices)
- `avgPrice` (number|null): Computed average price for the range
- `lineColor` (string): Hex color for the price line (#00D897 up, #FF4757 down)
- `onHoverChange` (function): Callback when user hovers/touches a point

**Chart Configuration:**
```javascript
{
  localization: { locale: 'en-US' },
  crosshair: {
    vertLine: { color: 'rgba(255,255,255,0.24)' },
    horzLine: { color: 'rgba(255,255,255,0.12)' }
  },
  rightPriceScale: { visible: false, scaleMargins: { top: 0.08, bottom: 0.08 } },
  timeScale: { visible: false, barSpacing: 7, minBarSpacing: 1.8 }
}
```

**Area Series:**
- Line color: Dynamic based on delta (green up, red down)
- Top color: Line color with 33% opacity
- Bottom color: Line color with 0% opacity (transparent)
- Width: 2px, style: Smooth curve (LineStyle.Smooth = 2)

**Average Line (when visible):**
- Color: Dashed white line at 58% opacity
- Width: 1px
- Only visible when `showAvgLine && hasAvg && isFinite(avgPrice)`

**Touch Support:**
- Detects swipe vs scroll (dx > dy = scrub)
- Snaps to nearest bar data point
- Clears position on touchend/touchcancel

#### Time Range Buttons

7 buttons controlling the chart view:
- `LIVE` (live: true) - 15m candles, 1 day data
- `1D` - 5m candles, 1 day data
- `1W` - 1h candles, 7 days data
- `1M` - 1h candles, 30 days data
- `3M` - 1d candles, 90 days data
- `1Y` - 1d candles, 365 days data
- `5Y` - 1d candles, 1825 days data

**Styling:**
- Active: white text, fontWeight 700, underline
- Inactive: 32% opacity white, fontWeight 400, no underline
- LIVE button shows green dot when active with glow effect
- Touch target: min-h-[44px] on mobile, min-h-[36px] on tablet+

#### Stats Cards (HIGH, AVG, LOW)

Three stat tiles at bottom showing price statistics for current range:
- **HIGH** - Maximum price in range, colored green
- **AVG** - Average price (if calculated), colored bitcoin orange
- **LOW** - Minimum price in range, colored red

**Styling:**
- 3-column grid on all breakpoints
- Responsive text size: clamp(0.72rem, 2vw, 0.82rem)
- Border: 1px solid rgba(255,255,255,0.1)
- Rounded corners: responsive (sm:rounded-xl)

## Data Transformations

### Chart Data Point
Input from `/api/btc/history`:
```javascript
{
  ts: 1710000000000,        // Timestamp in ms
  price: 45250.50,          // OHLC close price
  tooltipLabel: "12:34 PM"  // Formatted time for hover
}
```

### Calculations
```javascript
high = Math.max(...prices)
low = Math.min(...prices)
avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length

delta = endPrice - startPrice
deltaPct = (delta / startPrice) * 100

lineColor = delta >= 0 ? '#00D897' : '#FF4757'
```

### Hover/Display Price
```javascript
displayPrice = hoverData ? hoverData.price : livePrice
// Falls back to livePrice if user is not hovering
```

## Performance Optimizations

### Data Caching
```javascript
const dataCache = {}  // In-memory cache per range
const key = `${activeLabel}_${interval}`
// Check cache before fetching
if (dataCache[key]) return cached data
```

### Memoization
- `hoverLabelMap` - Map<time, tooltipLabel> to avoid recalculating on every render
- `ChartSection` - Memoized to prevent recreating lightweight-charts instance
- `prices` - Memoized array of valid prices for stats calculations

### Abort Controller
- Previous requests aborted when range changes
- Prevents race conditions and stale data updates

### Lazy Loading
- Chart library (lightweight-charts) code-split
- Historical data fetched on-demand per range
- Live price uses 10s polling instead of WebSocket (lighter)

## Related Modules

- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Complements with additional metrics
- [[S05 Long-Term Trend|/module/s05-long-term-trend]] - Shows multi-year trend analysis
- [[S15 BTC vs Gold|/module/s15-btc-vs-gold]] - Historical comparison chart
- [[S18 Cycle Spiral|/module/s18-cycle-spiral]] - Halving cycle visualization

## Styling Notes

### Colors
- `#F7931A` - Bitcoin orange (unused in current impl, could be line color variant)
- `#00D897` - Accent green (positive/up color)
- `#FF4757` - Accent red (negative/down color)
- `#111111` - Dark background (via ModuleShell)
- `rgba(255,255,255,*)` - Text with varying opacity

### Responsive Scaling
- Price text: `clamp(1.45rem, 5.2vw, 2.9rem)` - Scales 1.45-2.9rem
- Delta text: `clamp(0.72rem, 2.2vw, 0.82rem)` - Scales 0.72-0.82rem
- Chart height: `min-h-[140px]` on mobile, `min-h-[180px]` on tablet+
- Padding: `px-3.5 pt-3 pb-3` on mobile, `px-5 pt-4 pb-4` on tablet, `px-[22px] pt-5` on desktop

### Touch Targets
- All buttons: min-h-[44px] on mobile (Apple standard)
- Reduces to min-h-[36px] on tablet+ (less critical for touch)
- gap-2 (8px) spacing between buttons

## Integration for AI Agents

### Adding a Similar Module (e.g., Ethereum Price Chart)

1. Copy this module folder to `s03-ethereum-price-chart/` (or similar)
2. Update `module.json`:
   ```json
   {
     "code": "S03",
     "slugBase": "ethereum-price-chart-live",
     "title": "Ethereum Price Chart",
     "providers": ["Coinbase"],
     "apiEndpoints": ["/api/eth/spot", "/api/eth/history"]
   }
   ```
3. Update component:
   - Change fetch calls to `fetchEthSpot`, `fetchEthHistory`
   - Adjust RANGES if needed (Eth can use same intervals)
   - Update color scheme if desired
4. Update `references/API_ENDPOINTS.md` with new endpoint paths
5. Update `references/DATA_SCHEMA.md` if data structure differs

### Key Extension Points

- **Colors:** Change `ACCENT_GREEN`, `ACCENT_RED` for different asset styling
- **Ranges:** Modify `RANGES` array for different time interval strategies
- **Polling Rate:** Change `refreshMs: 10_000` in useModuleData call
- **Cache Strategy:** Modify `dataCache` object or implement IndexedDB for larger datasets
- **Chart Customization:** Modify `createDarkChart` options in lightweightChartConfig.js
