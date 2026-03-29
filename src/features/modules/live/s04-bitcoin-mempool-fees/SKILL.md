---
code: S04
title: Mempool Gauge
description: Real-time Bitcoin mempool size, fee levels, and transaction queue visualization
category: live
status: published
providers:
  - mempool.space
refreshSeconds: 30
---

# Mempool Gauge (S04)

## Description

The Mempool Gauge module provides real-time visualization of Bitcoin's mempool state, fee market conditions, and transaction queue health. It displays:

- **Mempool Size:** Total size in MB/GB with visual progress bar
- **Fee Levels:** Priority (P2P), Standard, and Economy fee rates in sat/vB
- **Fee Distribution:** Visual breakdown of transactions by fee tier
- **Transaction Count:** Total pending transactions with trend indicator
- **Median Fee:** Median fee rate across all pending transactions
- **Queue Visualization:** Animated gauge showing congestion level
- **Time to Confirmation:** Estimated confirmation times for each fee tier

## Data Sources

### Mempool Statistics
- **Source:** mempool.space API
- **Endpoint:** `/api/public/mempool/overview`
- **Includes:** Mempool size, fee rates, transaction count, median fee
- **Refresh Rate:** 30 seconds

### Fee Market Data
- **Source:** mempool.space API
- **Endpoint:** `/api/public/fees/recommended`
- **Returns:** Latest (slow), halfHour (standard), fastestHour (priority) fee rates
- **Refresh Rate:** 30 seconds

### Historical Fee Data
- **Source:** mempool.space API
- **Endpoint:** `/api/public/mempool/hours`
- **Returns:** Mempool size history over past 24 hours (hourly)
- **Refresh Rate:** 60 seconds

## Component Structure

### Main Component: S04_MempoolGauge()

The module manages:
1. **Mempool Size State** - Current size in bytes
2. **Fee Rates State** - Priority, standard, economy rates
3. **Transaction Count State** - Total pending transactions
4. **Congestion Level State** - Calculated from size relative to historical average
5. **Historical Trend State** - Size changes over last 24 hours

### Sub-Components

#### MempoolGaugeDisplay({ size, maxSize, congestionLevel, isIncreasing })

Main gauge visualization showing current mempool utilization.

**Props:**
- `size` (number): Current mempool size in bytes
- `maxSize` (number): Maximum observed size in recent history
- `congestionLevel` (number): 0-100 congestion percentage
- `isIncreasing` (boolean): Whether size is trending up

**Visualization:**
- Circular progress gauge (SVG-based)
- Color intensity: Green (0-33%), Yellow (34-66%), Orange (67-99%), Red (100%+)
- Animated sweep hand showing current level
- Size label in center (e.g., "1.2 GB")

