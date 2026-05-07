# S12 — Address Distribution: Component Props

## Main Component

### `S12_AddressDistribution()`
No external props. All data fetched internally via `useModuleData(fetchAddressDistribution, ...)`.

---

## Sub-Components

### `ModuleTitle`
*(from shared components)*

| Prop       | Type        | Required | Description                      |
|------------|-------------|----------|----------------------------------|
| `children` | ReactNode   | yes      | Title text to display            |

Used with: `<ModuleTitle>Address Distribution</ModuleTitle>`

---

### `ModuleSourceFooter`
*(from shared components)*

| Prop                  | Type               | Required | Description                                           |
|-----------------------|--------------------|----------|-------------------------------------------------------|
| `providers`           | `{ name, url }[]`  | yes      | Array of data provider objects                        |
| `refreshLabel`        | string             | no       | Human-readable refresh interval (e.g., `"30m"`)      |
| `sourceSnapshot`      | string             | no       | Formatted timestamp of the upstream data snapshot     |
| `sourceSnapshotLabel` | string             | no       | Label for snapshot field (e.g., `"Source snapshot"`) |
| `lastSync`            | string             | no       | Formatted timestamp of last internal cache sync       |
| `lastSyncLabel`       | string             | no       | Label for last sync field (e.g., `"Last checked"`)   |

---

## Tier Row Data (passed via map, not as explicit props)

Each rendered tier row consumes a `TierRow` object:

| Field       | Type   | Description                                  |
|-------------|--------|----------------------------------------------|
| `name`      | string | Tier name in ALL CAPS                        |
| `emoji`     | string | Marine life emoji for visual identity        |
| `range`     | string | Human-readable BTC balance range             |
| `bg`        | string | CSS variable for the row background color    |
| `addresses` | number | Number of addresses in this tier             |
| `totalBtc`  | number | Total BTC held, displayed with 2 decimals    |
| `pct`       | number | % of total BTC supply, displayed as `X.XX%` |
| `cum`       | number | Cumulative % from this tier upward           |

---

## Layout Breakpoints

| Breakpoint | Layout Used     |
|------------|-----------------|
| `< lg`     | Mobile card list (scrollable articles) |
| `≥ lg`     | Desktop table (flex column rows)       |

The desktop table has 6 columns:
1. Emoji (w-12)
2. Address Type / name (flex-1)
3. BTC Balance / range (w-44, right-aligned)
4. # of Addresses (w-40, right-aligned)
5. Total BTC (w-40, right-aligned)
6. BTC % with cumulative (w-44, right-aligned)
