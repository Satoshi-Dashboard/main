/**
 * MapLibreBase — lightweight wrapper around maplibre-gl Map.
 *
 * Responsibilities:
 * - Mount the maplibre-gl Map instance onto a container div.
 * - Expose the map instance via the `onMapReady(map)` callback once loaded.
 * - Handle resize via ResizeObserver so the map fills its parent correctly.
 * - Clean up on unmount.
 *
 * Usage:
 *   <MapLibreBase
 *     style={CHOROPLETH_DARK_STYLE}
 *     center={[10, 20]}
 *     zoom={2}
 *     onMapReady={(map) => { map.addSource(...); map.addLayer(...); }}
 *   />
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapLibreBase({
  style,
  center = [10, 20],
  zoom = 2,
  minZoom = 1,
  maxZoom = 8,
  projection = 'mercator',
  autoRotate = false,
  onMapReady,
  className = '',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
      minZoom,
      maxZoom,
      attributionControl: false,
      logoPosition: 'bottom-right',
    });

    // Apply globe projection if requested (S03)
    if (projection === 'globe') {
      map.on('load', () => {
        map.setProjection({ type: 'globe' });
      });
    }

    map.on('load', () => {
      // Auto-rotation for globe mode
      if (autoRotate) {
        let rafId;
        const rotate = () => {
          map.rotateTo((map.getBearing() - 0.08) % 360, { duration: 0 });
          rafId = requestAnimationFrame(rotate);
        };
        rafId = requestAnimationFrame(rotate);
        // Stop rotation on user interaction
        map.once('mousedown', () => cancelAnimationFrame(rafId));
        map.once('touchstart', () => cancelAnimationFrame(rafId));
        map._autoRotateRafId = rafId;
      }

      onMapReady?.(map);
    });

    mapRef.current = map;

    // Resize observer — fills parent container correctly on layout changes
    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (map._autoRotateRafId) cancelAnimationFrame(map._autoRotateRafId);
      map.remove();
      mapRef.current = null;
    };
    // Intentional: only run once on mount. Style/center changes handled externally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full ${className}`}
      style={{ background: '#0d1117' }}
    />
  );
}
