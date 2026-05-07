---
code: S08
title: Merchant Map
description: Bitcoin merchant locations on world map with acceptance analytics from btcmap.org
category: live
status: published
providers:
  - btcmap.org
  - OpenStreetMap
refreshSeconds: 3600
---

# Merchant Map (S08)

## Description

The Merchant Map module displays the geographic distribution of Bitcoin-accepting merchants and businesses worldwide. It shows:

- **Interactive World Map:** Location pins for merchants accepting Bitcoin
- **Merchant Count by Country:** Total merchants per nation with growth trends
- **Category Breakdown:** Restaurants, retail, hotels, services, etc.
- **Search & Filter:** Find merchants by name, category, country
- **Merchant Details:** Hours, accepted payment method, verification status
- **Regional Heatmap:** Color intensity showing merchant concentration
- **Growth Analysis:** Track Bitcoin adoption by geographic region over time
- **Export Options:** Download merchant data by region

## Data Sources

### Merchant Location Data
- **Source:** btcmap.org API (community-maintained Bitcoin merchant database)
- **Endpoint:** `/api/public/merchants/geo`
- **Includes:** Merchant location, name, category, payment methods, hours
- **Granularity:** Individual merchants aggregated by country
- **Refresh Rate:** 3600 seconds (1 hour, slower update)

### Merchant Metadata
- **Source:** btcmap.org database
- **Contains:** Business category, verification status, accepted payment methods
- **Categories:** Restaurants, Retail, Hotel, Services, Recreation, etc.
- **Payment Methods:** On-chain, Lightning, USDC, etc.

### Country Statistics
- **Source:** Aggregated from merchant database
- **Contains:** Total merchants per country, growth rate, dominant categories
- **Used for:** Country ranking and trend analysis
- **Refresh Rate:** 3600 seconds

### Historical Adoption Data
- **Source:** Cached snapshots from btcmap.org
- **Contains:** Monthly merchant count snapshots for past 2+ years
- **Used for:** Growth trend analysis
- **Refresh Rate:** Static (loaded from historical archive)

## Component Structure

### Main Component: S08_MerchantMap()

The module manages:
1. **Merchant Data State** - Merchant locations and details
2. **Map View State** - Center, zoom, clustering
3. **Filter State** - Category, country, payment method selection
4. **Search State** - Search text for merchant lookup
5. **Statistics State** - Total merchant count and breakdown
6. **Trend State** - Growth rates and adoption metrics
7. **Selected Merchant State** - Details panel for clicked merchant

### Sub-Components

#### MerchantMapCanvas({ merchants, filter, searchText, onMerchantClick })

Interactive world map showing individual merchant locations.

**Props:**
- `merchants` (array): Merchant objects with location, category, details
- `filter` (object): `{ categories, countries, paymentMethods }`
- `searchText` (string): Search query to highlight matching merchants
- `onMerchantClick` (function): Callback when user clicks a merchant marker

**Features:**
- SVG-based map with GeoJSON country boundaries
- Merchant markers: Clustered at low zoom, expanded at high zoom
- Marker colors: By category (restaurant red, retail blue, hotel purple, etc.)
- Hover effect: Show merchant name and category
- Click detail: Open merchant details panel
- Search highlight: Highlight matching merchants in yellow
- Filter application: Show/hide merchants based on selections
- Zoom levels: 1-15 (city-level detail at max)

**Marker Colors by Category:**
- Restaurant: #FF6B6B (red)
- Retail/Shop: #4ECDC4 (teal)
- Hotel/Accommodation: #9B59B6 (purple)
- Services: #F39C12 (orange)
- Recreation/Entertainment: #E74C3C (dark red)
- Other: #95A5A6 (gray)

#### MerchantStats({ totalMerchants, byCategory, byCountry, growth })

Summary cards showing merchant adoption statistics.

**Props:**
- `totalMerchants` (number): Total merchants in database
- `byCategory` (object): Merchant count per category
- `byCountry` (array): Top countries `[{ country, count }, ...]`
- `growth` (object): `{ monthly: %, yearly: % }`

**Metrics Displayed:**
- **Total Merchants:** Overall count with growth arrow
- **Monthly Growth:** Percentage change month-over-month
- **Yearly Growth:** Percentage change year-over-year
- **Top Category:** Most common merchant type
- **Top Country:** Country with most merchants
- **Growth Rate:** Merchants added per day (calculated)

**Card Layout:**
- 2-3 column grid
- Background: #1a1a1a
- Text: white with opacity variations
- Growth indicator: Green (positive) or red (negative)

#### CategoryBreakdown({ data, onFilterChange })

Pie or donut chart showing merchant distribution across categories.

**Props:**
- `data` (array): `[{ category, count, percentage }, ...]`
- `onFilterChange` (function): Callback when user clicks category

**Features:**
- Donut chart with category labels and percentages
- Color-coded by category
- Interactive: Click segment to filter map
- Legend with hover effects
- Mobile: Stacked bar chart on small screens

#### MerchantTable({ merchants, sortBy, onSort, onMerchantClick })

Searchable, sortable table of merchants in selected region.

**Props:**
- `merchants` (array): Filtered merchant list
- `sortBy` (string): Active sort column
- `onSort` (function): Callback for sort changes
- `onMerchantClick` (function): Callback when row clicked

**Columns:**
- **Name:** Business name - sortable, clickable
- **Category:** Type of business - sortable, filterable
- **Country:** Location country - sortable
- **Payment:** Accepted payment methods (On-chain, LN, USDC)
- **Hours:** Operating hours
- **Verified:** Checkmark if community-verified

**Features:**
- Sortable columns
- Row highlighting on hover
- Click to open details
- Responsive: Stack columns on mobile

#### MerchantDetail({ merchant, onClose })

