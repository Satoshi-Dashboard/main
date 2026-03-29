# S11 — Fear & Greed Index: Component Props

## Main Component

### `S11_FearGreedIndex()`
No external props. All data fetched internally via `useModuleData`.

---

## Sub-Components

### `ArcSegment`

Renders a single colored arc segment of the gauge semicircle.

| Prop      | Type   | Required | Description                                         |
|-----------|--------|----------|-----------------------------------------------------|
| `cx`      | number | yes      | SVG center X coordinate                             |
| `cy`      | number | yes      | SVG center Y coordinate (base of the semicircle)    |
| `r`       | number | yes      | Arc radius in SVG units                             |
| `fromVal` | number | yes      | Start value on 0–100 scale                          |
| `toVal`   | number | yes      | End value on 0–100 scale                            |
| `color`   | string | yes      | Stroke color (CSS color or CSS variable)            |
| `sw`      | number | yes      | Stroke width in SVG units                           |

---

### `Tick`

Renders a short tick mark across the arc at a specific scale position.

| Prop | Type   | Required | Description                                      |
|------|--------|----------|--------------------------------------------------|
| `cx` | number | yes      | SVG center X coordinate                          |
| `cy` | number | yes      | SVG center Y coordinate                          |
| `r`  | number | yes      | Arc radius in SVG units                          |
| `v`  | number | yes      | Scale value (0–100) for tick position            |
| `sw` | number | yes      | Stroke width — used to compute tick inner/outer radius |

---

### `Label`

Renders a numeric label outside the arc at a specific scale position.

| Prop | Type   | Required | Description                                      |
|------|--------|----------|--------------------------------------------------|
| `cx` | number | yes      | SVG center X coordinate                          |
| `cy` | number | yes      | SVG center Y coordinate                          |
| `r`  | number | yes      | Arc radius in SVG units                          |
| `v`  | number | yes      | Scale value (0–100) — also used as label text    |
| `sw` | number | yes      | Stroke width — used to offset label outward      |

Label is positioned `sw/2 + 18` SVG units outside the arc radius.

---

### `Bubble`

Displays a circular historical index value bubble with a label.

| Prop    | Type   | Required | Description                                              |
|---------|--------|----------|----------------------------------------------------------|
| `label` | string | yes      | Text below the bubble (e.g., `"Yesterday"`, `"7 Days Ago"`) |
| `value` | number | yes      | Index value (0–100). If not `Number.isFinite`, shows skeleton. |

Bubble background color is determined by `classify(value)` → matching segment color.

Size: `clamp(40px, 6vw, 72px)` — scales with viewport width.

---

## Gauge Size Params (computed, not props)

| Breakpoint | VW  | VH  | R   | SW |
|------------|-----|-----|-----|----|
| `< 480px`  | 420 | 250 | 150 | 20 |
| `< 768px`  | 560 | 300 | 210 | 26 |
| `≥ 768px`  | 700 | 380 | 270 | 32 |
