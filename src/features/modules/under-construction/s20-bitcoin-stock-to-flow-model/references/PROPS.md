# S20 Component Props

## S20_StockToFlow (default export)

No external props. Fully static component — no data fetching hooks.

**Internal state:** None (only `devPct` and `up` computed inside the function from static constants).

---

## Pre-computed Module-Level Values

Computed once when the module is imported (outside the component):

| Variable | Description |
|---|---|
| `modelPath` | `string` — SVG path for the green S2F model line |
| `MODEL_NOW` | `number` — `modelP(CURRENT_SF)` = model price at current S2F |
| `RAW` | `RawDataPoint[]` — 80 historical quarterly entries |
| `HALVING_SF` | `[8, 24, 56, 120]` — S2F at each halving |

---

## Component-Level Computations

```ts
// Inside S20_StockToFlow():
const devPct = +((CURRENT_P - MODEL_NOW) / MODEL_NOW * 100).toFixed(1);
const up = devPct >= 0;
```

---

## SVG Structure (No Sub-components)

All rendering is a single inline `<svg>`. No React sub-components.

Key rendered sections:

| Section | Description |
|---|---|
| Grid | `Y_P_TICKS` (7 horizontal) + `X_SF_TICKS` (8 vertical) |
| Halving lines | 4 vertical dashed lines at `HALVING_SF` values |
| Model line | `<path d={modelPath}>` green |
| Scatter dots | `RAW.map()` → `<circle>` colored by `dotColor(mths)` |
| Current dot | `<circle r=7>` outer ring + `<circle r=4>` fill + "NOW" label |
| Y axis | 7 ticks with USD price labels |
| X axis | 8 ticks with S2F ratio labels |
| Axis borders | Left + bottom border lines |
| X label | "Stock-to-Flow Ratio (log scale)" |
| Y label | "Price USD (log scale)" (rotated -90°) |
| Color legend | Gradient rect + "Near halving" / "Far from halving" labels |
| Model legend | Short green line + equation label |

---

## Development TODOs

When converting from static to live:

1. Add `useState` for `currentSF`, `currentPrice`
2. Add `useModuleData(fetchStockToFlowData)` hook
3. Move `modelPath` into `useMemo` (depends only on static model constants)
4. Wrap outer `<div>` with `<ModuleShell>`
5. Add interactive hover on scatter dots (tooltip showing year, price, S2F, months-to-halving)
6. Consider adding animated dot on "current" position that updates with live BTC price
