# S13 — Wealth Pyramid: Data Schema

## API Response Schema

```typescript
interface AddressesRicherResponse {
  richerThan: RicherThanRow[];
  updatedAt: string;   // ISO 8601 UTC
  fetchedAt: string;   // ISO 8601 UTC
}

interface RicherThanRow {
  usdThreshold: number;   // USD value threshold (1, 10, 100, 1000, 10000, 100000, 1000000, ...)
  addresses: number;      // Number of addresses with MORE than this USD value in BTC
}
```

## WEALTH_TIERS Constant Schema

Imported from `@/shared/constants/colors.js`. Each tier is a template object:

```typescript
interface WealthTier {
  key: number;        // USD threshold (matches usdThreshold in API)
  threshold: string;  // Human-readable label, e.g. ">$1M" or ">$100"
  color: string;      // CSS color for pyramid layer and bar fill
}

// Example tier definitions (actual values defined in shared constants):
const WEALTH_TIERS: WealthTier[] = [
  { key: 1_000_000, threshold: '>$1M',   color: '#f7931a' },  // top (richest)
  { key: 100_000,   threshold: '>$100K', color: '#e07b10' },
  { key: 10_000,    threshold: '>$10K',  color: '#c96a0c' },
  { key: 1_000,     threshold: '>$1K',   color: '#b25a09' },
  { key: 100,       threshold: '>$100',  color: '#9b4906' },
  { key: 10,        threshold: '>$10',   color: '#843904' },
  { key: 1,         threshold: '>$1',    color: '#6d2902' },  // bottom (most addresses)
];
```

## Component State Schema

### `tiers` state

```typescript
interface TierWithAddresses extends WealthTier {
  addresses: number | null;   // null = loading, number = loaded
}
```

### `meta` state

```typescript
interface MetaState {
  updatedAt: string;
  updatedAtLocal: string;   // Formatted via formatSourceUtcTimestamp()
  fetchedAt: string;
  fetchedAtLocal: string;
}
```

## SVG Geometry Schema

```typescript
interface PyramidLayout {
  VW: 1000;        // SVG viewBox width
  VH: 700;         // SVG viewBox height
  CX: 500;         // Horizontal center
  PY_TOP: 40;      // Y coordinate of pyramid top edge
  PY_BOT: 590;     // Y coordinate of pyramid bottom edge
  MIN_HW: 55;      // Half-width at top (narrowest, richest tier)
  MAX_HW: 330;     // Half-width at bottom (widest, most addresses)
  N: number;       // Number of tiers (from TIER_TEMPLATE.length)
  TIER_H: number;  // Height per tier = (PY_BOT - PY_TOP) / N
}
```

### `hw(y)` function
Computes half-width at SVG Y coordinate `y`:
```javascript
hw(y) = MIN_HW + (MAX_HW - MIN_HW) * (y - PY_TOP) / (PY_BOT - PY_TOP)
```

### Per-tier Trapezoid
For tier `i`:
```javascript
yTop = PY_TOP + i * TIER_H
yBot = PY_TOP + (i + 1) * TIER_H
yCen = (yTop + yBot) / 2

// Polygon points (trapezoid)
xlTop = CX - hw(yTop);  xrTop = CX + hw(yTop)
xlBot = CX - hw(yBot);  xrBot = CX + hw(yBot)
```

## buildTiers() Function

```javascript
function buildTiers(payload, prevTiers) {
  // Build lookup map: usdThreshold → addresses count
  const map = new Map(payload.richerThan.map(row => [
    Number(row.usdThreshold), Number(row.addresses)
  ]));

  return TIER_TEMPLATE.map((tier, index) => ({
    ...tier,
    addresses: map.has(tier.key)
      ? map.get(tier.key)           // Use API value if available
      : prevTiers?.[index]?.addresses  // Otherwise keep previous value
  }));
}
```
