# S12 — Address Distribution: Data Schema

## API Response Schema

```typescript
interface AddressDistributionResponse {
  distribution: DistributionRow[];
  updatedAt: string;    // ISO 8601 UTC timestamp
  fetchedAt: string;    // ISO 8601 UTC timestamp
}

interface DistributionRow {
  range: string;        // e.g. "0.1 - 1"
  addresses: number;    // Count of addresses in this range
  totalBTC: number;     // Total BTC held by addresses in this range
  btcPercent: number;   // Percentage of total BTC supply (0–100)
}
```

## Component State Schema

### `tiers` state (array of 8 objects)

```typescript
interface TierRow {
  name: string;         // "PLANKTON" | "SHRIMP" | "CRAB" | "FISH" | "SHARK" | "WHALE" | "HUMPBACK" | "100K+"
  emoji: string;        // "🦠" | "🦐" | "🦀" | "🐟" | "🦈" | "🐋" | "🐋" | "💰"
  range: string;        // Human-readable range, e.g. "< 0.1 BTC"
  bg: string;           // CSS variable for row background, e.g. "var(--tier-plankton)"
  addresses: number;    // Total addresses across aggregated source ranges
  totalBtc: number;     // Total BTC held (rounded to 2 decimals)
  pct: number;          // Percentage of total BTC supply (rounded to 2 decimals)
  cum: number;          // Cumulative BTC% from this tier upward (100% → 0%)
}
```

### `meta` state

```typescript
interface MetaState {
  updatedAt: string;        // Raw ISO string from API
  updatedAtLocal: string;   // Formatted local timestamp string
  fetchedAt: string;        // Raw ISO string from API
  fetchedAtLocal: string;   // Formatted local timestamp string
}
```

## Tier Background CSS Variables

These CSS variables must be defined in the module's `MODULE_COLORS` style object:

| Variable            | Value     | Description                     |
|---------------------|-----------|---------------------------------|
| `--tier-plankton`   | `#1A1A1A` | Near-black (smallest holders)   |
| `--tier-shrimp`     | `#1F1F1F` | Very dark                       |
| `--tier-crab`       | `#242424` | Dark gray                       |
| `--tier-fish`       | `#2A2A2A` | Medium dark                     |
| `--tier-shark`      | `#33210F` | Dark brown tint                 |
| `--tier-whale`      | `#4A2C12` | Brown                           |
| `--tier-humpback`   | `#6B3A10` | Medium amber-brown              |
| `--tier-100k`       | `#8B4A0F` | Warm amber (largest holders)    |

## Cumulative BTC% Calculation

```javascript
// mapDistributionToTiers() computes cumulative % top-down:
let running = 100;
rows.map(row => {
  const next = { ...row, cum: round2(running) };
  running -= row.pct;  // Subtract this tier's % for the next row
  return next;
});
// Result: PLANKTON.cum = 100%, SHRIMP.cum = 98.41%, ..., 100K+.cum = 3.29%
```
