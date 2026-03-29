# API Endpoints - S03 Bitcoin Multi-Currency Board

## Endpoints Used

### 1. GET /api/s03/multi-currency

**Purpose:** Get Bitcoin price in 30+ fiat currencies with 24h change data

**Response:**
```json
{
  "currencies": [
    { "code": "USD", "price": 45250.75, "change": 2.34 },
    { "code": "EUR", "price": 41800.50, "change": 2.10 },
    { "code": "GBP", "price": 35900.25, "change": 2.15 },
    { "code": "JPY", "price": 6750000,  "change": 1.85 }
  ],
  "source": "investing",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**Response Fields:**

#### currencies[]
- `code` (string): ISO 4217 currency code (e.g., "USD", "EUR", "JPY")
- `price` (number): BTC price in the given currency
- `change` (number): 24-hour percentage change (signed, e.g., +2.34 or -1.5)

#### source
- **Type:** string
- **Description:** Data source label — "investing" | "coingecko" | "coingecko_fallback"
- **Used For:** Rendering provider label overlays on the globe/map

#### updated_at
- **Type:** string (ISO datetime)
- **Description:** When currency data was last fetched from upstream

**Refresh Rate:** 30 seconds

**Source Implementation:**
- Located in: `src/shared/services/priceApi.js`
- Function: `fetchMultiCurrencyBtc()`
- Primary: Investing.com cross-currency data
- Fallback: CoinGecko multi-currency endpoint

**Error Behavior:**
- Returns last known value if fetch fails
- Component keeps previous data via `keepPreviousOnError: true`

---

### 2. GET (GeoJSON)

**Purpose:** World country boundaries for the globe visualization

**Source:** Natural Earth 110m GeoJSON (loaded via `fetchJson()`)

**Used For:** Rendering land shapes on the interactive globe canvas

**Error Behavior:**
- Falls back to bounding-box mask if network unavailable (component note)

---

## Data Flow Diagram

```
Component Mounts
     ↓
├─ fetchMultiCurrencyBtc()
│  └─ → /api/s03/multi-currency
│     └─ returns { currencies: [{code, price, change}], source }
│        ├─ price data → currency table rows
│        ├─ change → color coded +/- indicators
│        └─ source → provider label overlay
│
└─ fetchJson(GEOJSON_URL)
   └─ → Natural Earth GeoJSON
      └─ used for globe canvas land rendering

Every 30 seconds: Re-fetch multi-currency data
GeoJSON: Fetched once on mount (cached)
```

---

## Caching Strategy

- **Currency Data:** Refreshes every 30 seconds
- **GeoJSON:** Fetched once on mount, no periodic refresh
- **keepPreviousOnError:** true — stale data shown on error
