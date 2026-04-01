# S15 — BTC vs Gold Chart: Component Props

## Main Component

### `S15_BTCvsGold()`
No external props. All data fetched internally.

---

## Sub-Components

### `ChartSection` (memo)

Manages the lightweight-charts instance. Memoized to prevent chart destruction on parent re-renders.

| Prop           | Type                          | Required | Description                                          |
|----------------|-------------------------------|----------|------------------------------------------------------|
| `chartData`    | `ChartPoint[]`                | yes      | Array of time-series points for the active range     |
| `showGold`     | boolean                       | yes      | Whether to render the Gold area series               |
| `onHoverChange`| `(data: HoverPoint|null) => void` | yes  | Callback fired on crosshair move or touch scrub      |

`key={activeLabel}` is applied at the call site, forcing a full remount when the time range changes (simplest way to re-init the chart with new data bounds).

Internal refs:
- `containerRef` — DOM element ref for the chart container div
- `chartRef` — lightweight-charts `IChartApi` instance
- `btcSeriesRef` — BTC `ISeriesApi` instance
- `goldSeriesRef` — Gold `ISeriesApi` instance
- `touchActiveRef` — boolean flag to suppress mouse hover during touch scrubbing

---

### `MetricBox`

Stat card showing a labeled animated metric.

| Prop       | Type   | Required | Default               | Description                              |
|------------|--------|----------|-----------------------|------------------------------------------|
| `label`    | string | yes      | —                     | ALL CAPS label above the value           |
| `value`    | number | yes      | —                     | Numeric value (passed to AnimatedMetric) |
| `decimals` | number | no       | `2`                   | Decimal places                           |
| `color`    | string | no       | `'var(--text-primary)'` | Label text color                       |
| `suffix`   | string | no       | `'T'`                 | Suffix appended to value (e.g., `"T"` for trillions) |

---

### `MetricPlaceholder`

Stat card showing a static unavailable message instead of a metric.

| Prop      | Type   | Required | Default                      | Description           |
|-----------|--------|----------|------------------------------|-----------------------|
| `label`   | string | yes      | —                            | ALL CAPS label        |
| `message` | string | no       | `'Unavailable'`              | Text shown as value   |
| `color`   | string | no       | `'rgba(255,255,255,0.45)'`   | Message text color    |

---

## Range Tab Button

Range tab buttons are rendered inline in the main component via `RANGES.map()`.

| State    | Style                                                        |
|----------|--------------------------------------------------------------|
| Active   | `color: white`, `fontWeight: 700`, `2px white underline`     |
| Inactive | `color: rgba(255,255,255,0.32)`, `fontWeight: 400`           |
| Disabled | `opacity: 0.30`, `cursor: disabled` (when `!hasChart`)       |

---

## Gold Toggle Button

| State    | Style                                              |
|----------|----------------------------------------------------|
| On       | `color: rgba(214,214,214,0.95)`, `fontWeight: 700`, `2px silver underline` |
| Off      | `color: rgba(255,255,255,0.45)`, `fontWeight: 400` |
| Disabled | `opacity: 0.25`, `cursor: not-allowed`             |

Min touch target: `44px × 44px` on mobile, `36px` on desktop.

---

## Chart Colors

| Constant     | Value                      | Used For              |
|--------------|----------------------------|-----------------------|
| `BTC_COLOR`  | `#F7931A`                  | BTC series, BTC label |
| `GOLD_COLOR` | `rgba(214,214,214,0.92)`   | Gold series, Gold label |
| `PANEL_BG`   | `#111111`                  | Chart background      |
