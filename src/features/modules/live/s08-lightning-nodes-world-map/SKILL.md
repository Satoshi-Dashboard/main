---
code: S07
title: Lightning Nodes Map
description: Lightning Network nodes distribution on interactive world map with channel statistics
category: live
status: published
providers:
  - 1ml.com
  - Amboss
refreshSeconds: 600
---

# Lightning Nodes Map (S07)

## Description

The Lightning Nodes Map module visualizes the geographic distribution of Lightning Network nodes and payment channels across the globe. It displays:

- **Interactive World Map:** Node location markers with channel connection visualization
- **Node Density by Country:** Total Lightning nodes per nation with growth trends
- **Channel Statistics:** Number of active channels and total capacity
- **Network Health Metrics:** Average node capacity, routing success rates
- **Regional Comparison:** Node count and capacity distribution by region
- **Zoom & Pan:** Interactive map exploration with cluster aggregation
- **Capacity Visualization:** Channel size indicators showing BTC capacity
- **Network Graph:** Show major node connections and routing paths

## Data Sources

### Lightning Node Locations
- **Source:** 1ml.com API (Lightning node tracker)
- **Endpoint:** `/api/public/lightning/nodes/geo`
- **Includes:** Node pubkeys, geolocation, channel count, capacity
- **Granularity:** Aggregated by country
- **Refresh Rate:** 600 seconds (10 minutes)

### Lightning Network Statistics
- **Source:** 1ml.com or Amboss API
- **Endpoint:** `/api/public/lightning/stats`
- **Includes:** Total nodes, channels, capacity, growth metrics
- **Refresh Rate:** 600 seconds

### Channel Data
- **Source:** Lightning Network node APIs
- **Endpoint:** `/api/public/lightning/channels/geo`
- **Includes:** Channel source/dest countries, capacity, routing success
- **Used for:** Visualization of connections between regions
- **Refresh Rate:** 600 seconds

### GeoJSON World Map
- **Source:** Static GeoJSON from module assets
- **Contains:** Country boundaries
- **Refresh Rate:** Static (loaded once)

## Component Structure

### Main Component: S07_LightningNodesMap()

The module manages:
1. **Node Data State** - Lightning node distribution by country
2. **Channel Data State** - Inter-country payment channel connections
3. **Map State** - Center, zoom, pan, clustering level
4. **Filter State** - Node size thresholds, channel filters
5. **Statistics State** - Total nodes, channels, capacity
6. **Hovered Node State** - Details for highlighted node

### Sub-Components

#### LightningMapCanvas({ nodeData, channelData, zoomLevel, onNodeHover })

Interactive world map showing Lightning node distribution with channel connections.

**Props:**
- `nodeData` (object): Node count and capacity by country
- `channelData` (array): Connections `[{ from, to, capacity }, ...]`
- `zoomLevel` (number): Current zoom level (1-8)
- `onNodeHover` (function): Callback when user hovers node

**Features:**
- SVG-based map with GeoJSON country boundaries
- Node markers: Size scaled by node count or total capacity
- Channel lines: Thickness scaled by channel capacity
- Clustered markers at low zoom levels (optimization)
- Expanded view at high zoom (individual channel visualization)
- Color gradient: Darker regions have more nodes
- Interactive tooltips on hover
- Touch-friendly pan and pinch-zoom

**Node Marker Sizing:**
- Scale by either node count or total capacity (user selectable)
- Min radius: 8px, Max radius: 80px
- Color intensity increases with size

**Channel Visualization:**
- Curved lines between country centroids
- Thickness: proportional to total capacity between regions
- Opacity: 60% default, increases on hover
- Color: Gradient from #00D897 (light) to UI_COLORS.brand (bright)
- Animated: Subtle animation on active channels

#### NodeStatistics({ totalNodes, totalChannels, totalCapacity, byRegion })

Summary metrics for entire Lightning Network.

**Props:**
- `totalNodes` (number): Active Lightning nodes
- `totalChannels` (number): Payment channels
- `totalCapacity` (number): Total capacity in BTC
- `byRegion` (object): Regional breakdown

**Metrics Displayed:**
- **Total Nodes:** Count with growth indicator
- **Total Channels:** Count with trend
- **Total Capacity:** BTC with USD equivalent
- **Avg Node Capacity:** Average per node
- **Avg Channel Size:** Average capacity per channel
- **Network Growth:** 30-day percentage change

**Card Layout:**
- 2-3 column grid (responsive)
- Background: #1a1a1a
- Border: 1px solid #2a2a2a
- Large numbers with smaller units label

#### RegionalComparison({ byCountry, sortBy, onSort })

Table comparing nodes, channels, and capacity by country.

**Props:**
- `byCountry` (array): Array of `{ country, nodes, channels, capacity, growth }`
- `sortBy` (string): Active sort column
- `onSort` (function): Callback for sort changes

**Columns:**
- **Country:** Country name with flag - sortable
- **Nodes:** Node count - sortable
- **Channels:** Channel count - sortable
- **Capacity:** Total BTC capacity - sortable
- **Avg Channel:** Average channel size
- **Growth:** 30-day trend percentage

**Features:**
- Sortable by any column
- Color-coded growth (green positive, red negative)
- Expandable rows to show top nodes in country
- Scrollable on mobile

#### ChannelNetwork({ activeCountry, toCountry })

Details view showing channels between two countries.

**Props:**
- `activeCountry` (string): Source country
- `toCountry` (string|null): Destination country or null for all

