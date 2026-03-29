# S19 Component Props

## S19_PowerLawModel (default export)

No external props. Fully static component — no hooks, no data fetching.

**No internal state.** All values are computed at module load time (outside the component function).

---

## Pre-computed Module-Level Values

These are computed once when the module is first imported (not on each render):

| Variable | Description |
|---|---|
| `bandPaths` | `BandPath[]` — 5 power law bands with precomputed SVG path strings |
| `pricePath` | `string` — SVG path for historical BTC price line |
| `currentX` | `number` — SVG x coordinate for TODAY marker |
| `currentY` | `number` — SVG y coordinate for TODAY marker |
| `FAIR_VALUE` | `number` — Fair value at `CURRENT_YEAR` |
| `DEV_PCT` | `number \| null` — % deviation from fair value |

---

## SVG Structure (No Sub-components)

The entire chart is a single inline `<svg>` element. There are no sub-components.

Key rendered elements:

| Element | Description |
|---|---|
| Grid lines | `Y_TICKS` (8 horizontal) + `X_TICKS` (10 vertical) |
| Band fills | `<path>` polygons between adjacent bands, `opacity=0.09` |
| Band lines | `<path>` for each of 5 bands |
| Price line | `<path d={pricePath}>` orange |
| Current dot | `<circle>` + outer ring at `(currentX, currentY)` |
| Today line | Vertical dashed `<line>` + "TODAY" label |
| Y axis | Ticks + labels for `Y_LABELS` |
| X axis | Ticks + labels for `X_TICKS` |
| Legend | Colored line segments + text for each band |

---

## Development TODOs

When converting from static to live:

1. Add `useState` for `currentYear`, `currentPrice`, `priceSeries`
2. Add `useModuleData(fetchPowerLawData)` hook call
3. Move `bandPaths` and `pricePath` computation into `useMemo`
4. Wrap the outer `<div>` with `<ModuleShell>`
5. Add loading skeleton (similar to S16's skeleton bars or S17's `SkeletonChart`)
6. Add error state panel (similar to S16's `WarningPanel`)
