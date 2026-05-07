# API Endpoints - S06 Bitcoin Nodes World Map

## Endpoints Used

### 1. GET /api/bitnodes/cache

**Purpose:** Get Bitcoin full node distribution by country for the choropleth world map

**Response:**
```json
{
  "nodes_by_country": {
    "US": 2450,
    "DE": 1820,
    "FR": 890,
    "GB": 750,
    "NL": 640,
    "TOR": 320
  },
  "total_nodes": 18500,
  "source": "bitnodes",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**Response Fields:**

#### nodes_by_country
- **Type:** `Record<string, number>`
- **Keys:** ISO 3166-1 alpha-2 country codes, plus `"TOR"` for Tor network nodes
- **Values:** Count of reachable Bitcoin full nodes in that country/network

#### total_nodes
- **Type:** number
- **Description:** Total reachable Bitcoin full node count globally

#### source
- **Type:** string
- **Description:** "bitnodes" | "bitnodes_scrape"

**Endpoint Constant:** `const CACHE_ENDPOINT = '/api/bitnodes/cache'`

**Refresh Rate:** 60 seconds (based on worldMapHooks.js `REFRESH_INTERVAL_MS`)

**Source:** bitnodes.io — world's largest publicly accessible Bitcoin node directory

**Error Behavior:**
- Map renders with no color fill if data unavailable
- `keepPreviousOnError: true` via `useModuleData`

---

## Additional Data Sources

### World Countries GeoJSON
- **Source:** `useCountriesGeoJson()` hook (from `worldMapHooks.js`)
- **Purpose:** Country boundary polygons for react-leaflet GeoJSON layer
- **Cached:** Loaded once, retained in module

### World Bank Population Data
- **Source:** `useWorldBankPopulation()` hook
- **Purpose:** Per-capita node density calculation
- **Used For:** Color scale normalization (nodes per million people)

---

## Data Flow Diagram

```
Component Mounts
     ↓
├─ useModuleData(fetchBitnodesCache)
│  └─ → /api/bitnodes/cache
│     └─ returns { nodes_by_country, total_nodes, source }
│        ├─ nodes_by_country → choropleth color mapping
│        └─ total_nodes → header stat
│
├─ useCountriesGeoJson()
│  └─ → country boundary GeoJSON (Natural Earth)
│     └─ passed to react-leaflet <GeoJSON>
│
└─ useWorldBankPopulation()
   └─ → { [countryCode]: population }
      └─ used in computePerCapitaScale()

Every 60 seconds: Re-fetch node data
GeoJSON + Population: Cached from first fetch
```

---

## Per-Capita Calculation

```javascript
// From @/features/modules/live/shared/mapColorUtils.js
function computePerCapitaScale(nodesByCountry, populationByCountry) {
  // Returns normalized scale for per-million-people node density
}

function getFillColorByPerCapita(countryCode, scale) {
  // Returns hex fill color for choropleth map
}
```
