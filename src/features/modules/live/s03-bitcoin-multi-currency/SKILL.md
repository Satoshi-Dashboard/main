---
code: S03
title: Multi-Currency Board
description: Bitcoin price in 30+ fiat currencies with GeoJSON globe visualization and currency sorting
category: live
status: published
providers:
  - Investing.com
  - CoinGecko
refreshSeconds: 60
---

# Multi-Currency Board (S03)

## Description

The Multi-Currency Board module displays Bitcoin price across 30+ fiat currencies and crypto assets in an interactive sortable table. It features:

- **Multi-Currency Display:** BTC/USD, BTC/EUR, BTC/GBP, BTC/JPY, BTC/CNY, BTC/INR, and 25+ other currency pairs
- **Live Pricing:** Real-time updates from Investing.com and CoinGecko APIs
- **GeoJSON Globe Visualization:** Interactive world map showing currency distribution
- **Sortable Table:** Click column headers to sort by currency code, price, or change
- **Currency Search:** Quick filter to find specific currency pairs
- **Change Tracking:** 24h price change with color coding (green/red)
- **Regional Grouping:** Option to group currencies by geographic region

## Data Sources

### Multi-Currency Price Data
- **Primary:** Investing.com API
- **Fallback:** CoinGecko API
- **Refresh Rate:** 60 seconds
- **Endpoint:** `/api/btc/multi-currency`
- **Returns:** Array of 30+ currency pairs with prices and 24h change %

### GeoJSON Globe Data
- **Source:** Static GeoJSON from module assets
- **Contains:** World map boundaries with region metadata
- **Refresh Rate:** Static (loaded once)
- **Endpoint:** `/data/geojson/world-regions.json`

### Currency Metadata
- **Source:** Cached in module state
- **Contains:** Currency codes, symbols, region, display names
- **Maps:** Currency code → region (NA, EU, APAC, LATAM, etc.)

## Component Structure

### Main Component: S03_MultiCurrency()

The module manages:
1. **Currency Data State** - List of 30+ currency pairs with prices
2. **Globe Visualization State** - Active region highlighting
3. **Sort State** - Active column and sort direction
4. **Search State** - Filter text for currency search
5. **Expanded State** - Which currency details are expanded

### Sub-Components

#### CurrencyTable({ data, sortBy, onSort, onSearchChange })

Displays currencies in a sortable, filterable table format.

**Props:**
- `data` (array): Array of currency objects `{ code, price, change24h, region }`
- `sortBy` (string): Active sort column ("code", "price", "change")
- `onSort` (function): Callback when user clicks column header
- `onSearchChange` (function): Callback when user types in search field

**Columns:**
- **Code:** Currency code (USD, EUR, GBP, etc.) - sortable
- **Price:** BTC price in currency - sortable, formatted with locale
- **Change 24h:** Percentage change, colored green (up) or red (down) - sortable
- **Region:** Geographic region badge

**Styling:**
- Background: #111111
- Text color: white
- Hover row: #1a1a1a
- Dividers: #2a2a2a (1px)
- Active sort: Bold text, up/down indicator

#### GeoJSONGlobe({ activeRegion, regions, onRegionSelect })

Interactive world map showing currency distribution by region.

**Props:**
- `activeRegion` (string|null): Selected region code or null
- `regions` (array): Array of region objects with bounds and currency count
- `onRegionSelect` (function): Callback when user clicks region

**Features:**
- SVG-based world map rendering from GeoJSON
- Region hover highlight effect
- Color intensity based on currency count
- Region labels with currency count badges
- Touch-friendly on mobile

**Colors:**
- Default region: #2a2a2a
- Hover region: #3a3a3a
- Active region: UI_COLORS.brand (cyan)
- Labels: white with 80% opacity

#### CurrencyCard({ code, price, change24h, region, expanded })

Detailed view of a single currency when expanded from table.