Detail panel for selected merchant.

**Props:**
- `merchant` (object): Complete merchant data
- `onClose` (function): Callback to close panel

**Information Shown:**
- Business name and category
- Street address
- Map link (click to open in Maps)
- Hours of operation
- Accepted payment methods with logos
- Description/notes
- Website link (if available)
- Last verification date
- Community rating/reviews count

#### RegionalComparison({ byCountry, sortBy, onSort })

Table comparing merchants across countries.

**Props:**
- `byCountry` (array): Country statistics
- `sortBy` (string): Sort column
- `onSort` (function): Callback for sort

**Columns:**
- **Country:** Country name with flag - sortable
- **Merchants:** Total count - sortable
- **Top Category:** Most common type
- **Growth:** Monthly change percentage
- **Last Updated:** Last data refresh date

#### AdoptionTrend({ historicalData })

Line chart showing merchant adoption growth over time.

**Props:**
- `historicalData` (array): Monthly snapshots `[{ date, count }, ...]`

**Features:**
- lightweight-charts library
- Y-axis: Merchant count
- X-axis: Timeline (1-2 years)
- Trend line: Shows overall growth direction
- Interactive crosshair for hover inspection
- Color: Green line with 20% opacity area fill

#### FilterPanel({ filters, onFilterChange })

Controls for filtering merchants by category, country, payment method.

**Props:**
- `filters` (object): Current filter selections
- `onFilterChange` (function): Callback when filter changes

**Filters:**
- **Category Multi-Select:** Checkbox list of categories
- **Country Multi-Select:** Dropdown or list of countries
- **Payment Method:** Checkboxes for On-chain, Lightning, USDC, etc.
- **Verification Status:** Verified only / All
- **Hours:** Open now / 24h / Any

## Data Transformations

### Merchant Object
```javascript
{
  id: "btc-cafe-berlin",
  name: "Bitcoin Cafe",
  category: "restaurant",
  country: "DE",
  latitude: 52.5200,
  longitude: 13.4050,
  address: "123 Bitcoin Str, Berlin",
  hours: "9:00-18:00",
  paymentMethods: ["on-chain", "lightning"],
  verified: true,
  url: "https://bitcoincafe.de",
  addedDate: "2020-03-15",
  lastVerified: "2024-03-20"
}
```

### Merchant Count Aggregation
```javascript
// Group merchants by country
byCountry = {
  "DE": { count: 450, growth: 5.2, topCategory: "restaurant" },
  "US": { count: 2100, growth: 3.8, topCategory: "retail" },
  "AT": { count: 280, growth: 8.1, topCategory: "restaurant" }
}
```

### Growth Calculation
```javascript
// Compare current month to previous month
monthlyGrowth = ((currentMonth - previousMonth) / previousMonth) * 100

// Annualized rate
yearlyGrowth = ((currentYear - previousYear) / previousYear) * 100
```

### Clustering Algorithm
```javascript
// At low zoom, cluster merchants within geographic bounds
// At high zoom, show individual merchants
clustered = clusterByDistance(merchants, zoomLevel)
```

## Related Modules

- [[S06 Nodes Map|/module/s06-bitcoin-nodes-world-map]] - Bitcoin node distribution
- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Bitcoin network metrics
- [[S03 Multi-Currency|/module/s03-bitcoin-multi-currency]] - Currency adoption
- [[S09 Lightning Network|/module/s09-lightning-network-stats]] - Lightning adoption

## Integration for AI Agents

### Creating a Similar Module (e.g., ATM Map)

1. Copy this module folder to `s##-bitcoin-atm-map/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "bitcoin-atm-map",
     "title": "Bitcoin ATM Map",
     "providers": ["CoinATMRadar"],
     "apiEndpoints": ["/api/public/atms/geo"]
   }
   ```
3. Update component:
   - Change data source to ATM database API
   - Simplify categories (one-way, two-way)
   - Add ATM provider filter (Lamassu, General Bytes, etc.)
4. Reuse map rendering architecture

### Key Extension Points

- **Categories:** Customize business types for different networks
- **Payment Methods:** Add more payment method options
- **Ratings:** Integrate user review/rating system
- **Export:** Add CSV export by region
- **Mobile:** Add "Find Near Me" geolocation feature
- **Verification:** Show verification age, add verification workflow
- **Analytics:** Add charts for category trends, adoption by region

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Map background:** #0a0a0a (darker)
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **Category colors:** Varied (red, teal, purple, orange, dark red, gray)
- **Positive growth:** #00D897 (green)
- **Negative growth:** #FF4757 (red)
- **Hover highlight:** UI_COLORS.brand glow
- **Dividers:** #2a2a2a (1px)
- **Cards:** Background #1a1a1a

## API Contracts

### GET /api/public/merchants/geo
```json
{
  "merchants": [
    {
      "id": "btc-cafe-berlin",
      "name": "Bitcoin Cafe",
      "category": "restaurant",
      "country": "DE",
      "latitude": 52.5200,
      "longitude": 13.4050,
      "paymentMethods": ["on-chain", "lightning"],
      "verified": true
    }
  ],
  "timestamp": 1710000000000
}
```

### GET /api/public/merchants/stats
```json
{
  "total": 15432,
  "by_category": {
    "restaurant": 3200,
    "retail": 5100,
    "hotel": 1800,
    "services": 2500,
    "other": 2832
  },
  "growth_monthly": 2.3,
  "growth_yearly": 28.5
}
```

## Notes

- Data sourced from btcmap.org community database (not official directory)
- Merchant locations based on business address submissions
- Verification status indicates community review (not official validation)
- Payment method support varies by location
- Historical data updates monthly to preserve performance
- Categories may vary by region (localized business types)
- Some merchants may accept Bitcoin but not list on btcmap.org
