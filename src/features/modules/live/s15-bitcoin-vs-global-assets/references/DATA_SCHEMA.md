# S14 — Global Assets Treemap: Data Schema

## API Response Schema

```typescript
interface GlobalAssetsResponse {
  data: {
    assets: AssetRow[];
  };
  updated_at?: string;  // ISO 8601 timestamp
}

interface AssetRow {
  id: string;              // Asset identifier (e.g., "bitcoin", "gold")
  name: string;            // Full display name
  value_trillions: number; // Market cap in trillions of USD
  pct_total: number;       // Percentage of all tracked assets combined
  rank: number;            // Rank by size (1 = largest)
}
```

## Normalized Asset Schema

After `normalizeAssetData(payload)` runs:

```typescript
interface NormalizedAsset {
  id: string;           // Same as AssetRow.id
  name: string;         // Display name from ASSET_STYLE_BY_ID (overrides API name)
  fullName: string;     // Original API name (shown dimmed in card)
  size: number;         // value_trillions
  pct_total: number;    // Percentage of tracked total
  rank: number;         // Rank
  color: string;        // Hex color from ASSET_STYLE_BY_ID
  displaySize: number;  // max(size, totalSize * 0.03) — minimum floor for bar segment
}
```

## Asset Style Map

```typescript
const ASSET_STYLE_BY_ID: Record<string, { color: string; displayName: string }> = {
  real_estate:  { color: '#c4a882', displayName: 'Real Estate'  },
  bonds:        { color: '#c8c8c0', displayName: 'Bonds'        },
  money:        { color: '#9fca84', displayName: 'Money'        },
  equities:     { color: '#6f95df', displayName: 'Equities'     },
  gold:         { color: '#e8cc4b', displayName: 'Gold'         },
  collectibles: { color: '#b28be3', displayName: 'Collectibles' },
  sp500:        { color: '#FF4757', displayName: 'S&P 500'      },
  bitcoin:      { color: '#F7931A', displayName: 'Bitcoin'      },
};
```

Assets not in this map get color `#8d8d8d` and use the API's `name` field.

## Stacked Bar Segment Schema

After bar normalization in `StackedBar`:

```typescript
interface BarSegment {
  asset: NormalizedAsset;
  pct: number;    // Real percentage (from pct_total)
  visW: number;   // Visual width before normalization (max(realPct, MIN_VIS=2.4))
  normW: number;  // Final CSS width percentage (visW / totalVisW * 100)
}
```

`MIN_VIS = 2.4` — minimum visual width (%) so tiny assets remain visible in the bar.

## Hover State Schema

```typescript
interface HoveredSegment {
  id: string;     // Asset ID
  name: string;   // Display name
  pct: number;    // Real percentage value
  color: string;  // Asset color
  x: number;      // Left offset in px (for tooltip positioning)
}
```

## Data Sort Order

Assets are sorted by `pct_total` descending after normalization. This means largest market cap appears first (leftmost in bar, first card in grid).

## Display Amount Formatter

```javascript
function toDisplayAmount(size) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `$${n.toFixed(2)}T`;
}
// Examples: 1.32 → "$1.32T", 0.05 → "$0.05T"
```
