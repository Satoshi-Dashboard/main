# Data Schema - S03 Bitcoin Multi-Currency Board

## API Response Shape

### fetchMultiCurrencyBtc() → data

```typescript
interface MultiCurrencyResponse {
  currencies: CurrencyEntry[];
  source: string;        // "investing" | "coingecko" | "coingecko_fallback"
  updated_at: string;    // ISO datetime
}

interface CurrencyEntry {
  code: string;          // ISO 4217 currency code e.g., "USD", "EUR", "JPY"
  price: number;         // BTC price in this currency
  change: number;        // 24h percentage change (signed)
}
```

---

## Base Currency Metadata (static)

The component maintains a static `BASE_CURRENCY_META` array with 30 currencies:

```javascript
const BASE_CURRENCY_META = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Renminbi Yuan' },
  // ... 25 more
]
```

The component merges API `price`/`change` into this metadata array. Before data arrives:

```javascript
const EMPTY_CURRENCIES = BASE_CURRENCY_META.map(m => ({ ...m, price: null, change: null }));
```

---

## Currency Display Object

```typescript
interface DisplayCurrency {
  code: string;     // ISO code
  name: string;     // Full name from BASE_CURRENCY_META
  price: number | null;   // null = loading
  change: number | null;  // null = loading
}
```

---

## Band Currencies (Globe Highlight)

```javascript
const BAND_CODES = ['JPY', 'INR', 'KRW', 'CNY', 'EUR', 'GBP', 'USD', 'RUB'];
```

These currencies are highlighted with a colored band on the globe visualization.

---

## GeoJSON Data

Used for the Natural Earth 110m globe canvas:

```typescript
// GeoJSON Feature
interface CountryFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][];
  };
  properties: {
    name: string;
    iso_a2: string;   // ISO 3166-1 alpha-2 country code
  };
}
```

---

## Data Transformations

### Provider Label Parsing

```javascript
function parseOverlayProviders(sourceLabel) {
  // Maps source string to provider display objects with name + URL
  // "investing" → [{ name: 'Investing', url: 'https://www.investing.com/...' }]
  // "coingecko" → [{ name: 'CoinGecko', url: 'https://www.coingecko.com' }]
}
```

### Change Formatting

```javascript
// formatMetaTimestamp from @/shared/utils/formatters.js
// Formats the updated_at timestamp for display in the footer
```

---

## Null Handling

- `price: null` → skeleton loader in table cell
- `change: null` → dashes in change column
- Before GeoJSON loads: canvas shows fallback bounding-box mask

## Refresh Timing

- **Currency data:** 30 seconds (`REFRESH_MS = 30_000`)
- **GeoJSON:** Once on mount (cached via ref)
