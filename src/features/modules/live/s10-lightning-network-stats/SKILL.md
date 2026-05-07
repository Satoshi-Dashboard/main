---
code: S09
title: Lightning Network
description: Lightning Network statistics, channels, capacity, and growth metrics
category: live
status: published
providers:
  - 1ml.com
  - Amboss
  - mempool.space
refreshSeconds: 600
---

# Lightning Network (S09)

## Description

The Lightning Network module provides comprehensive statistics about the Bitcoin Lightning Network, including node metrics, channel data, capacity information, and network health indicators. It displays:

- **Total Network Statistics:** Node count, channel count, total capacity
- **Network Growth:** Monthly and yearly adoption rates
- **Capacity Metrics:** Average channel size, capacity distribution
- **Channel Statistics:** Active channels, channel closures, creation rate
- **Node Rankings:** Top nodes by capacity or channel count
- **Network Health:** Hub centralization, node connectivity, routing success
- **Regional Distribution:** Nodes and capacity by geographic region
- **Growth Trends:** Historical metrics over months/years

## Data Sources

### Lightning Network Overview
- **Source:** 1ml.com API (Lightning Network metrics)
- **Endpoint:** `/api/public/lightning/stats`
- **Includes:** Total nodes, channels, capacity, growth rates
- **Refresh Rate:** 600 seconds (10 minutes)

### Node Statistics
- **Source:** 1ml.com API
- **Endpoint:** `/api/public/lightning/nodes`
- **Includes:** Node metrics, channel count, capacity, connectivity
- **Granularity:** Top 100 nodes, aggregated statistics
- **Refresh Rate:** 600 seconds

### Channel Data
- **Source:** Lightning Network node APIs
- **Endpoint:** `/api/public/lightning/channels`
- **Includes:** Channel counts, capacity distribution, lifecycle events
- **Refresh Rate:** 600 seconds

### Historical Data
- **Source:** Cached 1ml.com snapshots
- **Contains:** Daily measurements for past 2+ years
- **Contains:** Nodes, channels, capacity snapshots
- **Refresh Rate:** Static (loaded from archive)

## Component Structure

### Main Component: S09_LightningNetwork()

The module manages:
1. **Network Stats State** - Global Lightning metrics
2. **Node Data State** - Top nodes and aggregated statistics
3. **Channel Data State** - Channel metrics and distribution
4. **Historical State** - Time-series data for trending
5. **Growth State** - Calculated growth rates
6. **Regional State** - Geographic distribution data

### Sub-Components

#### NetworkOverview({ stats })

Summary cards showing key Lightning Network metrics.

**Props:**
- `stats` (object): `{ nodes, channels, capacity, growth }`

**Metrics Displayed:**
- **Total Nodes:** Count with growth indicator
- **Total Channels:** Channel count with trend
- **Total Capacity:** BTC with USD equivalent
- **Avg Channel Size:** BTC per channel
- **Network Capacity:** Total BTC in channels
- **Monthly Growth:** Percentage change month-over-month

**Card Layout:**
- 2-3 column grid (responsive)
- Background: #1a1a1a
- Text: white with opacity variations
- Large numbers with smaller units

#### CapacityGauge({ used, total, utilization })

Gauge showing how much of network capacity is currently utilized.

**Props:**
- `used` (number): Current capacity in use (routable)
- `total` (number): Total network capacity in BTC
- `utilization` (number): Percentage (0-100)

**Visualization:**
- Circular progress gauge (SVG)
- Color: Green (low utilization), Yellow (medium), Red (high)
- Center text: "45% Utilized" or similar
- Ring: Shows total capacity bands

#### NodesChart({ data })

Horizontal bar chart showing top Lightning nodes by capacity.

**Props:**
- `data` (array): Top 10 nodes `[{ name, capacity, channels }, ...]`

**Features:**
- Bar length: Proportional to capacity
- Color: Gradient from #00D897 (low) to UI_COLORS.brand (high)
- Labels: Node alias, capacity in BTC
- Hover: Show additional node details
- Responsive: Stack bars on mobile

#### ChannelDistributionChart({ data })

