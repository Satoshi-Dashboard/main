# S20 Data Schema

## Raw Quarterly Data Point

Embedded historical data entry

```ts
type RawDataPoint = [
  year: number,                // Decimal year (e.g., 2021.35)
  sf: number,                  // Stock-to-Flow ratio at this date
  price: number,               // BTC price in USD
  monthsToNextHalving: number  // Months until next halving event
];
```

## Scatter Dot (SVG Rendered)

Computed from each RAW entry

```ts
interface ScatterDot {
  x: number;     // SVG x coordinate (log scale of sf)
  y: number;     // SVG y coordinate (log scale of price)
  r: number;     // Circle radius (constant: 4)
  fill: string;  // CSS rgb() from dotColor(monthsToNextHalving)
  opacity: 0.82;
}
```

## Dot Color Encoding

```ts
function dotColor(mths: number): string
// mths: 0 → red (near halving)
// mths: 48 → blue (far from halving)
// Green in the middle

// t = clamp(mths / 48, 0, 1)
// r = round(255 * (1 - t))   // 255 when near, 0 when far
// g = round(140 * min(t*2,1) * (1 - max(0, t*2-1)))  // peaks at t=0.5
// b = round(255 * t)          // 0 when near, 255 when far
```

## SVG Coordinate Mapping

```ts
// S2F ratio → X pixel (log scale)
xScale(sf: number): number
// = ML + (log10(sf) - SF_MIN_LOG) / (SF_MAX_LOG - SF_MIN_LOG) * CW

// Price → Y pixel (log scale, inverted — higher price = lower y)
yScale(p: number): number
// = MT + CH - (log10(p) - P_MIN_LOG) / (P_MAX_LOG - P_MIN_LOG) * CH
```

## Model Computation

```ts
function modelP(sf: number): number
// price = MODEL_C × sf^MODEL_EXP
// = 0.34 × sf^2.94

const MODEL_NOW = modelP(CURRENT_SF);
const devPct = +((CURRENT_P - MODEL_NOW) / MODEL_NOW * 100).toFixed(1);
```

## Halving Vertical Lines

```ts
const HALVING_SF = [8, 24, 56, 120];
// S2F values at which each halving occurred:
// H1 2012: SF≈8, H2 2016: SF≈24, H3 2020: SF≈56, H4 2024: SF≈120
```

## Color Gradient Legend

Rendered as `<linearGradient id="s2fLegend">` in SVG defs:

```xml
<stop offset="0%"   stopColor="rgb(255,0,0)" />   <!-- Near halving: red -->
<stop offset="50%"  stopColor="rgb(0,140,0)" />   <!-- Mid cycle: green -->
<stop offset="100%" stopColor="rgb(0,0,255)" />   <!-- Far from halving: blue -->
```
