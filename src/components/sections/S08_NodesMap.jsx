import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fmt } from '../../utils/formatters';
import { mockNodes } from '../../data/mockData';

const FALLBACK_NODES = mockNodes.slice(0, 700).map((n) => ({ lat: n.lat, lng: n.lng }));

const extractCoords = (payload) => {
  const vals = payload?.nodes ? Object.values(payload.nodes) : [];
  return vals
    .map((e) => {
      if (Array.isArray(e)) {
        for (let i = 0; i < e.length - 1; i++) {
          const lat = Number(e[i]);
          const lng = Number(e[i + 1]);
          if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)
            return { lat, lng };
        }
      }
      if (e && typeof e === 'object') {
        const lat = Number(e.latitude ?? e.lat);
        const lng = Number(e.longitude ?? e.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 1000);
};

export default function S08_NodesMap() {
  const [nodes, setNodes] = useState(FALLBACK_NODES);
  const [totalNodes, setTotalNodes] = useState(21999);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('https://bitnodes.io/api/v1/snapshots/latest/');
        const data = await res.json();
        if (!active) return;
        const coords = extractCoords(data);
        if (coords.length > 0) setNodes(coords);
        if (Number.isFinite(data?.total_nodes)) setTotalNodes(data.total_nodes);
      } catch { /* keep fallback */ }
    })();
    return () => { active = false; };
  }, []);

  const nodeSample = useMemo(() => nodes.slice(0, 850), [nodes]);

  return (
    <div className="relative h-full w-full bg-[#0d0d0d]">
      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={2}
        maxZoom={5}
        style={{ height: '100%', width: '100%', background: '#0d0d0d' }}
        worldCopyJump
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {nodeSample.map((node, i) => (
          <CircleMarker
            key={`${node.lat}-${node.lng}-${i}`}
            center={[node.lat, node.lng]}
            radius={2.5}
            pathOptions={{ color: '#F7931A', fillColor: '#F7931A', fillOpacity: 0.85, weight: 0 }}
          />
        ))}
      </MapContainer>

      {/* Node count pill — centered at bottom */}
      <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2">
        <div
          className="rounded-md bg-black/80 px-6 py-2.5 font-mono backdrop-blur-sm"
          style={{ fontSize: 'var(--fs-heading)' }}
        >
          <span className="text-white/50">Public Bitcoin Nodes: </span>
          <span className="font-bold text-white">{fmt.num(totalNodes)}</span>
        </div>
      </div>
    </div>
  );
}
