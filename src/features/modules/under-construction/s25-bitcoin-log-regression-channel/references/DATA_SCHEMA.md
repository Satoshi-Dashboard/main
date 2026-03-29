# S25 — Data Schema

## Model Constants
| Constant | Value | Description |
|---|---|---|
| A | 5.729 | Power-law slope |
| B | -17.05 | Power-law intercept |
| R2 | 98.89 | Model fit percentage |
| DAYS_NOW | 6269 | Days since Bitcoin genesis (Jan 3, 2009) |
| P_4YR_MA | 47000 | Current 4-year moving average BTC price |
| P_MODEL | computed | 10^(A * log10(DAYS_NOW) + B) |
| DEV_PCT | computed | (P_4YR_MA - P_MODEL) / P_MODEL * 100 |

## CURVE_DATA Points
```ts
{ logT: number; logP: number }[]  // 401 points
```
- logT range: 2.40–3.80 (log10 of days)
- logP: model + oscillation (4-year cycles) + early-period noise

## HALVINGS
```ts
{ days: number; label: string }[]
```

## Hover State
```ts
{
  x: number;       // SVG x coordinate
  y: number;       // SVG y coordinate
  logT: number;
  logP: number;
  days: number;
  price: string;   // formatted price string
  date: string;    // "Mon YYYY" format
  dev: number;     // % deviation from model
} | null
```
