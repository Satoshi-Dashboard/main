# S18 Component Props

## S18_CycleSpiral (default export)

No external props. Self-contained module.

**Internal state:**

| State | Type | Default | Description |
|---|---|---|---|
| `containerWidth` | `number` | `0` | Current container width (from ResizeObserver) |
| `hoveredWaypoint` | `HoveredWaypoint \| null` | `null` | Clicked dot data for tooltip |
| `tooltipPosition` | `{ x, y }` | `{ x: 0, y: 0 }` | Tooltip position (client coordinates) |
| `zoomScale` | `number` | `1` | Current zoom level (0.5–3) |
| `pan` | `{ x, y }` | `{ x: 0, y: 0 }` | Current pan offset in pixels |
| `mountTime` | `number` | `Date.now()` | Captured at mount for Today marker (lazy init) |

---

## Sub-Component Props

### SpiralTooltip

Fixed-position tooltip shown on dot click.

| Prop | Type | Description |
|---|---|---|
| `active` | `boolean` | Always `true` when rendered |
| `payload` | `HoveredWaypoint` | Data for clicked dot |
| `position` | `{ x: number, y: number }` | Position relative to container |

Displayed at `left: position.x + 10px, top: position.y - 80px` using `fixed` positioning.

---

## Event Handlers

### handleDotClick(e, circle)

- Toggles tooltip: clicking the same dot hides it, clicking a new dot shows it
- Positions tooltip at click coordinates relative to container
- Calls `e.stopPropagation()` to prevent event bubbling

### handleWheel(e)

Pinpoint zoom (like Google Maps):
- Computes vector from current center to mouse cursor
- Adjusts `pan` to keep mouse position stationary during zoom
- Clamps `zoomScale` to `[0.5, 3]`

### handleReset()

Resets `zoomScale` to 1 and `pan` to `{ x: 0, y: 0 }`.

---

## Computed Values (useMemo)

| Value | Computation |
|---|---|
| `dims` | `getResponsiveDimensions(containerWidth)` |
| `circles` | Waypoints mapped to SVG coordinates + colors |
| `todayMarker` | Current position computed from `mountTime` + `latestPrice` |

---

## SVG Transform

```jsx
<div style={{
  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
  transition: 'transform 0.1s ease-out',
  transformOrigin: 'center center',
}}>
```

The entire SVG is wrapped in this div for zoom/pan. The `transformOrigin: 'center center'` combined with `handleWheel` pan adjustment achieves pinpoint zoom.
