import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map,
  MapControls,
  MapPopup,
  MapClusterLayer,
  useMap,
} from '@/components/ui/map';
import { buildColorMatchExpression } from '@/shared/map/mapDarkStyle.js';

const DENSITY_COLORS = ['#0A3D91', '#145BB8', '#1E78D8', '#49A5EB', '#93CCF7'];

// ─── Helpers ───────────────────────────────────────────────────────────────
function getColorByScale(value, scale) {
  const v = Number(value) || 0;
  if (v <= 0) return '#141414';
  return (scale.find((s) => v >= s.minVal) || {}).color || scale[scale.length - 1].color || '#141414';
}

function getFillColorNodes(count) {
  const v = Number(count) || 0;
  if (v <= 0) return '#141414';
  const scale = [
    { minVal: 801, color: DENSITY_COLORS[0] },
    { minVal: 201, color: DENSITY_COLORS[1] },
    { minVal: 51, color: DENSITY_COLORS[2] },
    { minVal: 11, color: DENSITY_COLORS[3] },
    { minVal: 1, color: DENSITY_COLORS[4] },
  ];
  return scale.find((s) => v >= s.minVal)?.color || '#141414';
}

function getMetricRawValue(stats, metricType) {
  if (!stats) return 0;
  if (metricType === 'channels') return stats.channels || 0;
  if (metricType === 'capacity') return stats.capacity || 0;
  return stats.nodes || 0;
}

// ─── Choropleth Layer ──────────────────────────────────────────────────────
function ChoroplethLayer({ countriesGeo, statsByCode, perCapitaByCode, isAbsolute, metricType, activeScale, onHover }) {
  const { map, isLoaded } = useMap();
  const sourceIdRef = useRef('s07-countries');
  const layerIdRef = useRef('s07-fill');
  const borderIdRef = useRef('s07-border');

  // Build color map
  const colorMap = useMemo(() => {
    if (!countriesGeo?.features) return {};
    const result = {};
    countriesGeo.features.forEach((feature) => {
      const props = feature.properties || {};
      const code = (props.ISO_A2 && props.ISO_A2 !== '-99' ? props.ISO_A2 : props.ISO_A2_EH);
      if (!code) return;
      let color;
      if (isAbsolute) {
        const val = getMetricRawValue(statsByCode[code], metricType);
        color = metricType === 'nodes' ? getFillColorNodes(val) : getColorByScale(val, activeScale);
      } else {
        const pc = perCapitaByCode[code];
        if (!pc) { color = '#141414'; }
        else {
          const val = metricType === 'nodes' ? pc.nodes : metricType === 'channels' ? pc.channels : pc.capacity;
          color = getColorByScale(val, activeScale);
        }
      }
      if (color && color !== '#141414') result[code] = color;
    });
    return result;
  }, [countriesGeo, statsByCode, perCapitaByCode, isAbsolute, metricType, activeScale]);

  useEffect(() => {
    if (!map || !isLoaded || !countriesGeo) return;

    const sourceId = sourceIdRef.current;
    const layerId = layerIdRef.current;
    const borderId = borderIdRef.current;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: countriesGeo,
      });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#141414',
          'fill-opacity': 0.92,
        },
      });
    }

    if (!map.getLayer(borderId)) {
      map.addLayer({
        id: borderId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#2a2a3e',
          'line-width': 0.7,
        },
      });
    }

    // Build match expression (handles ISO_A2 '-99' fallback + empty colorMap)
    map.setPaintProperty(layerId, 'fill-color', buildColorMatchExpression(colorMap, '#141414'));

    // Hover events
    const handleMouseMove = (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features?.[0];
      if (feature && onHover) {
        const props = feature.properties || {};
        const code = (props.ISO_A2 && props.ISO_A2 !== '-99' ? props.ISO_A2 : props.ISO_A2_EH);
        onHover(code, e.originalEvent);
      }
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      if (onHover) onHover(null, null);
    };

    map.on('mousemove', layerId, handleMouseMove);
    map.on('mouseleave', layerId, handleMouseLeave);

    return () => {
      map.off('mousemove', layerId, handleMouseMove);
      map.off('mouseleave', layerId, handleMouseLeave);
      try {
        if (map.getLayer(borderId)) map.removeLayer(borderId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* map already destroyed */ }
    };
  }, [map, isLoaded, countriesGeo, colorMap, onHover]);

  return null;
}

