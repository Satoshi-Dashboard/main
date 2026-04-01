# Data Schema - S06 Bitcoin Nodes World Map

## API Response

### /api/bitnodes/cache

```typescript
interface BitnodesResponse {
  nodes_by_country: Record<string, number>;  // ISO code → node count
  total_nodes: number;
  source: "bitnodes" | "bitnodes_scrape";
  updated_at: string;  // ISO datetime
}
```

**Special key:** `"TOR"` — represents Tor-network nodes. Displayed as "TOR Cyberspace" on the map.

```typescript
const UNKNOWN_COUNTRY_LABEL = 'TOR Cyberspace';
```

---

## Country Normalization Utilities

The module uses shared GeoJSON country matching utilities:

```typescript
// From @/shared/lib/geoCountryUtils.js
function getFeatureCountryCode(feature): string | null
function getFeatureCountryName(feature): string
function normalizeCountryName(name): string
function isUnknownCountryValue(code): boolean
const COUNTRY_NAME_ALIASES: Record<string, string>
const ISO_COUNTRY_NAMES: Record<string, string>
```

These handle edge cases like country name variants, territories, and disputed regions.

---

## Choropleth Color Mapping

### computePerCapitaScale(nodesByCountry, populationByCountry)

From `@/features/modules/live/shared/mapColorUtils.js`:

```typescript
interface PerCapitaScale {
  max: number;        // max nodes per million across all countries
  buckets: number[];  // thresholds for color steps
}
```

### getFillColorByPerCapita(countryCode, nodesByCountry, scale, population)

Returns hex fill color for the choropleth map based on nodes-per-million-people.

**Color ramp:** Low density → transparent/dark, High density → bright bitcoin orange or cyan

---

## Per-Capita Display Value

```javascript
function formatPerCapitaValue(value) {
  // Formats nodes/million for tooltip display
  // e.g., "12.5 nodes/M people"
}
```

---

## React-Leaflet GeoJSON Layer

The module renders a `<GeoJSON>` layer:

```typescript
// Each feature = one country
// style(feature) returns:
{
  fillColor: getFillColorByPerCapita(...),
  fillOpacity: 0.7,
  color: '#1a1a2e',    // border stroke
  weight: 0.5,
}
```

---

## Map Configuration

```typescript
const COMPACT_VIEWPORT_MAX_WIDTH = 900;  // useCompactViewport threshold
```

- **Map library:** react-leaflet (Leaflet.js)
- **Tile layer:** None (dark base canvas, custom GeoJSON only)
- **Initial center:** `[20, 0]` (equatorial center)
- **Initial zoom:** 2 (world view)

---

## Node Counts Display

| Metric         | Source                      | Format         |
|----------------|-----------------------------|----------------|
| Total nodes    | `total_nodes`               | Compact number |
| Per country    | `nodes_by_country[code]`    | Integer        |
| Per capita     | computed from population    | X per M people |

---

## TOR Nodes Special Handling

TOR nodes (key `"TOR"`) are tracked separately:

```javascript
const torCount = nodes_by_country['TOR'] ?? 0;
```

Displayed in the map legend as "TOR Cyberspace" with purple color (`#A855F7`).
