# Component Props & Interfaces - S06 Bitcoin Nodes World Map

## Main Component

### S06_NodesMap(props)

**Props:**
```typescript
interface S06Props {
  onOpenDonate?: () => void;
}
```

**Usage:**
```jsx
<S06_NodesMap onOpenDonate={() => setDonateOpen(true)} />
```

---

## Internal State

```typescript
const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
// Tracks which country is hovered/clicked on the map
```

---

## useModuleData Usage

```typescript
const { data, loading, error } = useModuleData(
  () => fetchJson(CACHE_ENDPOINT),
  {
    refreshMs: 60_000,
    initialData: null,
    keepPreviousOnError: true,
  }
);
// CACHE_ENDPOINT = '/api/bitnodes/cache'
```

---

## Shared Hooks Used

### useCountriesGeoJson()
```typescript
// From @/features/modules/live/shared/worldMapHooks.js
// Returns: { geoJson: GeoJSON | null, loading: boolean }
// Fetches once and caches Natural Earth country boundaries
```

### useCompactViewport()
```typescript
// From @/features/modules/live/shared/worldMapHooks.js
// Returns: boolean — true if viewport width < COMPACT_VIEWPORT_MAX_WIDTH
// Used for responsive map controls
```

### useWorldBankPopulation()
```typescript
// From @/shared/hooks/useWorldBankPopulation.js
// Returns: Record<string, number> — ISO code → population
// Used for per-capita node density calculation
```

### useModuleData
```typescript
// From @/shared/hooks/useModuleData.js
```

---

## Map Color Utilities

```typescript
// From @/features/modules/live/shared/mapColorUtils.js
function computePerCapitaScale(nodesByCountry, population): PerCapitaScale
function getFillColorByPerCapita(code, nodes, scale, population): string
function formatPerCapitaValue(value): string
```

---

## React-Leaflet Components Used

```typescript
import { GeoJSON, MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
```

### MapContainer
```typescript
<MapContainer
  center={[20, 0]}
  zoom={2}
  style={{ height: '100%', width: '100%' }}
  zoomControl={false}
  attributionControl={false}
/>
```

### GeoJSON
```typescript
<GeoJSON
  data={geoJson}
  style={styleFunction}     // (feature) => choropleth style
  onEachFeature={onEach}    // hover/click handlers
/>
```

---

## Lucide Icons Used

- `Info` — tooltip/info icon for node count overlay

---

## Color Constants

```typescript
const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  warning: 'var(--accent-warning)',
  textSecondary: 'var(--text-secondary)',
  tor: '#A855F7',    // Purple for TOR Cyberspace nodes
};
```

## Provider Links

```typescript
const PROVIDER_LINKS = {
  bitnodes: 'https://bitnodes.io',
  bitnodes_scrape: 'https://bitnodes.io/nodes/',
};
```
