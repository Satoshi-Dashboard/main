# S19 Data Schema

## Power Law Band

Definition of a price corridor band

```ts
interface Band {
  offset: number;  // log10 offset from fair value model
  color: string;   // CSS hex color
  label: string;   // Human-readable label
}
```

Current bands:

| offset | color | label |
|---|---|---|
| +0.90 | `#cc2200` | Extreme Top |
| +0.45 | `#e07800` | Top |
| 0 | `#00aa55` | Fair Value |
| -0.45 | `#0088cc` | Bottom |
| -0.90 | `#2244ff` | Extreme Bottom |

## Band Path

Computed band with SVG path string

```ts
interface BandPath extends Band {
  path: string;  // SVG path data string ("M x,y L x,y L ...")
}
```

## Price Waypoint

Historical BTC price reference point for drawing the orange price line

```ts
type PriceWaypoint = [
  year: number,   // Decimal year (e.g., 2021.35)
  price: number   // BTC price in USD
];
```

## SVG Coordinate Mapping

```ts
// Year → X pixel
xScale(year: number): number
// = ML + (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * CW

// Price → Y pixel (log scale)
yScale(price: number): number
// = MT + CH - (log10(price) - LOG_MIN) / (LOG_MAX - LOG_MIN) * CH
```

## Model Function

```ts
// Compute power law model price at a given year and band offset
modelPrice(year: number, offset: number = 0): number | null
// Formula: 10^(-17.02 + 5.98 * log10(daysSinceGenesis) + offset)
// Returns null if daysSinceGenesis <= 0
```

## Interpolated Price

```ts
// Get historical BTC price at any decimal year via log-linear interpolation
interpPrice(year: number): number
// Interpolates between PRICE_WP entries in log10 space
```

## Deviation Computation

```ts
const FAIR_VALUE = modelPrice(CURRENT_YEAR, 0);
const DEV_PCT = FAIR_VALUE
  ? +((CURRENT_PRICE - FAIR_VALUE) / FAIR_VALUE * 100).toFixed(1)
  : null;
// Positive = above fair value, Negative = below fair value
```
