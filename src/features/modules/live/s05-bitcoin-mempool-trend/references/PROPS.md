# Component Props & Interfaces - S05 Bitcoin Mempool Trend

## Main Component

### S05_LongTermTrend(props)

**Props:**
```typescript
interface S05Props {
  onOpenDonate?: () => void;
}
```

**Usage:**
```jsx
<S05_LongTermTrend onOpenDonate={() => setDonateOpen(true)} />
```

**Notes:**
- Uses canvas-based treemap visualization (not Recharts or SVG)
- Wrapped in `<ModuleShell>` for full-height container

---

## Internal State

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
// Treemap redraws whenever fees/mempool data changes
```

---

## useModuleData Usage

```typescript
const { data, loading, error } = useModuleData(
  () => fetchMempoolOverviewBundle(),
  {
    refreshMs: 30_000,
    initialData: null,
    keepPreviousOnError: true,
  }
);
```

---

## Shared Services Used

### fetchMempoolOverviewBundle(options)
- **From:** `@/shared/services/mempoolApi.js`
- **Returns:** `{ overview, fees }`

---

## Shared Hooks Used

### useMediaQuery
```typescript
// From @/shared/hooks/useMediaQuery.js
const isMobile = useMediaQuery('(max-width: 768px)');
```

### useWindowWidth
```typescript
// From @/shared/hooks/useWindowWidth.js
// Returns current window width for responsive canvas sizing
```

### useModuleData
```typescript
// From @/shared/hooks/useModuleData.js
```

---

## Shared Components Used

### ModuleShell
```typescript
// From @/shared/components/module/index.js
```

---

## Canvas Drawing

```typescript
// canvasRef points to <canvas> element
// drawTreemap(canvas, txs) called on data update
// Canvas dimensions: responsive to window width and module container

useEffect(() => {
  if (!data) return;
  const txs = genTxs(data.feeRange, data.txCount, data.blockSize);
  drawTreemap(canvasRef.current, txs);
}, [data]);
```

---

## Fee Legend Items

The module renders a legend showing the fee color scale:

```typescript
const FEE_SCALE = [
  { color: '#00FFCC', label: '<2'   },
  { color: '#00FF88', label: '2-10' },
  { color: '#FFD700', label: '10-50'},
  { color: '#FF8C00', label: '>50'  },
];
```

Each entry: colored square swatch + sat/vB range label

---

## Color Constants (from UI_COLORS)

| Usage        | Token               |
|--------------|---------------------|
| Brand accent | `UI_COLORS.brand`   |
| Positive     | `UI_COLORS.positive`|
| Negative     | `UI_COLORS.negative`|
