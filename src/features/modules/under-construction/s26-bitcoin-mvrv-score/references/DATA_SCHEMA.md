# S26 — Data Schema

## Constants
| Constant | Value | Description |
|---|---|---|
| CURRENT_PCT | 45.64 | Current MVRV Z-Score percentile (0–100) |
| CHANGE_PCT | 1.13 | 24h change percentage |

## ANCHORS
```ts
[year_decimal: number, percentile: number][]
```
- Coverage: 2010.0 to 2026.17
- 76 anchor points

## DATA (interpolated)
```ts
{ t: number; pct: number }[]
```
- Dense linear interpolation between ANCHORS (up to 100 steps per segment)

## COLOR_STOPS
```ts
{ p: number; r: number; g: number; b: number }[]
```
- 7 stops from deep blue (p=0) to red (p=100)
- `mvrvColor(pct)` interpolates between adjacent stops

## Hover State
```ts
{
  x: number;
  y: number;
  pct: number;
  color: string;
  dateStr: string;  // "Mon YYYY" format
  zone: { label: string; color: string };
} | null
```
