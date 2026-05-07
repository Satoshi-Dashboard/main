---
code: S06
title: Nodes Map
description: Bitcoin nodes distribution on interactive world map with network statistics
category: live
status: published
providers:
  - bitnodes.io
  - Blockchain.com
refreshSeconds: 300
---

# Nodes Map (S06)

## Description

The Nodes Map module displays the geographic distribution of Bitcoin nodes across the globe with network statistics and filtering capabilities. It shows:

- **Interactive World Map:** Clustered node markers showing geographic distribution
- **Node Count by Country:** Total nodes per nation with ranking
- **Network Statistics:** Total active nodes, growth rate, node types
- **Regional Heatmap:** Color intensity showing node density by region
- **Zoom & Pan:** Interact with map to explore specific regions
- **Node Type Filtering:** Filter by full nodes, listening nodes, or combined
- **Trend Indicator:** Growth or decline in node count over time
- **Connected Nodes:** Show active connections between node clusters

## Data Sources

### Node Location Data
- **Source:** bitnodes.io API (Bitcoin node map)
- **Endpoint:** `/api/public/nodes/geo`
- **Includes:** IP geolocation, node version, connectivity status
- **Granularity:** Node count aggregated by country/region
- **Refresh Rate:** 300 seconds (5 minutes)

### Node Statistics
- **Source:** Blockchain.com or bitnodes.io API
- **Endpoint:** `/api/public/nodes/stats`
- **Includes:** Total nodes, average nodes per country, growth rate
- **Refresh Rate:** 300 seconds

### GeoJSON World Map
- **Source:** Static GeoJSON from module assets
- **Contains:** Country boundaries and centroids
- **Refresh Rate:** Static (loaded once)

### Historical Node Count
- **Source:** Cached database
- **Contains:** Daily node counts for past 1-2 years
- **Used for:** Trend analysis

## Component Structure

### Main Component: S06_NodesMap()

The module manages:
1. **Map Data State** - Node distribution by country/region
2. **Map View State** - Center, zoom, pan position
3. **Filter State** - Node type selection (full/listening/all)
4. **Hovered Region State** - Highlighted country on map
5. **Statistics State** - Total node count and metrics
6. **Trend State** - Growth/decline indicators

### Sub-Components

#### MapCanvas({ nodeData, filter, onRegionHover, zoomLevel })

SVG-based or canvas-based interactive world map with node markers.

**Props:**
- `nodeData` (object): Node count by country code `{ "US": 5000, "DE": 3200, ... }`
- `filter` (string): "all" | "full" | "listening"
- `onRegionHover` (function): Callback when user hovers over country
- `zoomLevel` (number): Current zoom level (1-8)

**Features:**
- SVG-based map rendering from GeoJSON
- Clustered markers: Small circles for low counts, large circles for high counts
- Color intensity: Darker = more nodes
- Hover effect: Highlight country, show tooltip with count
- Zoom & pan: Mouse wheel to zoom, drag to pan
- Touch-friendly: Pinch-zoom and drag on mobile
- Transition animations between zoom levels

**Marker Sizes:**
- Small (5-20px): Countries with <100 nodes
- Medium (20-40px): Countries with 100-1000 nodes
- Large (40-80px): Countries with >1000 nodes

**Colors:**
- Node density gradient: #1a1a1a (low) → #00D897 (medium) → #00D897 (high)
- Border on hover: UI_COLORS.brand (cyan)
- Background: #111111

#### NodeStatistics({ totalNodes, byType, growth, topCountries })

Summary cards showing network-wide statistics.

**Props:**
- `totalNodes` (number): Total active nodes
- `byType` (object): `{ full: number, listening: number }`
- `growth` (number): Percentage change from 7 days ago
- `topCountries` (array): Top 5 countries `[{ country, count }, ...]`

**Metrics Displayed:**
- **Total Nodes:** Count with trend indicator (green up, red down)
- **Full Nodes:** Count and percentage of total
- **Listening Nodes:** Count and percentage of total
- **7-day Growth:** Percentage change with arrow
- **Top 5 Countries:** Ranked list with flags and counts

**Styling:**
- Cards in grid layout
- Background: #1a1a1a
- Text: white with opacity variations
- Accent: UI_COLORS.brand

#### CountryTable({ nodeData, sortBy, onSort })

Sortable table showing node counts by country.

**Props:**
- `nodeData` (array): Array of `{ country, code, nodes, percentage, growth }`
- `sortBy` (string): Current sort column
- `onSort` (function): Callback for sort changes

**Columns:**
- **Flag:** Country flag emoji
- **Country:** Country name - sortable
- **Nodes:** Node count - sortable
- **%:** Percentage of global nodes - sortable
- **Growth:** 7-day change - sortable
- **Type:** Full/Listening split

**Styling:**
- Background: #111111
- Row hover: #1a1a1a
- Active sort: Bold header with indicator
- Dividers: #2a2a2a

