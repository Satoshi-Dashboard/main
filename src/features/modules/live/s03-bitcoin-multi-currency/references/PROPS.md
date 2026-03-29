# Component Props & Interfaces - S03 Bitcoin Multi-Currency Board

## Main Component

### S03_MultiCurrencyBoard(props)

**Props:**
```typescript
interface S03Props {
  onOpenDonate?: () => void;
}
```

**Usage:**
```jsx
<S03_MultiCurrencyBoard onOpenDonate={() => setDonateOpen(true)} />
```

**Notes:**
- Wrapped in `<ModuleShell>` for full-height container
- Responsive layout: globe on left (desktop), currency table on right
- On mobile: table full-width, globe hidden or stacked below

---

## Internal State

```typescript
const [currencies, setCurrencies] = useState<DisplayCurrency[]>(EMPTY_CURRENCIES);
const [source, setSource] = useState<string>('');
const [updatedAt, setUpdatedAt] = useState<string>('');
const globeRef = useRef<HTMLCanvasElement>(null);
```

---

## useModuleData Usage

```typescript
const { data, loading, error } = useModuleData(
  () => fetchMultiCurrencyBtc(),
  {
    refreshMs: 30_000,
    initialData: null,
    keepPreviousOnError: true,
  }
);
```

---

## Currency Table Columns

| Column  | Type           | Display                      |
|---------|----------------|------------------------------|
| Code    | string         | ISO currency code (e.g. USD) |
| Name    | string         | Full currency name           |
| Price   | number\|null   | BTC price in currency (formatted) |
| Change  | number\|null   | 24h % change with +/- color  |

---

## Globe Visualization

- **Technology:** HTML5 Canvas 2D API (not a map library)
- **Data:** Natural Earth 110m GeoJSON land shapes
- **Rendered:** Land polygons projected onto globe canvas
- **Highlighted:** BAND_CODES currencies shown with colored highlight
- **Interaction:** Hover over canvas updates selected currency display

---

## Shared Hooks Used

### useMediaQuery
```typescript
// From @/shared/hooks/useMediaQuery.js
const isMobile = useMediaQuery('(max-width: 768px)');
```

### useModuleData
```typescript
// From @/shared/hooks/useModuleData.js
// Standard polling hook with keepPreviousOnError
```

---

## Shared Components Used

### AnimatedMetric
```typescript
// From @/shared/components/common/AnimatedMetric.jsx
// Used for animated price display in table
```

### ModuleShell
```typescript
// From @/shared/components/module/index.js
```

---

## Color Constants (from UI_COLORS)

| Usage              | Token                   |
|--------------------|-------------------------|
| Positive change    | `UI_COLORS.positive`    |
| Negative change    | `UI_COLORS.negative`    |
| Brand accent       | `UI_COLORS.brand`       |
| Currency band      | varies per currency     |

---

## CSS Variables

| Variable           | Purpose                      |
|--------------------|------------------------------|
| `--fs-micro`       | Small metadata text          |
| `--fs-caption`     | Currency code labels         |
| `--fs-body`        | Table values                 |
