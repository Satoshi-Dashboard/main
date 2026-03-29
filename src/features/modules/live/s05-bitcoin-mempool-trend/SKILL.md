---
code: S05
title: Long-Term Trend
description: Mempool size historical analysis with multi-timeframe charts and congestion patterns
category: live
status: published
providers:
  - mempool.space
refreshSeconds: 300
---

# Long-Term Trend (S05)

## Description

The Long-Term Trend module provides historical analysis of Bitcoin's mempool behavior over extended periods. It displays:

- **Multi-Timeframe Charts:** 7-day, 30-day, 90-day, and 1-year views
- **Mempool Size Trends:** Historical size measurements with peak/average indicators
- **Fee Market Evolution:** How transaction fees have changed over time
- **Congestion Patterns:** Identify recurring congestion cycles and anomalies
- **Network Health Indicators:** Moving averages and trend lines
- **Seasonal Analysis:** Detect weekly patterns (weekday vs weekend congestion)
- **Anomaly Detection:** Highlight unusual spikes in mempool size

## Data Sources

### Historical Mempool Data
- **Source:** mempool.space API with historical archive
- **Endpoint:** `/api/public/mempool/history`
- **Query Params:** `timeframe` (7d, 30d, 90d, 1y)
- **Granularity:** Hourly data for 7d/30d, daily data for 90d/1y
- **Refresh Rate:** 300 seconds (5 minutes)

### Fee History Data
- **Source:** mempool.space API
- **Endpoint:** `/api/public/fees/history`
- **Query Params:** `timeframe` (7d, 30d, 90d, 1y)
- **Returns:** Historical fee rates for priority, standard, economy tiers
- **Refresh Rate:** 300 seconds

### Network Statistics
- **Source:** Cached database
- **Contains:** Daily peak, average, min mempool sizes
- **Used for:** Trend analysis, anomaly detection
- **Refresh Rate:** Static (queried on demand)

## Component Structure

### Main Component: S05_LongTermTrend()

The module manages:
1. **Active Timeframe State** - 7d/30d/90d/1y selection
2. **Chart Data State** - Historical data for selected timeframe
3. **Summary Stats State** - Peak, average, min, volatility metrics
4. **Anomaly Data State** - Detected spikes/dips above threshold
5. **Trend State** - Direction and momentum indicators

### Sub-Components

#### TimeframeSelector({ activeTimeframe, onTimeframeChange })

Button group to switch between time ranges.

**Props:**
- `activeTimeframe` (string): "7d" | "30d" | "90d" | "1y"
- `onTimeframeChange` (function): Callback when user selects timeframe

**Buttons:**
- `7D` - Last 7 days (hourly data)
- `30D` - Last 30 days (hourly data)
- `90D` - Last 90 days (daily data)
- `1Y` - Last 365 days (daily data)

**Styling:**
- Active: white text, fontWeight 700, underline
- Inactive: 32% opacity white
- Touch target: min-h-[44px] on mobile

#### MempoolSizeChart({ data, timeframe })

Primary line chart showing mempool size over time.

**Props:**
- `data` (array): Historical size points `[{ timestamp, size }, ...]`
- `timeframe` (string): Current timeframe for label display

**Features:**
- lightweight-charts library (same as S02)
- Y-axis: Size in MB (auto-scaled)
- X-axis: Timeline with smart label intervals
- Interactive crosshair for hover inspection
- Moving average overlay (7-day or 30-day depending on data density)
- Peak/valley annotations on significant extremes
- Area fill with gradient from line color

**Colors:**
- Line: #00D897 (green, matching Bitcoin theme)
- Area: #00D897 with 20% opacity
- Moving average: #FFA500 (orange dashed)
- Anomalies: #FF4757 (red circle markers)

#### FeeRateTrendChart({ data, timeframe })

Overlay chart showing how fee rates have evolved alongside mempool size.

**Props:**
- `data` (array): Historical fee data `[{ timestamp, fast, standard, slow }, ...]`
- `timeframe` (string): Current timeframe

**Features:**
- Multi-line chart (3 lines for fee tiers)
- Left Y-axis: Mempool size (MB)
- Right Y-axis: Fee rate (sat/vB)
- Line colors: Priority (green), Standard (orange), Economy (red)
- Dashed lines for fee data (vs solid for mempool)
- Touch-friendly on mobile

#### TrendIndicators({ data })

Summary cards showing key statistics for selected timeframe.

**Props:**
- `data` (array): Array of size measurements

**Metrics Displayed:**
- **Peak:** Highest mempool size in period, timestamp
- **Average:** Mean size across period
- **Min:** Lowest size in period
- **Volatility:** Standard deviation (σ)
- **Trend:** Direction with % change from start to end
- **Max Growth:** Largest single-period increase

