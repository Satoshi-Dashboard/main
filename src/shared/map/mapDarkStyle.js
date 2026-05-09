/**
 * Minimal MapLibre GL dark style for choropleth maps.
 *
 * Uses a plain dark background with no basemap tiles — choropleth maps
 * only need the GeoJSON country layer, which is added at runtime.
 * For globe mode (S03), a tile-based style is exported separately.
 */

/** Dark ocean / background color matching the design system */
export const MAP_BG_COLOR = '#0d1117';

/** Default empty-country fill color */
export const MAP_LAND_COLOR = '#141414';

/** Country border color */
export const MAP_BORDER_COLOR = '#2a2a3e';

/**
 * Minimal style object for choropleth maps (S06, S07, S08).
 * No tiles — just background. GeoJSON layers are added via map.addLayer().
 */
export const CHOROPLETH_DARK_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': MAP_BG_COLOR },
    },
  ],
};

/**
 * OpenFreeMap liberty style — used for S03 globe (needs real basemap tiles).
 * Completely free, no API key required.
 */
export const GLOBE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * CARTO Dark Matter — free dark basemap for S03 globe, no API key required.
 * Black background, dark-gray continents, white labels.
 */
export const GLOBE_DARK_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/**
 * Build a MapLibre 'match' expression that maps ISO-2 country codes to fill colors.
 *
 * @param {Record<string, string>} colorMap  { 'US': '#FF6A00', 'DE': '#FF8C1A', ... }
 * @param {string} defaultColor              Fallback color for countries with no data.
 * @returns {Array} MapLibre expression array.
 */
export function buildColorMatchExpression(colorMap, defaultColor = MAP_LAND_COLOR) {
  // ['match', ['get', 'ISO_A2'], 'US', '#FF6A00', 'DE', '#FF8C1A', ..., defaultColor]
  const pairs = Object.entries(colorMap).flatMap(([code, color]) => [code, color]);
  return ['match', ['get', 'ISO_A2'], ...pairs, defaultColor];
}
