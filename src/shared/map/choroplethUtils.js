/**
 * choroplethUtils — MapLibre GL helpers for country choropleth layers.
 *
 * Adds a GeoJSON source + fill layer to an existing MapLibre map instance.
 * Hover detection drives a floating HTML tooltip (no MapLibre Popup overhead).
 *
 * Usage:
 *   const { updateColors, destroy } = addChoroplethLayer(map, {
 *     geojson,
 *     colorMap,         // { 'US': '#FF6A00', ... }
 *     sourceId,         // unique string
 *     layerId,          // unique string
 *     defaultColor,     // fallback fill for countries with no data
 *     borderColor,
 *     tooltipEl,        // existing DOM element for tooltip content
 *     getTooltipHtml,   // (isoA2) => html string
 *   });
 *
 *   // When view mode changes:
 *   updateColors(newColorMap);
 */

import { MAP_LAND_COLOR, MAP_BORDER_COLOR, buildColorMatchExpression } from './mapDarkStyle.js';

/**
 * @param {maplibregl.Map} map
 * @param {object} opts
 */
export function addChoroplethLayer(map, {
  geojson,
  colorMap,
  sourceId,
  layerId,
  defaultColor = MAP_LAND_COLOR,
  borderColor  = MAP_BORDER_COLOR,
  tooltipEl,
  getTooltipHtml,
}) {
  // --- Source ---
  map.addSource(sourceId, {
    type: 'geojson',
    data: geojson,
  });

  // --- Fill layer ---
  map.addLayer({
    id: layerId,
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': buildColorMatchExpression(colorMap, defaultColor),
      'fill-opacity': 0.92,
    },
  });

  // --- Border layer ---
  const borderLayerId = `${layerId}-border`;
  map.addLayer({
    id: borderLayerId,
    type: 'line',
    source: sourceId,
    paint: {
      'line-color': borderColor,
      'line-width': 0.7,
    },
  });

  // --- Hover tooltip ---
  let tooltipVisible = false;

  if (tooltipEl && getTooltipHtml) {
    map.on('mousemove', layerId, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const code = e.features?.[0]?.properties?.ISO_A2 || '';
      const html = getTooltipHtml(code);
      if (!html) return;

      tooltipEl.innerHTML = html;
      tooltipEl.style.display = 'block';
      tooltipEl.style.left = `${e.originalEvent.offsetX + 14}px`;
      tooltipEl.style.top  = `${e.originalEvent.offsetY - 10}px`;
      tooltipVisible = true;
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
      tooltipEl.style.display = 'none';
      tooltipVisible = false;
    });
  }

  // --- Updater: call when view mode / data changes ---
  function updateColors(newColorMap, newDefaultColor = defaultColor) {
    map.setPaintProperty(
      layerId,
      'fill-color',
      buildColorMatchExpression(newColorMap, newDefaultColor),
    );
  }

  function destroy() {
    if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
    if (map.getLayer(layerId))       map.removeLayer(layerId);
    if (map.getSource(sourceId))     map.removeSource(sourceId);
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  return { updateColors, destroy };
}