**Styling:**
- Cards in 2-3 column grid
- Background: #1a1a1a
- Border: 1px solid #2a2a2a
- Number emphasis: White, larger font

#### AnomalyList({ anomalies })

Table showing detected unusual mempool events.

**Props:**
- `anomalies` (array): Array of `{ timestamp, size, severity, description }`

**Columns:**
- **Date/Time:** When anomaly occurred
- **Size:** Mempool size at anomaly
- **Type:** "Spike" or "Dip"
- **Severity:** Percentage above/below moving average
- **Duration:** How long anomaly lasted

**Features:**
- Sortable by date or severity
- Color-coded by severity (orange moderate, red severe)
- Expandable rows for additional details

#### SeasonalPattern({ data })

Heatmap showing weekly patterns - which days/hours typically see congestion.

**Props:**
- `data` (object): Aggregated hourly data by day-of-week and hour

**Visualization:**
- 7x24 grid (days x hours)
- Color intensity: Light (low avg), Dark (high avg)
- Hover shows exact average for that hour across selected period
- Y-axis: Monday-Sunday
- X-axis: 0-23 hours UTC

**Use Case:** Identify when Bitcoin congestion typically occurs

## Data Transformations

### Mempool History Point
```javascript
{
  timestamp: 1710000000,        // Unix timestamp
  size: 150000000,              // Bytes
  sizeInMb: 150,                // Derived
  tx_count: 125000,
  median_fee: 45.5
}
```

### Trend Calculation
```javascript
// Simple linear regression
slope = calculateTrend(startPrice, endPrice, periodLength)
// Positive = increasing, negative = decreasing
```

### Anomaly Detection
```javascript
// Points > mean + 2σ or < mean - 2σ
isAnomaly = Math.abs(value - mean) > 2 * stdDev

// Severity as percentage above/below trend
severity = ((value - movingAvg) / movingAvg) * 100
```

### Seasonal Aggregation
```javascript
// Group all hourly data by day-of-week and hour
seasonalData[dayOfWeek][hour] = averageSize
```

## Related Modules

- [[S04 Mempool Gauge|/module/s04-bitcoin-mempool-fees]] - Real-time mempool state
- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Current network metrics
- [[S02 Price Chart|/module/s02-bitcoin-price-chart-live]] - Correlate with price action

## Integration for AI Agents

### Creating a Similar Module (e.g., Network Difficulty Trends)

1. Copy this module folder to `s##-difficulty-long-term-trend/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "difficulty-long-term-trend",
     "title": "Difficulty Long-Term Trend",
     "providers": ["mempool.space"],
     "apiEndpoints": ["/api/public/difficulty/history"]
   }
   ```
3. Update component:
   - Change fetch to `fetchDifficultyHistory`
   - Adjust Y-axis label ("Difficulty (T)" instead of "Size (MB)")
   - Update anomaly detection thresholds if needed
4. Reuse chart architecture (same lightweight-charts setup)

### Key Extension Points

- **Timeframes:** Add/remove 1y, 5y, or custom date range selection
- **Metrics:** Add volume, transaction count, or other metrics to charts
- **Moving Averages:** Change from 7/30-day to custom period
- **Anomaly Threshold:** Adjust sigma multiplier (2σ, 3σ, etc.)
- **Seasonal Window:** Change from 7 days to 28 days or other periods
- **Chart Style:** Modify colors, area opacity, or line width

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Card background:** #1a1a1a
- **Text color:** white (#ffffff)
- **Brand accent:** #00D897 (green, Bitcoin mempool color)
- **Secondary accent:** #FFA500 (orange, fee tier color)
- **Negative/Spike:** #FF4757 (red, anomalies)
- **Dividers:** #2a2a2a (1px)
- **Hover:** #2a2a2a background

## API Contracts

### GET /api/public/mempool/history
```json
{
  "data": [
    { "timestamp": 1710000000, "size": 120000000 },
    { "timestamp": 1710003600, "size": 125000000 },
    { "timestamp": 1710007200, "size": 135000000 }
  ]
}
```

### GET /api/public/fees/history
```json
{
  "data": [
    {
      "timestamp": 1710000000,
      "fastestHour": 55,
      "halfHour": 45,
      "hourFee": 25
    }
  ]
}
```

## Notes

- Historical data is read-only, not updated in real-time
- Hourly granularity for 7-day and 30-day periods for performance
- Daily granularity for 90-day and 1-year periods
- Anomaly detection uses standard deviation method
- Seasonal patterns reset when changing timeframes
- Moving average period auto-adjusts based on data density
- Timezone: All timestamps in UTC