Pie/donut chart showing distribution of capacity across network.

**Props:**
- `data` (array): Size buckets `[{ size, count, percentage }, ...]`

**Buckets:**
- <0.1 BTC: "Small" channels
- 0.1-1 BTC: "Medium" channels
- 1-5 BTC: "Large" channels
- >5 BTC: "Mega" channels

**Features:**
- Donut chart with category labels
- Color-coded by size
- Click segment to filter by size
- Legend with hover effects

#### NetworkTrendChart({ historicalData })

Multi-line chart showing network growth over time.

**Props:**
- `historicalData` (array): Historical metrics `[{ date, nodes, channels, capacity }, ...]`

**Features:**
- lightweight-charts library
- Three lines: Nodes (left Y), Channels (right Y), Capacity (right Y)
- Time range: 24 months (2 years)
- Color: Green for nodes, Orange for channels, Cyan for capacity
- Interactive legend to toggle metrics
- Hover details

#### TopNodes({ nodes, sortBy, onSort })

Sortable table of top Lightning nodes.

**Props:**
- `nodes` (array): Top nodes `[{ alias, capacity, channels, uptime }, ...]`
- `sortBy` (string): Sort column
- `onSort` (function): Callback for sort changes

**Columns:**
- **Alias:** Node name - sortable
- **Capacity:** BTC in channels - sortable
- **Channels:** Number of channels - sortable
- **Connectivity:** Connected nodes count
- **Uptime:** Percentage online
- **Region:** Geographic region (if available)

**Styling:**
- Background: #1a1a1a
- Row hover: #2a2a2a
- Rank column: #1 styling

#### ChannelMetrics({ data })

Cards showing detailed channel statistics.

**Props:**
- `data` (object): Channel metrics

**Metrics:**
- **Active Channels:** Currently open
- **Channel Creations:** Per day (7-day average)
- **Channel Closures:** Per day (7-day average)
- **Avg Channel Life:** Days until closure
- **Max Channel Size:** Largest channel capacity
- **Median Channel Size:** 50th percentile

#### GrowthMetrics({ current, previous, period })

Cards highlighting network growth rates.

**Props:**
- `current` (object): `{ nodes, channels, capacity }` current month
- `previous` (object): Same structure, previous month
- `period` (string): "monthly" | "yearly"

**Displays:**
- **Node Growth:** % change month-over-month
- **Channel Growth:** % change
- **Capacity Growth:** % change
- **Adoption Rate:** Nodes added per day
- **Trend:** Direction arrows

#### CentralizationAnalysis({ nodeCapacity, topPercentage })

Visualization showing network decentralization level.

**Props:**
- `nodeCapacity` (array): Capacity percentages for top 10 nodes
- `topPercentage` (number): % of capacity held by top 10

**Features:**
- Cumulative bar chart showing concentration
- Reference lines: 50%, 80%, 90%
- Color: Green if distributed, red if concentrated
- Summary: "Top 10 nodes hold 42% of capacity"

#### RegionalDistribution({ byRegion })

Map or chart showing geographic distribution of Lightning Network.

**Props:**
- `byRegion` (array): Regional metrics `[{ region, nodes, capacity }, ...]`

**Shows:**
- Node count per region
- Total capacity per region
- Percentage of global network
- Growth by region
- Regional rankings

## Data Transformations

### Network Statistics Object
```javascript
{
  nodes: 65000,
  channels: 250000,
  capacity: 5000.75,            // BTC
  avgChannelSize: 0.0200,       // BTC
  avgNodeCapacity: 0.0769,      // BTC
  growth: {
    monthly: 4.5,
    yearly: 45.2
  },
  timestamp: 1710000000000
}
```

### Node Data
```javascript
{
  alias: "ACINQ-1",
  pubkey: "03864ef025fde8fb587d989186ce6a777a28ca86db221200c4e07ead4b42a2a5b",
  capacity: 150.5,              // BTC
  channels: 3250,
  connectivity: 2500,
  uptime: 99.8
}
```

