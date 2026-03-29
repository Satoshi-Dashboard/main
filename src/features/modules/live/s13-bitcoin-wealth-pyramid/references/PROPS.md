# S13 — Wealth Pyramid: Component Props

## Main Component

### `S13_WealthPyramid()`
No external props. All data fetched internally.

---

## View Switching

The component renders one of two layouts based on `viewportWidth`:

| Condition              | Layout Rendered          |
|------------------------|--------------------------|
| `viewportWidth < 768`  | Compact card list (mobile) |
| `viewportWidth >= 768` | SVG pyramid (desktop/tablet) |

---

## SVG Pyramid — Per-Tier `<g>` Element

Each tier renders a `<g>` group with:

1. `<polygon>` — the trapezoid body
   - `points`: 4 corners of the trapezoid
   - `fill`: `tier.color`
   - `stroke`: `#111111`, `strokeWidth`: `2`

2. Left connector `<line>` + `<text>` — address count
   - Line from left edge to 20px left
   - Text: `tier.addresses.toLocaleString()` or `'—'` if null
   - Fill: `UI_COLORS.textPrimary`

3. Right connector `<line>` + `<text>` — USD threshold label
   - Line from right edge to 20px right
   - Text: `tier.threshold` (e.g., `">$1M"`)
   - Fill: `UI_COLORS.brand`, fontWeight 700

---

## Mobile Card — Article Element

Each card has:

| Element     | Content                                                        |
|-------------|----------------------------------------------------------------|
| Header row  | `tier.threshold` (orange, `--fs-label`) + address count (white/75) |
| Progress bar | `height: 8px`, width = `ratio * 100%`, `background: tier.color` |

`ratio` = `Math.max(0.06, tier.addresses / maxAddresses)` — minimum 6% width for visibility.

---

## Shared Footer Props (ModuleSourceFooter)

| Prop                  | Value Used                          |
|-----------------------|-------------------------------------|
| `providers`           | `[{ name: 'BitInfoCharts', url: '...' }]` |
| `refreshLabel`        | `"30m"`                             |
| `sourceSnapshot`      | `meta.updatedAtLocal`               |
| `sourceSnapshotLabel` | `"Source snapshot"`                 |
| `lastSync`            | `meta.fetchedAtLocal`               |
| `lastSyncLabel`       | `"Last checked"`                    |