**Shows:**
- Top channels by capacity
- Total capacity between regions
- Number of distinct payment paths
- Average routing time
- Success rate for payments

#### NetworkTrendChart({ historicalData })

Sparkline showing growth in nodes, channels, or capacity over time.

**Props:**
- `historicalData` (array): Daily measurements `[{ date, nodes, channels, capacity }, ...]`

**Features:**
- Dual-metric display: Nodes/channels on left, capacity on right
- SVG line chart with area fill
- Separate colors for each metric
- Y-axis scales: nodes/capacity with different units
- Color: Green if trending up, red if down
- Interactive legend to toggle metrics

#### FilterPanel({ filters, onFilterChange })

Controls for filtering Lightning Network visualization.

**Props:**
- `filters` (object): `{ minNodes, minCapacity, showChannels }`
- `onFilterChange` (function): Callback on filter change

**Filters:**
- **Min Nodes:** Slider from 1 to 100 (hide small communities)
- **Min Capacity:** Slider from 0.1 to 10 BTC
- **Show Channels:** Toggle channel line visualization
- **Group By:** Nodes or Capacity selection

**Styling:**
- Sliders with responsive width
- Dark background: #1a1a1a
- Active: UI_COLORS.brand highlight

## Data Transformations

### Node Data by Country
```javascript
{
  "US": {
    nodes: 8500,
    channels: 15000,
    capacity: 2500.5,        // BTC
    growth: 5.2,
    avgCapacity: 0.29,       // BTC per node
    avgChannelSize: 0.167    // BTC per channel
  },
  "DE": {
    nodes: 3200,
    channels: 5800,
    capacity: 920.3,
    growth: 3.1,
    avgCapacity: 0.29,
    avgChannelSize: 0.159
  }
}
```

### Channel Connection Data
```javascript
{
  from: "US",
  to: "DE",
  channels: 450,
  capacity: 150.5,          // BTC
  successRate: 95.2         // Percentage
}
```

### Growth Calculation
```javascript
// Compare current to 30 days ago
growth = ((currentMetric - metric30daysAgo) / metric30daysAgo) * 100
```

### Marker Scaling
```javascript
// Size based on node count with saturation at large numbers
baseSize = 8  // Min radius
maxSize = 80
scaleFactor = Math.min(1, nodeCount / 10000)
markerRadius = baseSize + (maxSize - baseSize) * scaleFactor
```

## Related Modules

- [[S09 Lightning Network|/module/s09-lightning-network-stats]] - Detailed network statistics
- [[S06 Nodes Map|/module/s06-bitcoin-nodes-world-map]] - Bitcoin node distribution
- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Bitcoin network metrics
- [[S02 Price Chart|/module/s02-bitcoin-price-chart-live]] - BTC price correlation

## Integration for AI Agents

### Creating a Similar Module (e.g., Stablecoin Network Map)

1. Copy this module folder to `s##-stablecoin-network-map/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "stablecoin-network-map",
     "title": "USDC Network Map",
     "providers": ["Circle", "Blockchain.com"],
     "apiEndpoints": ["/api/public/usdc/bridging/geo"]
   }
   ```
3. Update component:
   - Change data source to bridge transaction data
   - Adjust capacity units (USDC instead of BTC)
   - Modify node concept to "bridge routes" or "exchanges"
4. Reuse map rendering architecture

### Key Extension Points

- **Metrics:** Switch between displaying nodes, channels, or capacity
- **Channel Details:** Add routing fees, time lock info, capacity details
- **Regional Heatmap:** Replace markers with density heatmap
- **Animation:** Add animated payment flows showing volume
- **Export:** CSV/JSON export of node/channel data
- **Historical:** Add slider to see network evolution over time

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Map background:** #0a0a0a (darker)
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **Node color:** #00D897 (green, Lightning branding)
- **Channel color:** Gradient #00D897 → UI_COLORS.brand
- **Positive growth:** #00D897 (green)
- **Negative growth:** #FF4757 (red)
- **Hover highlight:** Increased opacity, UI_COLORS.brand glow
- **Dividers:** #2a2a2a (1px)

## API Contracts

### GET /api/public/lightning/nodes/geo
```json
{
  "nodes": {
    "US": {
      "count": 8500,
      "channels": 15000,
      "capacity": 2500.5
    },
    "DE": {
      "count": 3200,
      "channels": 5800,
      "capacity": 920.3
    }
  },
  "timestamp": 1710000000000
}
```

### GET /api/public/lightning/stats
```json
{
  "total_nodes": 65000,
  "total_channels": 250000,
  "total_capacity": 5000.75,
  "growth_30d": 4.5,
  "timestamp": 1710000000000
}
```

### GET /api/public/lightning/channels/geo
```json
{
  "channels": [
    {
      "from": "US",
      "to": "DE",
      "channel_count": 450,
      "capacity": 150.5
    },
    {
      "from": "DE",
      "to": "NL",
      "channel_count": 180,
      "capacity": 65.2
    }
  ]
}
```

## Notes

- Node locations are based on IP geolocation (approximate)
- Actual Lightning node can be in different country than IP suggests
- Channel capacity shown in BTC (8 decimal places)
- Growth rates calculated over 30-day rolling window
- Network updates on 10-minute intervals (less frequent than Bitcoin nodes)
- Channel lines only shown when zoomed in enough (performance optimization)
- Regional grouping follows ISO 3166-1 alpha-2 codes
