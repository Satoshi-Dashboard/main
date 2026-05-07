# S14 — Global Assets Treemap: Component Props

## Main Component

### `S14_GlobalAssetsTreemap()`
No external props. Data fetched internally via `useModuleData`.

States managed:
- `payload` — raw API response (via `useModuleData`)
- `isLoading` — boolean
- `fetchError` — error object or null

Derived via `useMemo`:
- `assetData` — normalized array of `NormalizedAsset` objects, sorted by `pct_total` desc

---

## Sub-Components

### `StackedBar`

Renders the proportional horizontal bar with hover tooltips.

| Prop   | Type               | Required | Description                              |
|--------|--------------------|----------|------------------------------------------|
| `data` | `NormalizedAsset[]`| yes      | Array of normalized assets, sorted by pct descending |

Internal state:
- `hovered` — `{ id, name, pct, color, x } | null`

Each segment div:
- `width`: `normW%` (normalized visual width)
- `background`: `asset.color`
- `opacity`: `0.55` when another segment is hovered, `1` otherwise

Tooltip:
- Positioned `left: clamp(0px, {hovered.x}px, calc(100% - 120px))`
- Appears below the bar (absolute, `top-full mt-1`)

---

### `AssetCard`

Card component for one asset.

| Prop    | Type             | Required | Description             |
|---------|------------------|----------|-------------------------|
| `asset` | `NormalizedAsset`| yes      | Normalized asset object |

Card layout (vertical flex):
1. **Top color stripe** — `height: 3px`, `background: asset.color`
2. **Content area** (px-3 py-2 sm:px-4 sm:py-3):
   - Name: `isBtc ? '₿ Bitcoin' : asset.name`
   - Market cap value: `toDisplayAmount(asset.size)` in asset color
   - Full name (dimmed, truncated): `asset.fullName`
   - Row: percentage (white/60) + rank badge

Card dimensions:
- Mobile: `h-[148px]`
- Tablet (sm): `h-[190px]`
- Desktop (lg+): `lg:h-auto` (grows to fill grid row)

Grid layout:
- Mobile: `grid-cols-2`
- Tablet+: `grid-cols-4`
- Desktop: `grid-cols-4 grid-rows-2 lg:flex-1`

---

## Loading / Error States

| Condition                           | Rendered UI                                           |
|-------------------------------------|-------------------------------------------------------|
| `isLoading === true`                | `<div className="skeleton h-full w-full rounded-md">` |
| `assetData.length > 0`              | Full grid (bar + cards)                               |
| `assetData.length === 0` + error    | Error message string                                  |
| `assetData.length === 0` + no error | `"No global asset values available."`                 |
