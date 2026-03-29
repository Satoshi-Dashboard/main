# S22 — Data Schema

## DATA Object
```js
{ [year: number]: number[] }  // 12 values per year, null for unknown
```

Coverage: 2013–2025 (13 years)

## Cell Value
| Value | Type | Meaning |
|---|---|---|
| positive number | % | Positive monthly return |
| negative number | % | Negative monthly return |
| null | — | Future or unknown month |

## COL_STATS (per column/month)
| Field | Type | Description |
|---|---|---|
| avg | number | Average return across all years for that month |
| med | number | Median return across all years for that month |

## Color Encoding
- `cellBg(v)`: maps value to background color
  - `null` → `#1c1c1c` (dark neutral)
  - positive → green scale (rgb), magnitude capped at 60% for full saturation
  - negative → red scale (rgb), magnitude capped at 60%
- `cellText(v)`: formats as `+X.X%` or `-X.X%`