#### RegionStats({ selectedCountry, data })

Detailed view when user hovers/clicks a country on map.

**Props:**
- `selectedCountry` (string): Country name or code
- `data` (object): Detailed stats for country

**Shows:**
- Country name with flag
- Total node count
- Percentage of global nodes
- Node types breakdown
- Connected nodes indicator
- Regional ranking
- 7-day/30-day trend

#### TrendChart({ historicalData })

Sparkline showing total node count trend over past year.

**Props:**
- `historicalData` (array): Daily node counts `[{ date, count }, ...]`

**Features:**
- SVG line chart with area fill
- Color: Green if trending up, red if trending down
- Y-axis: Node count
- X-axis: Time (last 365 days)
- Mobile: Simplified version without area fill

#### FilterButtons({ activeFilter, onFilterChange })

Button group to filter node types.

**Props:**
- `activeFilter` (string): "all" | "full" | "listening"
- `onFilterChange` (function): Callback on filter change

**Buttons:**
- `All Nodes` - Full + listening nodes
- `Full Nodes` - Only full validator nodes
- `Listening Nodes` - Only listening/reachable nodes

**Styling:**
- Active: white text, fontWeight 700, underline, UI_COLORS.brand border
- Inactive: 32% opacity white

## Data Transformations

### Node Data by Country
```javascript
{
  "US": {
    nodes: 5000,
    percentage: 8.5,
    full: 3000,
    listening: 2000,
    growth: 2.5
  },
  "DE": {
    nodes: 3200,
    percentage: 5.4,
    full: 1900,
    listening: 1300,
    growth: 1.2
  }
}
```

### Node Count Aggregation
```javascript
// Sum all nodes per country, categorize by type
totalByCountry = aggregateByCountry(nodeList)

// Calculate percentage
percentage = (countryCount / totalNodes) * 100
```

### Growth Calculation
```javascript
// Compare current count to 7-day average
growth = ((currentCount - avg7DaysAgo) / avg7DaysAgo) * 100
```

### Marker Sizing
```javascript
// Scale marker radius based on node count
nodeCountCutoffs = [100, 1000, 10000]
markerRadius = getRadiusForCount(nodeCount, cutoffs)
```

## Related Modules

- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Network metrics
- [[S07 Lightning Nodes Map|/module/s07-lightning-nodes-world-map]] - Lightning network distribution
- [[S08 Merchant Map|/module/s08-bitcoin-merchant-map]] - Commercial adoption map
- [[S09 Lightning Network|/module/s09-lightning-network-stats]] - Lightning statistics

## Integration for AI Agents

### Creating a Similar Module (e.g., Lightning Nodes Map)

1. Copy this module folder to `s##-lightning-nodes-map/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "lightning-nodes-map",
     "title": "Lightning Nodes Map",
     "providers": ["1ml.com"],
     "apiEndpoints": ["/api/public/lightning-nodes/geo"]
   }
   ```
3. Update component:
   - Change data source to Lightning node API
   - Adjust node type filters (routing nodes, merchants, etc.)
   - May have different geographic distribution patterns
4. Reuse map rendering architecture

### Key Extension Points

- **Node Types:** Add filters for pruned nodes, version selection, etc.
- **Density Visualization:** Switch from markers to heatmap if preferred
- **Statistics:** Add uptime, version, connection count metrics
- **Interactivity:** Add node detail modal on click
- **Export:** Add CSV/JSON export of node data
- **Comparison:** Compare current state with historical snapshot

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Map background:** #0a0a0a (darker)
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **Node density:** #00D897 (green gradient)
- **Positive growth:** #00D897 (green)
- **Negative growth:** #FF4757 (red)
- **Hover highlight:** UI_COLORS.brand (cyan border)
- **Dividers:** #2a2a2a (1px)

## API Contracts

### GET /api/public/nodes/geo
```json
{
  "nodes": {
    "US": { "full": 3000, "listening": 2000, "total": 5000 },
    "DE": { "full": 1900, "listening": 1300, "total": 3200 },
    "NL": { "full": 1200, "listening": 800, "total": 2000 }
  },
  "timestamp": 1710000000000
}
```

### GET /api/public/nodes/stats
```json
{
  "total_nodes": 58000,
  "full_nodes": 35000,
  "listening_nodes": 23000,
  "growth_7d": 2.1,
  "timestamp": 1710000000000,
  "by_country": {
    "US": { "count": 5000, "growth": 1.5 },
    "DE": { "count": 3200, "growth": 0.8 }
  }
}
```

## Notes

- Node locations are based on IP geolocation (approximate)
- Actual node can be in different country than IP suggests
- "Listening nodes" are actively reachable; "full nodes" validate blocks
- Growth rates calculated over 7-day rolling window
- Country grouping follows ISO 3166-1 alpha-2 codes
- Map updates on 5-minute intervals for performance
- Very small node counts (<10) grouped as "Other"
