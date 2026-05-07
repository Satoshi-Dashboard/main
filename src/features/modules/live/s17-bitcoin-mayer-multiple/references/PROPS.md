# S16 Component Props

## S16_MayerMultiple (default export)

No external props. Self-contained module with internal state management.

**Internal state:**

| State | Type | Default | Description |
|---|---|---|---|
| `activeLabel` | `'3M' \| '1Y' \| '5Y'` | `'1Y'` | Active time range selector |
| `hoverData` | `{ mayerMultiple, label } \| null` | `null` | Crosshair hover data |
| `showZones` | `boolean` | `false` | Toggle reference zones on chart |

---

## Sub-Component Props

### MayerCursor

Custom Recharts cursor component (rendered inside `<Tooltip cursor={...}>`)

| Prop | Type | Description |
|---|---|---|
| `points` | `Array<{ x, y, dataKey }>` | Injected by Recharts — active chart points |
| `height` | `number` | Injected by Recharts — chart height |

### MayerTooltip

Custom Recharts tooltip content component

| Prop | Type | Description |
|---|---|---|
| `active` | `boolean` | Whether tooltip is currently active |
| `payload` | `Array` | Recharts payload — `payload[0].payload` is the `ChartPoint` |

Displays: date label, BTC price, Mayer Multiple value.

### StatusCard

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Zone name (e.g., "Overvalued") |
| `range` | `string` | Range description (e.g., "> 2.40") |
| `active` | `boolean` | Whether current value falls in this zone |
| `color` | `string` | CSS color for border and text when active |

### WarningPanel

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Warning headline |
| `description` | `string` | Detail text |

Displayed when: data load error, or insufficient data (< 200 candles).

---

## Recharts Chart Configuration

```jsx
<ComposedChart
  data={chartData}            // MayerPoint[] filtered by selected range
  onMouseMove={handler}       // Updates hoverData state
  onMouseLeave={clearHandler} // Clears hoverData
>
  <YAxis yAxisId="price" domain={[priceYMin, priceYMax]} hide />
  <YAxis yAxisId="mayer" orientation="right" domain={[mayerYMin, mayerYMax]} hide />
  <Area yAxisId="price" dataKey="price" />
  <Line yAxisId="mayer" dataKey="mayerMultiple" />
</ComposedChart>
```

Both Y axes are hidden (`hide`). Dynamic domains are computed from chart data with padding.