// ─── Connection Lines Layer ────────────────────────────────────────────────
function ConnectionLinesLayer({ channelsGeoLines, visible }) {
  const { map, isLoaded } = useMap();
  const sourceIdRef = useRef('s07-channels');
  const layerIdRef = useRef('s07-channel-lines');

  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = sourceIdRef.current;
    const layerId = layerIdRef.current;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#1d4ed8',
          'line-width': 0.8,
          'line-opacity': 0.25,
          'line-dasharray': [2, 2],
        },
        layout: { visibility: 'none' },
      });
    }

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* map already destroyed */ }
    };
  }, [map, isLoaded]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const sourceId = sourceIdRef.current;
    const layerId = layerIdRef.current;

    const source = map.getSource(sourceId);
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: channelsGeoLines.map((line) => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[line.lng1, line.lat1], [line.lng2, line.lat2]] },
          properties: { pub1: line.pub1, pub2: line.pub2 },
        })),
      });
    }

    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  }, [map, isLoaded, channelsGeoLines, visible]);

  return null;
}

// ─── Main Map Container ────────────────────────────────────────────────────
export default function S07MapContainer({
  layerMode,
  countriesGeo,
  statsByCode,
  perCapitaByCode,
  isAbsolute,
  metricType,
  activeScale,
  networkData,
  channelsGeoLines,
  showConnectionLines,
  selectedPubkey,
  onSelectNode,
  onHoverCountry,
}) {
  const [selectedNode, setSelectedNode] = useState(null);

  // Build GeoJSON for clustering
  const clusterGeoJson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: networkData.points.map((pt) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
        properties: {
          alias: pt.alias,
          capacity: pt.capacity,
          channels: pt.channels,
          pubkey: pt.pubkey,
          countryName: pt.countryName,
          countryCode: pt.countryCode,
        },
      })),
    };
  }, [networkData.points]);

  const handlePointClick = (feature, coordinates) => {
    const props = feature.properties;
    setSelectedNode({
      ...props,
      coordinates,
    });
    if (onSelectNode) onSelectNode(props.pubkey);
  };

  // Fly to selected node
  const mapRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current || !selectedPubkey) return;
    const node = networkData.points.find((p) => p.pubkey === selectedPubkey);
    if (node) {
      mapRef.current.flyTo({ center: [node.lng, node.lat], zoom: 6, duration: 1000 });
    }
  }, [selectedPubkey, networkData.points]);

  const isChoropleth = layerMode === 'choropleth';
  const isBubble = layerMode === 'bubble';

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        center={[10, 20]}
        zoom={2}
        minZoom={1}
        maxZoom={14}
        theme="dark"
      >
        <MapControls />

        {/* Choropleth Layer */}
        {isChoropleth && countriesGeo && (
          <ChoroplethLayer
            countriesGeo={countriesGeo}
            statsByCode={statsByCode}
            perCapitaByCode={perCapitaByCode}
            isAbsolute={isAbsolute}
            metricType={metricType}
            activeScale={activeScale}
            onHover={onHoverCountry}
          />
        )}

        {/* Network Cluster Layer */}
        {isBubble && (
          <MapClusterLayer
            data={clusterGeoJson}
            clusterRadius={50}
            clusterMaxZoom={14}
            clusterColors={['#bfdbfe', '#60a5fa', '#1e40af']}
            clusterThresholds={[10, 50]}
            pointColor="#3b82f6"
            onPointClick={handlePointClick}
          />
        )}

        {/* Connection Lines */}
        {isBubble && (
          <ConnectionLinesLayer
            channelsGeoLines={channelsGeoLines}
            visible={showConnectionLines}
          />
        )}

        {/* Node Popup */}
        {selectedNode && (
          <MapPopup
            key={selectedNode.pubkey}
            longitude={selectedNode.coordinates[0]}
            latitude={selectedNode.coordinates[1]}
            onClose={() => setSelectedNode(null)}
            closeOnClick={false}
            closeButton
            className="s07-popup"
          >
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              padding: '4px 2px',
              minWidth: '160px',
            }}>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
                {selectedNode.alias || 'Unknown'}
              </div>
              <div style={{ color: '#3BA3FF' }}>
                {selectedNode.channels || '?'} channels
              </div>
              <div style={{ marginTop: '4px' }}>
                <span style={{ color: '#FF80AA' }}>
                  {(Number(selectedNode.capacity) / 1e8).toFixed(2)} BTC
                </span> capacity
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)', marginTop: '6px', fontSize: '10px' }}>
                {selectedNode.pubkey ? `${selectedNode.pubkey.substring(0, 16)}…` : '—'}
              </div>
            </div>
          </MapPopup>
        )}
      </Map>
    </div>
  );
}