**Colors:**
- Low congestion: UI_COLORS.positive (green #00D897)
- Medium congestion: UI_COLORS.warning (orange #FFA500)
- High congestion: #FF4757 (red)
- Gauge ring: #2a2a2a

#### FeeRateCard({ tier, rate, timeToConfirm, txCount, percentile })

Card displaying a single fee tier (Priority, Standard, Economy).

**Props:**
- `tier` (string): "Priority" | "Standard" | "Economy"
- `rate` (number): Fee rate in sat/vB
- `timeToConfirm` (number): Estimated blocks to confirmation
- `txCount` (number): Count of transactions at this tier
- `percentile` (number): Position in fee market (0-100)

**Styling:**
- Background: #1a1a1a
- Border: 1px solid #2a2a2a
- Left accent bar: Color-coded by tier (green/orange/red)
- Text: white with opacity variations

#### FeeDistributionChart({ feeData })

Horizontal stacked bar chart showing distribution of pending transactions by fee tier.

**Props:**
- `feeData` (array): Array of `{ tier, count, percentage, color }`

**Features:**
- Total bar width: 100%
- Segments sized by transaction percentage
- Hover shows segment details
- Color coding: Priority (green), Standard (orange), Economy (red)
- Responsive width

#### QueueVisualization({ transactions, avgSize })

Animated queue animation showing transaction flow through mempool.

**Props:**
- `transactions` (array): Array of pending transactions (subset for visualization)
- `avgSize` (number): Average transaction size in bytes

**Features:**
- 8-12 animated blocks sliding right to left
- Block height represents transaction size
- Color represents fee tier
- Velocity increases with congestion
- Mobile: Reduced animation complexity

#### MempoolTrend({ historyData })

Sparkline chart showing mempool size trend over last 24 hours.

**Props:**
- `historyData` (array): Array of hourly size measurements `[{ timestamp, size }, ...]`

**Features:**
- SVG line chart with filled area
- Color: Green if trending down, Red if trending up
- Y-axis: Size in MB
- X-axis: 24-hour timeline
- Responsive width/height

## Data Transformations

### Mempool Overview
```javascript
{
  mempool_size: 150000000,      // bytes
  mempool_bytes: 150000000,     // same as above
  total_fee_in_btc: 0.85,       // BTC in fees currently
  tx_count: 125000,              // pending transactions
  median_fee: 45.5               // sat/vB
}
```

### Fee Rates
```javascript
{
  fastestHour: 55,    // Priority, sat/vB
  halfHour: 45,       // Standard, sat/vB
  hourFee: 25         // Economy, sat/vB
}
```

### Congestion Calculation
```javascript
// Normalize current size to max observed in past 24h
congestionLevel = (currentSize / maxSizeIn24h) * 100

// Clamp to 0-100 for display
congestionLevel = Math.min(100, Math.max(0, congestionLevel))
```

### Time to Confirmation Estimation
```javascript
// Blocks until confirmation based on current block production rate
blocksToConfirm = estimateBlocksForFeeRate(feeRate, pendingByFee)

// Multiply by ~10 minutes per block
minutesToConfirm = blocksToConfirm * 10
```

## Related Modules

- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Shows average TX fee metric
- [[S05 Mempool Long-Term Trend|/module/s05-bitcoin-mempool-trend]] - Historical analysis over months/years
- [[S02 Price Chart|/module/s02-bitcoin-price-chart-live]] - Correlate fees with price movement

## Integration for AI Agents

### Creating a Similar Module (e.g., Ethereum Mempool)

1. Copy this module folder to `s##-ethereum-mempool-gauge/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "ethereum-mempool-gauge",
     "title": "Ethereum Mempool Gauge",
     "providers": ["Etherscan"],
     "apiEndpoints": ["/api/eth/mempool/stats"]
   }
   ```
3. Update component:
   - Change API endpoints to fetch Ethereum mempool data
   - Adjust fee units (gwei instead of sat/vB)
   - Modify time-to-confirmation (faster on Ethereum)
4. Update styling if needed (colors for different chains)

### Key Extension Points

- **Fee Tiers:** Modify tier names and percentile thresholds
- **Size Units:** Change from MB/GB to different units if needed
- **Colors:** Update color scheme per blockchain (Bitcoin orange, Ethereum purple, etc.)
- **Polling Rate:** Change `refreshSeconds: 30` for different update frequency
- **Historical Window:** Modify mempool history from 24h to different timeframe
- **Gauge Style:** Replace SVG gauge with alternative visualization

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Card background:** #1a1a1a
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **Positive:** #00D897 (green, low congestion)
- **Warning:** #FFA500 (orange, medium congestion)
- **Negative:** #FF4757 (red, high congestion)
- **Dividers:** #2a2a2a (1px)
- **Borders:** 1px solid #2a2a2a

## API Contracts

### GET /api/public/mempool/overview
```json
{
  "mempool_size": 150000000,
  "tx_count": 125000,
  "median_fee": 45.5,
  "fees": {
    "fastest": 60,
    "halfHour": 45,
    "hourFee": 25,
    "minimum": 1
  },
  "timestamp": 1710000000000
}
```

### GET /api/public/fees/recommended
```json
{
  "fastestHour": 55,
  "halfHour": 45,
  "hourFee": 25,
  "minimumFee": 1
}
```

### GET /api/public/mempool/hours
```json
{
  "data": [
    { "timestamp": 1710000000, "size": 120000000 },
    { "timestamp": 1710003600, "size": 125000000 }
  ]
}
```

## Notes

- Mempool size includes unconfirmed transactions only
- Fee rates are in sat/vB (satoshis per virtual byte)
- Time estimates assume normal network conditions
- Congestion level is relative to recent maximum observed
- Data updates every 30 seconds for near real-time accuracy
- Queue visualization is simplified representation, not exact transaction ordering