### Growth Calculation
```javascript
monthlyGrowth = ((currentMetric - prevMonthMetric) / prevMonthMetric) * 100
yearlyGrowth = ((currentMetric - prevYearMetric) / prevYearMetric) * 100
dailyAdditionRate = (monthlyGrowth / 30)  // Nodes per day
```

### Centralization Index
```javascript
// Calculate Herfindahl index for concentration
topTenPercent = (top10Capacity / totalCapacity) * 100

// Gini coefficient for inequality
giniCoeff = calculateGini(allNodeCapacities)
```

### Channel Distribution Bucketing
```javascript
buckets = {
  small: { min: 0, max: 0.1, count: 180000 },
  medium: { min: 0.1, max: 1, count: 65000 },
  large: { min: 1, max: 5, count: 4500 },
  mega: { min: 5, max: Infinity, count: 500 }
}
```

## Related Modules

- [[S07 Lightning Nodes Map|/module/s07-lightning-nodes-world-map]] - Geographic node distribution
- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Bitcoin network metrics
- [[S04 Mempool Gauge|/module/s04-bitcoin-mempool-fees]] - Bitcoin on-chain activity
- [[S05 Mempool Trend|/module/s05-bitcoin-mempool-trend]] - Historical on-chain analysis

## Integration for AI Agents

### Creating a Similar Module (e.g., Ethereum Layer-2 Network)

1. Copy this module folder to `s##-ethereum-l2-stats/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "ethereum-l2-stats",
     "title": "Ethereum L2 Network Stats",
     "providers": ["L2Beat", "DefiLlama"],
     "apiEndpoints": ["/api/public/ethereum-l2/stats"]
   }
   ```
3. Update component:
   - Change data source to Layer 2 metrics
   - Adjust capacity units (ETH instead of BTC)
   - Modify node concept to "validators" or "sequencers"
4. Reuse chart architecture (same lightweight-charts patterns)

### Key Extension Points

- **Routing Analysis:** Add success rate, payment attempts, fees data
- **Channel Lifecycle:** Visualize channel open/close events over time
- **Fee Market:** Show Lightning routing fee trends
- **Stability:** Add uptime/downtime analysis for nodes
- **Comparison:** Compare Lightning to on-chain metrics
- **Export:** CSV/JSON export of network statistics
- **Forecasting:** Add trend projection/forecasting

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Card background:** #1a1a1a
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **Nodes metric:** #00D897 (green)
- **Channels metric:** #FFA500 (orange)
- **Capacity metric:** #00D897 (green)
- **Positive growth:** #00D897 (green)
- **Negative growth:** #FF4757 (red)
- **Centralization warning:** #FF4757 (red if too concentrated)
- **Dividers:** #2a2a2a (1px)
- **Hover:** #2a2a2a background

## API Contracts

### GET /api/public/lightning/stats
```json
{
  "nodes": 65000,
  "channels": 250000,
  "capacity": 5000.75,
  "avg_channel_size": 0.0200,
  "growth": {
    "monthly": 4.5,
    "yearly": 45.2
  },
  "timestamp": 1710000000000
}
```

### GET /api/public/lightning/nodes
```json
{
  "nodes": [
    {
      "alias": "ACINQ-1",
      "pubkey": "03864ef025...",
      "capacity": 150.5,
      "channels": 3250,
      "connectivity": 2500
    }
  ],
  "total": 65000,
  "timestamp": 1710000000000
}
```

### GET /api/public/lightning/channels
```json
{
  "active": 250000,
  "created_7d": 1800,
  "closed_7d": 950,
  "distribution": {
    "small": 180000,
    "medium": 65000,
    "large": 4500,
    "mega": 500
  },
  "timestamp": 1710000000000
}
```

## Notes

- Lightning Network data sourced from 1ml.com and node APIs
- Node capacity shown in BTC (8 decimal places)
- Channel metrics from Lightning Network node gossip protocol
- Growth rates calculated over 30-day rolling window
- Network updates on 10-minute intervals
- Centralization analysis helps identify hub concentration risk
- Top nodes often run by LSPs (Lightning Service Providers)
- Regional attribution based on node location (IP geolocation)