**Props:**
- `code` (string): 3-letter currency code
- `price` (number): BTC price in currency
- `change24h` (number): Percentage change
- `region` (string): Region name
- `expanded` (boolean): Show expanded details

**Expanded View Shows:**
- 7-day price chart (sparkline)
- Historical high/low
- Volume in currency
- Market cap in currency
- Last update timestamp

#### SearchBar({ onSearchChange })

Input field for filtering currencies by code or region.

**Props:**
- `onSearchChange` (function): Callback with search text

**Styling:**
- Background: #1a1a1a
- Border: 1px solid #2a2a2a
- Placeholder: white 32% opacity
- Focus: Border color UI_COLORS.brand

## Data Transformations

### Currency Object
```javascript
{
  code: "EUR",
  name: "Euro",
  symbol: "€",
  price: 42500.50,
  change24h: 2.35,
  region: "EU",
  timestamp: 1710000000000
}
```

### Region Aggregation
```javascript
regions = {
  "EU": { name: "Europe", count: 8, bounds: [...] },
  "APAC": { name: "Asia-Pacific", count: 12, bounds: [...] },
  "NA": { name: "North America", count: 4, bounds: [...] }
}
```

### Sort Logic
```javascript
// Sort by price descending
sorted = currencies.sort((a, b) => b.price - a.price)

// Sort by change descending (most up)
sorted = currencies.sort((a, b) => b.change24h - a.change24h)
```

## Related Modules

- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Primary price display
- [[S02 Bitcoin Price Chart|/module/s02-bitcoin-price-chart-live]] - Historical price charting
- [[S06 Nodes Map|/module/s06-bitcoin-nodes-world-map]] - Geographic node distribution
- [[S08 Merchant Map|/module/s08-bitcoin-merchant-map]] - Regional merchant adoption

## Integration for AI Agents

### Creating a Similar Module (e.g., Altcoin Multi-Currency)

1. Copy this module folder to `s##-altcoin-multi-currency/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "altcoin-multi-currency",
     "title": "Altcoin Multi-Currency",
     "providers": ["CoinGecko"],
     "apiEndpoints": ["/api/eth/multi-currency"]
   }
   ```
3. Update component:
   - Change fetch to `fetchAltcoinMultiCurrency` (ETH, SOL, etc.)
   - Keep same currency list (30+ fiat pairs)
   - Adjust color scheme if desired
4. Update references with new asset details

### Key Extension Points

- **Currencies:** Modify `CURRENCY_LIST` array to add/remove pairs
- **Regions:** Update `REGION_MAPPING` for different geographic groupings
- **Colors:** Change region hover colors in GeoJSON component
- **Polling Rate:** Change `refreshSeconds: 60` for different update frequency
- **Sorting:** Add more sort columns or implement multi-column sort
- **Globe:** Replace GeoJSON data source or customize SVG rendering

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **Positive:** #00D897 (green for price increases)
- **Negative:** #FF4757 (red for price decreases)
- **Dividers:** #2a2a2a (1px)
- **Hover:** #1a1a1a (slightly lighter than background)

## API Contracts

### GET /api/btc/multi-currency
```json
{
  "currencies": [
    {
      "code": "USD",
      "price": 45000.50,
      "change24h": 2.35,
      "region": "NA"
    },
    {
      "code": "EUR",
      "price": 42500.50,
      "change24h": 2.30,
      "region": "EU"
    }
  ],
  "timestamp": 1710000000000
}
```

### GET /data/geojson/world-regions.json
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "region": "EU", "name": "Europe" },
      "geometry": { "type": "Polygon", "coordinates": [...] }
    }
  ]
}
```

## Notes

- All prices are in the specified fiat currency
- Change percentages are calculated over 24-hour periods
- GeoJSON globe is decorative and helps visualize regional distribution
- Search is case-insensitive and matches partial currency codes
- Regional grouping may vary by data provider
