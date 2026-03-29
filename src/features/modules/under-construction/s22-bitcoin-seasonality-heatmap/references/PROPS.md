# S22 — Props

## Component: S22_SeasonalityHeatmap

No external props. All data is static constants defined at module level.

## Module-level Constants
| Constant | Description |
|---|---|
| MONTHS | Array of 12 month abbreviations |
| DATA | Object mapping year to 12-element monthly returns array |
| YEARS | Sorted descending array of years from DATA keys |
| COL_STATS | Array of {avg, med} per month column |

## No State
This is a purely static display component with no useState or useEffect hooks.
