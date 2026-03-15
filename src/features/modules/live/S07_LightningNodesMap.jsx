import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import S07Worker from './s07DataWorker.js?worker';
import Info from 'lucide-react/dist/esm/icons/info';
import { CircleMarker, GeoJSON, MapContainer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  useCompactViewport,
  useCountriesGeoJson,
} from '@/features/modules/live/shared/worldMapHooks.js';
import { useWorldBankPopulation } from '@/shared/hooks/useWorldBankPopulation.js';
import {
  COUNTRY_NAME_ALIASES,
  ISO_COUNTRY_NAMES,
  getFeatureCountryCode,
  getFeatureCountryName,
  isUnknownCountryValue,
  normalizeCountryName,
} from '@/shared/lib/geoCountryUtils.js';
import { fmt } from '@/shared/utils/formatters.js';

const LIGHTNING_WORLD_ENDPOINT        = '/api/public/lightning/world';
const LIGHTNING_CHANNELS_GEO_ENDPOINT = '/api/public/lightning/channels-geo';
const REFRESH_INTERVAL_MS = 60_000;
const CHANNELS_GEO_REFRESH_MS = 5 * 60_000; // 5 min
const INITIAL_NETWORK_ROWS = 160;
const NETWORK_ROWS_BATCH = 180;
const NETWORK_ROWS_BATCH_DELAY_MS = 90;
const DEFER_ALL_LINES_MS = 900;
const UNKNOWN_COUNTRY_LABEL = 'Unknown region';

const UI_COLORS = {
  lightning:     '#3BA3FF',
  lightningSoft: '#6CC0FF',
  warning:       'var(--accent-warning)',
};

// Shared color ramp — 5 levels, darkest → lightest blue
const DENSITY_COLORS = ['#0A3D91', '#145BB8', '#1E78D8', '#49A5EB', '#93CCF7'];

// Fixed scale for nodes absolute (legacy – preserves original thresholds)
const NODE_DENSITY_SCALE = [
  { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: 801, legend: '> 800'  },
  { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: 201, legend: '> 200'  },
  { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: 51,  legend: '> 50'   },
  { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: 11,  legend: '> 10'   },
  { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 1,   legend: '≤ 10'   },
];

// Fallback per-capita scale (replaced dynamically)
const PERCAPITA_FALLBACK_SCALE = [
  { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: 50,    legend: '> 50 /M'  },
  { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: 20,    legend: '> 20 /M'  },
  { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: 10,    legend: '> 10 /M'  },
  { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: 5,     legend: '> 5 /M'   },
  { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 0.001, legend: '> 0 /M'   },
];

// ISO-2 → [lat, lng] geographic centroids
// Keys match row[7] countryCode from /api/v1/lightning/nodes/world
const COUNTRY_CENTROIDS = {
  US: [ 38.0,  -97.0], DE: [ 51.2,   10.4], GB: [ 54.0,   -2.0],
  FR: [ 46.2,    2.2], AU: [-25.3,  133.8], CA: [ 56.1, -106.3],
  NL: [ 52.1,    5.3], SG: [  1.4,  103.8], JP: [ 36.2,  138.2],
  BR: [-10.0,  -55.0], IT: [ 41.9,   12.6], CH: [ 46.8,    8.2],
  AT: [ 47.5,   14.6], BE: [ 50.5,    4.5], SE: [ 60.1,   18.6],
  NO: [ 60.5,    8.5], DK: [ 56.3,    9.5], FI: [ 64.0,   26.0],
  PL: [ 51.9,   19.1], CZ: [ 49.8,   15.5], ES: [ 40.5,   -3.7],
  PT: [ 39.6,   -8.0], GR: [ 39.1,   21.8], HU: [ 47.2,   19.5],
  RO: [ 45.9,   24.9], TR: [ 38.9,   35.2], UA: [ 49.0,   32.0],
  RU: [ 61.5,   90.0], CN: [ 35.9,  104.2], IN: [ 20.6,   79.0],
  KR: [ 35.9,  127.8], HK: [ 22.3,  114.2], TW: [ 23.7,  121.0],
  ID: [ -2.5,  118.0], MY: [  4.2,  108.0], TH: [ 15.9,  100.9],
  VN: [ 14.1,  108.3], PH: [ 12.9,  121.8], ZA: [-28.5,   24.7],
  NG: [ 10.0,    8.0], KE: [  0.0,   37.9], EG: [ 26.8,   30.8],
  MX: [ 23.6, -102.6], AR: [-34.0,  -64.0], CO: [  4.6,  -74.3],
  CL: [-35.7,  -71.5], VE: [  6.4,  -66.6], PE: [ -9.2,  -75.0],
  IL: [ 31.5,   34.8], AE: [ 23.4,   53.8], SA: [ 24.0,   45.0],
  IR: [ 32.0,   53.7], PK: [ 30.4,   69.3], BD: [ 23.7,   90.4],
  LK: [  7.9,   80.8], KZ: [ 48.0,   68.0], UZ: [ 41.4,   64.6],
  AZ: [ 40.3,   47.6], GE: [ 42.3,   43.4], AM: [ 40.1,   45.0],
  RS: [ 44.0,   21.0], SK: [ 48.7,   19.7], HR: [ 45.1,   15.2],
  SI: [ 46.1,   14.8], BG: [ 42.7,   25.5], LT: [ 56.0,   24.0],
  LV: [ 56.9,   24.6], EE: [ 58.6,   25.0], IS: [ 65.0,  -18.0],
  LU: [ 49.8,    6.1], MT: [ 35.9,   14.4], CY: [ 35.1,   33.4],
  NZ: [-41.5,  172.8], ZW: [-19.0,   29.2], GH: [  8.0,   -1.0],
  TZ: [ -6.4,   34.9], ET: [  9.1,   40.5], MA: [ 31.8,   -7.1],
  DZ: [ 28.0,    2.6], TN: [ 34.0,    9.0], UG: [  1.4,   32.3],
  TT: [ 10.7,  -61.2], JM: [ 18.1,  -77.3], PR: [ 18.2,  -66.6],
  PA: [  8.5,  -80.8], GT: [ 15.8,  -90.2], CR: [  9.7,  -84.2],
  EC: [ -1.8,  -78.2], BO: [-17.1,  -64.7], PY: [-23.4,  -58.4],
  UY: [-32.5,  -55.8], DO: [ 18.7,  -70.2], CU: [ 22.0,  -79.5],
  NI: [ 12.9,  -85.2], HN: [ 14.8,  -86.2], SV: [ 13.8,  -88.9],
  RW: [ -1.9,   29.9], CI: [  7.5,   -5.6], CM: [  3.9,   11.5],
  MM: [ 21.9,   95.9], NP: [ 28.4,   84.1], AF: [ 33.9,   67.7],
};

// ─── Individual node network data (for canvas view) ───────────────────────────
// Confirmed API format from /api/v1/lightning/nodes/world:
//   [0] lng  [1] lat  [2] pubkey  [3] alias  [4] capacity(sats)  [5] channels  [6] country  [7] countryCode
function parseLightningNetworkData(payloadData) {
  const rawNodes = payloadData?.nodes;
  if (!Array.isArray(rawNodes)) return { points: [], lines: [] };

  const points = [];
  rawNodes.forEach((row) => {
    if (!Array.isArray(row)) return;
    // Confirmed API format: [lng, lat, pubkey, alias, capacity, channels, country, countryCode]
    const lng = Number(row[0]);
    const lat = Number(row[1]);
    // Validate coordinates — filters out Tor nodes (no geolocation) and bad data
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    if (lat === 0 && lng === 0) return; // Null Island = unresolved location
    const capacity = Number(row[4]) || 0;
    const channels = Number(row[5]) || 0;
    const countryCode = String(row[7] || '').toUpperCase() || '?';
    const countryNameRaw = typeof row[6] === 'string'
      ? row[6].trim()
      : String(row[6]?.en || row[6]?.['pt-BR'] || Object.values(row[6] || {})[0] || '').trim();
    const countryName = countryNameRaw || ISO_COUNTRY_NAMES[countryCode] || UNKNOWN_COUNTRY_LABEL;
    // Skip nodes that show "0.00 BTC" (capacity < 500k sats) or have no channels
    if (!channels || capacity < 500_000) return;
    points.push({
      lat,
      lng,
      capacity,
      channels,
      alias:       String(row[3] || '').trim() || '—',
      countryCode,
      countryName,
      pubkey:      String(row[2] || '').trim(),
    });
  });

  // API may include pre-computed channel line segments [lat1, lng1, lat2, lng2]
  const lines = [];
  const rawLines = payloadData?.lines;
  if (Array.isArray(rawLines)) {
    rawLines.forEach((l) => {
      if (Array.isArray(l) && l.length >= 4) {
        const lat1 = Number(l[0]), lng1 = Number(l[1]);
        const lat2 = Number(l[2]), lng2 = Number(l[3]);
        if (Number.isFinite(lat1) && Number.isFinite(lng1) && Number.isFinite(lat2) && Number.isFinite(lng2)) {
          lines.push([lat1, lng1, lat2, lng2]);
        }
      }
    });
  }

  return { points, lines };
}

function getNetworkNodeMetricColor(node, metricType, scale, avgDistByPubkey) {
  const metricValue = getNetworkMetricValue(node, metricType, avgDistByPubkey);
  return getColorByScale(metricValue, scale);
}

function getNetworkNodeRadiusMetric(node, metricType, avgDistByPubkey) {
  return getNetworkMetricValue(node, metricType, avgDistByPubkey);
}

// Canvas-based Lightning Network renderer — handles thousands of nodes efficiently
function LightningNetworkCanvas({
  networkData,
  maxMetricValue,
  selectedPubkey,
  onNodeClick,
  showAllConnectionLines,
  metricType,
  nodeColorScale,
  avgDistByPubkey,
}) {
  const map = useMap();
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!map || !networkData || networkData.points.length === 0) return;

    const container = map.getContainer();

    // ── Canvas layer ──
    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:450;';
    container.appendChild(canvas);

    // ── Hover tooltip ──
    const tooltip = document.createElement('div');
    tooltip.style.cssText =
      'position:absolute;pointer-events:none;z-index:600;display:none;' +
      'background:rgba(8,8,14,0.93);border:1px solid rgba(255,255,255,0.14);' +
      'border-radius:5px;padding:7px 11px;font-family:monospace;font-size:12px;' +
      'color:rgba(255,255,255,0.88);white-space:nowrap;line-height:1.6;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.5);';
    container.appendChild(tooltip);

    const { points, lines } = networkData;
    const maxMetric = maxMetricValue || 1;
    let rafId = null;

    // Internal hover state — transient, not propagated to parent
    let hoveredPubkey = null;

    const draw = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const size = map.getSize();
        canvas.width  = size.x;
        canvas.height = size.y;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, size.x, size.y);

        const z = map.getZoom();
        // Active pubkey: pinned selection takes priority over hover
        const activePubkey = selectedPubkey || hoveredPubkey;

        // ── Connection lines — zoom-adaptive opacity & width ──
        const visibleLines = activePubkey
          ? lines.filter((l) => l.pub1 === activePubkey || l.pub2 === activePubkey)
          : (showAllConnectionLines ? lines : []);

        // Only isolate (dim others) when the active node actually has geo-visible channels.
        // If all its peers are Tor-only, don't dim — show full network to avoid confusion.
        const hasGeoChannels = activePubkey ? visibleLines.length > 0 : false;
        const connectedPubkeys = hasGeoChannels
          ? new Set(visibleLines.flatMap((l) => [l.pub1, l.pub2]))
          : null;

        if (visibleLines.length > 0) {
          const isPinned  = !!selectedPubkey;
          const lineAlpha = activePubkey ? (isPinned ? 0.65 : 0.45) : Math.min(0.55, 0.06 + z * 0.055);
          const lineWidth = activePubkey ? (isPinned ? 1.2 : 0.9) : Math.min(1.8, 0.3 + z * 0.18);
          ctx.globalAlpha = lineAlpha;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth   = lineWidth;
          visibleLines.forEach((line) => {
            const lat1 = line.lat1 ?? line[0];
            const lng1 = line.lng1 ?? line[1];
            const lat2 = line.lat2 ?? line[2];
            const lng2 = line.lng2 ?? line[3];
            try {
              const p1 = map.latLngToContainerPoint([lat1, lng1]);
              const p2 = map.latLngToContainerPoint([lat2, lng2]);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            } catch { /* skip OOB */ }
          });
        }

        // ── Node dots — zoom-adaptive radius + isolation dimming ──
        const zScale = Math.max(1, 1 + (z - 2) * 0.25);
        points.forEach((pt) => {
          try {
            const p      = map.latLngToContainerPoint([pt.lat, pt.lng]);
            const metricValue = getNetworkNodeRadiusMetric(pt, metricType, avgDistByPubkey);
            const norm   = metricValue / maxMetric;
            const baseRadius = Math.max(3, (2.4 + norm * 10.6) * zScale);
            const color  = getNetworkNodeMetricColor(pt, metricType, nodeColorScale, avgDistByPubkey);

            const isActive    = pt.pubkey === activePubkey;
            const isConnected = connectedPubkeys ? connectedPubkeys.has(pt.pubkey) : true;
            const alpha = !connectedPubkeys
              ? (norm > 0.08 ? 0.90 : 0.55)
              : isActive    ? 1.0
              : isConnected ? 0.80
              : 0.07;
            const drawRadius = isActive ? baseRadius * 1.9 : baseRadius;

            ctx.shadowBlur  = (isActive || norm > 0.08) ? drawRadius * 3.5 : 0;
            ctx.shadowColor = isActive ? '#FFFFFF' : color;
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, drawRadius, 0, Math.PI * 2);
            ctx.fill();

            // Ring — white for pinned selection, subtle for hover
            if (isActive) {
              ctx.globalAlpha = selectedPubkey ? 0.9 : 0.55;
              ctx.strokeStyle = selectedPubkey ? '#FFFFFF' : '#AADDFF';
              ctx.lineWidth   = selectedPubkey ? 1.5 : 1.0;
              ctx.shadowBlur  = 0;
              ctx.beginPath();
              ctx.arc(p.x, p.y, drawRadius + 3, 0, Math.PI * 2);
              ctx.stroke();
            }
          } catch { /* skip OOB */ }
        });

        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;
      });
    };

    // Shared hit-test helper
    const hitTest = (cp, threshold = 14) => {
      let closest = null;
      let minDist  = threshold;
      points.forEach((pt) => {
        try {
          const p = map.latLngToContainerPoint([pt.lat, pt.lng]);
          const d = Math.hypot(p.x - cp.x, p.y - cp.y);
          if (d < minDist) { minDist = d; closest = pt; }
        } catch { /* skip */ }
      });
      return closest;
    };

    // ── Hover: show tooltip + temporary connection highlight ──
    const onMapMouseMove = (e) => {
      const cp      = map.latLngToContainerPoint(e.latlng);
      const closest = hitTest(cp, 14);

      // Tooltip always updates
      if (closest) {
        const btc = (closest.capacity / 1e8).toFixed(2);
        // Count how many of this node's channels have geo-visible lines
        const geoLines = lines.filter((l) => l.pub1 === closest.pubkey || l.pub2 === closest.pubkey);
        const torHidden = closest.channels - geoLines.length;
        const torNote = torHidden > 0
          ? `<br/><span style="color:rgba(255,180,60,0.75);font-size:11px">` +
            `${torHidden === closest.channels ? '⚠ all' : torHidden} channels via Tor (no geo)</span>`
          : '';
        tooltip.innerHTML =
          `<span style="color:#fff;font-weight:bold">${closest.alias}</span>` +
          `&nbsp;<span style="color:rgba(255,255,255,0.4)">(${closest.countryCode})</span><br/>` +
          `<span style="color:#3BA3FF">${closest.channels} channels</span>` +
          `&nbsp;·&nbsp;<span style="color:#FF80AA">${btc} BTC</span>` +
          torNote;
        const tx = cp.x + 16, ty = Math.max(4, cp.y - 36);
        tooltip.style.left    = `${tx}px`;
        tooltip.style.top     = `${ty}px`;
        tooltip.style.display = 'block';
      } else {
        tooltip.style.display = 'none';
      }

      // Hover isolation — only when nothing is pinned
      if (!selectedPubkey) {
        const newHovered = closest?.pubkey ?? null;
        if (newHovered !== hoveredPubkey) {
          hoveredPubkey = newHovered;
          draw();
        }
      }
    };

    const onMapMouseOut = () => {
      tooltip.style.display = 'none';
      if (!selectedPubkey && hoveredPubkey !== null) {
        hoveredPubkey = null;
        draw();
      }
    };

    // ── Click: pin/unpin a node's connections permanently ──
    const onMapClick = (e) => {
      const cp      = map.latLngToContainerPoint(e.latlng);
      const closest = hitTest(cp, 18);
      if (onNodeClick) {
        onNodeClick((prev) => (closest ? (prev === closest.pubkey ? null : closest.pubkey) : null));
      }
    };

    // ── Debounced resize (80ms) ──
    let resizeTimer = null;
    const debouncedDraw = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(draw, 80);
    };

    draw();
    map.on('moveend zoomend', draw);
    map.on('resize',    debouncedDraw);
    map.on('mousemove', onMapMouseMove);
    map.on('mouseout',  onMapMouseOut);
    map.on('click',     onMapClick);

    cleanupRef.current = () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeTimer) clearTimeout(resizeTimer);
      map.off('moveend zoomend', draw);
      map.off('resize',    debouncedDraw);
      map.off('mousemove', onMapMouseMove);
      map.off('mouseout',  onMapMouseOut);
      map.off('click',     onMapClick);
      canvas.remove();
      tooltip.remove();
    };
    return cleanupRef.current;
  }, [map, networkData, maxMetricValue, selectedPubkey, onNodeClick, showAllConnectionLines, metricType, nodeColorScale, avgDistByPubkey]);

  return null;
}

function LeafletLayoutSync({ watchKey }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;

    const triggerInvalidate = () => {
      requestAnimationFrame(() => {
        map.invalidateSize(false);
      });
    };

    triggerInvalidate();

    const container = map.getContainer();
    if (!container || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      triggerInvalidate();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [map, watchKey]);

  return null;
}

const BTC_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// ─── Metric meta ─────────────────────────────────────────────────────────────

const METRIC_LABELS = {
  nodes:    'Node Count',
  channels: 'Channel Count',
  capacity: 'Total Capacity',
  dist:     'Avg channel distance',
};

function getNetworkMetricValue(node, metricType, avgDistByPubkey) {
  if (metricType === 'channels') return node.channels || 0;
  if (metricType === 'dist') return avgDistByPubkey[node.pubkey] || 0;
  return node.capacity || 0;
}

function getMetricRawValue(stats, metricType) {
  if (!stats) return 0;
  if (metricType === 'channels') return stats.channels || 0;
  if (metricType === 'capacity') return stats.capacity || 0;
  return stats.nodes || 0;
}

function formatMetricValue(value, metricType) {
  if (metricType === 'dist') return `${fmt.num(value)} km`;
  if (metricType === 'capacity') return formatBtcFromSats(value);
  return fmt.num(value);
}

function formatMetricValueShort(value, metricType) {
  if (metricType === 'dist') return `${fmt.num(value)} km`;
  if (metricType === 'capacity') {
    const btc = value / 100_000_000;
    if (btc >= 1000) return `${BTC_FORMATTER.format(btc / 1000)}k BTC`;
    return `${BTC_FORMATTER.format(btc)} BTC`;
  }
  return fmt.num(value);
}

function formatCompactTableValue(value, metricType) {
  const n = Number(value) || 0;
  if (metricType === 'capacity') {
    const btc = n / 100_000_000;
    return `${btc >= 100 ? BTC_FORMATTER.format(Math.round(btc)) : BTC_FORMATTER.format(Number(btc.toFixed(2)))} BTC`;
  }
  if (metricType === 'dist') {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k km`;
    return `${fmt.num(Math.round(n))} km`;
  }
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return fmt.num(Math.round(n));
}

// ─── Scale helpers ─────────────────────────────────────────────────────────────

function computeAbsoluteScale(maxVal, metricType) {
  if (!maxVal || maxVal <= 0) return NODE_DENSITY_SCALE;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude;
  const t5 = Math.max(1, Math.round(niceMax * 0.50));
  const t4 = Math.max(1, Math.round(niceMax * 0.25));
  const t3 = Math.max(1, Math.round(niceMax * 0.10));
  const t2 = Math.max(1, Math.round(niceMax * 0.05));
  const fmtV = (v) => metricType === 'capacity' ? formatBtcFromSats(v) : metricType === 'dist' ? `${fmt.num(v)} km` : fmt.num(v);
  return [
    { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: t5, legend: `> ${fmtV(t5)}` },
    { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: t4, legend: `> ${fmtV(t4)}` },
    { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: t3, legend: `> ${fmtV(t3)}` },
    { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: t2, legend: `> ${fmtV(t2)}` },
    { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 1,  legend: `> 0`           },
  ];
}

function computePerCapitaScale(maxVal, metricType) {
  if (!maxVal || maxVal <= 0) return PERCAPITA_FALLBACK_SCALE;
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const niceMax = Math.ceil(maxVal / magnitude) * magnitude;
  const t4 = Math.max(0.001, parseFloat((niceMax * 0.50).toPrecision(2)));
  const t3 = Math.max(0.001, parseFloat((niceMax * 0.25).toPrecision(2)));
  const t2 = Math.max(0.001, parseFloat((niceMax * 0.10).toPrecision(2)));
  const t1 = Math.max(0.001, parseFloat((niceMax * 0.05).toPrecision(2)));
  const fmtLegend = (v) =>
    metricType === 'capacity'
      ? `> ${BTC_FORMATTER.format(v)} BTC /M`
      : `> ${v} /M`;
  return [
    { key: 'very-high', label: 'Very High', color: DENSITY_COLORS[0], minVal: t4,    legend: fmtLegend(t4) },
    { key: 'high',      label: 'High',      color: DENSITY_COLORS[1], minVal: t3,    legend: fmtLegend(t3) },
    { key: 'mid',       label: 'Medium',    color: DENSITY_COLORS[2], minVal: t2,    legend: fmtLegend(t2) },
    { key: 'low',       label: 'Low',       color: DENSITY_COLORS[3], minVal: t1,    legend: fmtLegend(t1) },
    { key: 'trace',     label: 'Minimal',  color: DENSITY_COLORS[4], minVal: 0.001, legend: metricType === 'capacity' ? '> 0 BTC /M' : '> 0 /M' },
  ];
}

function getColorByScale(value, scale) {
  const v = Number(value) || 0;
  if (v <= 0) return '#141414';
  return (scale.find((s) => v >= s.minVal) || {}).color || scale[scale.length - 1].color || '#141414';
}

// Legacy helpers kept for fixed-scale nodes path
function getDensityStepByCount(count) {
  const v = Number(count) || 0;
  return NODE_DENSITY_SCALE.find((s) => v >= s.minVal) || null;
}
function getFillColorNodes(count) {
  const v = Number(count) || 0;
  if (v <= 0) return '#141414';
  return getDensityStepByCount(v)?.color || '#141414';
}
function getDensityLabel(count) {
  return getDensityStepByCount(count)?.label || 'No data';
}

function formatPerCapitaValue(value, metricType) {
  const n = Number(value);
  if (metricType === 'capacity') {
    if (!Number.isFinite(n) || n <= 0) return '0.00 BTC /M';
    return `${BTC_FORMATTER.format(n)} BTC /M`;
  }
  if (!Number.isFinite(n) || n <= 0) return '0.0 /M';
  return n >= 10 ? `${n.toFixed(1)} /M` : `${n.toFixed(2)} /M`;
}

function formatBtcFromSats(value) {
  const sats = Number(value);
  if (!Number.isFinite(sats) || sats <= 0) return '0 BTC';
  return `${BTC_FORMATTER.format(sats / 100_000_000)} BTC`;
}

function formatNextUpdateDelay(nextUpdateMs) {
  if (!Number.isFinite(nextUpdateMs)) return 'N/A';
  const diffMs = nextUpdateMs - Date.now();
  if (diffMs <= 0) return 'now';
  const minutes = Math.ceil(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.ceil(minutes / 60)} h`;
}

// Bubble radius — log scale so small countries stay visible
function getBubbleRadius(value, maxValue) {
  if (!value || !maxValue) return 0;
  const normalized = Math.log1p(value) / Math.log1p(maxValue);
  return Math.max(4, Math.round(normalized * 32));
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad, dLng = (lng2 - lng1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseLightningCountryCounts(payload) {
  const nodes = payload?.nodes;
  if (!Array.isArray(nodes)) return [];
  const map = new Map();
  nodes.forEach((row) => {
    if (!Array.isArray(row)) return;
    const capacity = Number(row[4]);
    const channels = Number(row[5]);
    const countryMeta = row[6];
    const countryCodeRaw = String(row[7] || '').toUpperCase();
    const countryCode = /^[A-Z]{2}$/.test(countryCodeRaw) ? countryCodeRaw : '';
    const countryName = typeof countryMeta === 'string'
      ? countryMeta.trim()
      : (
        String(countryMeta?.en || '').trim()
        || String(countryMeta?.['pt-BR'] || '').trim()
        || String(Object.values(countryMeta || {})[0] || '').trim()
      );
    const normalizedName = normalizeCountryName(countryName);
    const key = countryCode || normalizedName || 'UNKNOWN';
    const existing = map.get(key) || { country_code: countryCode, country_name: countryName, nodes: 0, channels: 0, capacity: 0 };
    existing.country_code  = existing.country_code  || countryCode;
    existing.country_name  = existing.country_name  || countryName;
    existing.nodes    += 1;
    existing.channels += Number.isFinite(channels) && channels > 0 ? channels : 0;
    existing.capacity += Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
    map.set(key, existing);
  });
  return [...map.values()].sort((a, b) => b.nodes - a.nodes);
}

export default function S07_LightningNodesMap() {
  const [payload,              setPayload]              = useState(null);
  const [apiLoading,           setApiLoading]           = useState(true);
  const [error,                setError]                = useState(null);
  const [isBreakdownExpanded,  setIsBreakdownExpanded]  = useState(false);
  const [isMetaExpanded,       setIsMetaExpanded]       = useState(false);
  const [isDensityExpanded,    setIsDensityExpanded]    = useState(false);
  // Feature A — metric selector
  const [metricType,           setMetricType]           = useState('nodes');      // 'nodes'|'channels'|'capacity'
  const [isAbsolute,           setIsAbsolute]           = useState(true);         // true=absolute, false=per-capita
  // Feature B — layer mode
  const [layerMode,            setLayerMode]            = useState('choropleth'); // 'choropleth'|'bubble'
  const [channelsGeoLines,     setChannelsGeoLines]     = useState([]);           // parsed line segments for canvas
  const [showAllConnectionLines, setShowAllConnectionLines] = useState(true);
  const [canRenderAllConnectionLines, setCanRenderAllConnectionLines] = useState(false);
  const [visibleNetworkNodeCount, setVisibleNetworkNodeCount] = useState(INITIAL_NETWORK_ROWS);
  const [selectedPubkey,       setSelectedPubkey]       = useState(null);         // click-isolated node pubkey
  const [expandedCountries,    setExpandedCountries]    = useState(new Set());    // expanded country groups in network sidebar
  const [networkSortCol,       setNetworkSortCol]       = useState('capacity');   // 'capacity'|'channels'|'alias'|'dist'
  const [networkSortDir,       setNetworkSortDir]       = useState('desc');       // 'desc'|'asc'
  const [nowTs,                setNowTs]                = useState(() => Date.now());

  const isCompactViewport = useCompactViewport();
  const { data: countriesGeo, loading: geoLoading, error: geoError } = useCountriesGeoJson();
  const { populationMap, popDataYear, popSource, popLastFetched } = useWorldBankPopulation();

  useEffect(() => {
    if (isCompactViewport) setIsDensityExpanded(false);
  }, [isCompactViewport]);

  // Clear pinned selection when leaving network mode
  useEffect(() => {
    if (layerMode !== 'bubble') setSelectedPubkey(null);
  }, [layerMode]);

  useEffect(() => {
    if (layerMode === 'bubble' && metricType === 'nodes') {
      setMetricType('channels');
    }
  }, [layerMode, metricType]);

  useEffect(() => {
    if (layerMode !== 'bubble') {
      setCanRenderAllConnectionLines(false);
      return undefined;
    }

    setCanRenderAllConnectionLines(false);
    const timer = setTimeout(() => {
      setCanRenderAllConnectionLines(true);
    }, DEFER_ALL_LINES_MS);

    return () => clearTimeout(timer);
  }, [layerMode, channelsGeoLines.length, metricType]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(LIGHTNING_WORLD_ENDPOINT);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        const json = p?.data || p;
        if (!active) return;
        setPayload({
          source_provider: p?.source_provider || 'mempool.space',
          fetched_at: p?.updated_at ? new Date(p.updated_at).getTime() : Date.now(),
          data: json,
        });
        setError(null);
      } catch {
        if (!active) return;
        setError('Could not load the Lightning nodes API.');
      } finally {
        if (active) setApiLoading(false);
      }
    };
    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (geoError) setError((prev) => prev || geoError);
  }, [geoError]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch channel connection lines (only when Network mode is active)
  useEffect(() => {
    if (layerMode !== 'bubble') return;
    let active = true;
    const load = async () => {
      try {
        const res  = await fetch(LIGHTNING_CHANNELS_GEO_ENDPOINT);
        if (!res.ok) return;
        const body = await res.json();
        // Server wraps in { data: [...] } or returns array directly
        const raw  = Array.isArray(body) ? body : (body?.data ?? []);
        if (!active) return;
        // Response format: [pubkey1, alias1, lng1, lat1, pubkey2, alias2, lng2, lat2]
        const lines = [];
        raw.forEach((r) => {
          if (!Array.isArray(r) || r.length < 8) return;
          const lng1 = Number(r[2]), lat1 = Number(r[3]);
          const lng2 = Number(r[6]), lat2 = Number(r[7]);
          if (!Number.isFinite(lat1) || !Number.isFinite(lng1)) return;
          if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) return;
          lines.push({ lat1, lng1, lat2, lng2, pub1: String(r[0]).trim(), pub2: String(r[4]).trim() });
        });
        setChannelsGeoLines(lines);
      } catch { /* non-blocking */ }
    };
    load();
    const timer = setInterval(load, CHANNELS_GEO_REFRESH_MS);
    return () => { active = false; clearInterval(timer); };
  }, [layerMode]);

  const nextUpdateDelay = useMemo(
    () => formatNextUpdateDelay((payload?.fetched_at || nowTs) + REFRESH_INTERVAL_MS),
    [payload?.fetched_at, nowTs],
  );
  const sourceProviderLabel = payload?.source_provider || 'mempool.space';
  const showBreakdownPanel  = !isCompactViewport || isBreakdownExpanded;
  const showDensityLegend   = !isCompactViewport || isDensityExpanded;

  // ── GeoJSON lookup maps (main thread — only run on geo load, not on every data refresh) ──
  const featureCodeByName = useMemo(() => {
    const map = {};
    const features = countriesGeo?.features;
    if (!Array.isArray(features)) return map;
    features.forEach((feature, idx) => {
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (!code) return;
      const normalized = normalizeCountryName(name);
      if (normalized) map[normalized] = code;
    });
    return map;
  }, [countriesGeo]);

  const featureNameByCode = useMemo(() => {
    const map = {};
    const features = countriesGeo?.features;
    if (!Array.isArray(features)) return map;
    features.forEach((feature, idx) => {
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (code) map[code] = name;
    });
    return map;
  }, [countriesGeo]);

  // ── Worker-derived state — replaces the 8 heavy useMemo calls ──────────────
  const EMPTY_WORKER_RESULT = {
    networkPoints:        [],
    resolvedCountryRows:  [],
    metricRows:           [],
    statsByCode:          {},
    totals:               { nodes: 0, channels: 0, capacity: 0 },
    perCapitaByCode:      {},
    maxAbsoluteByMetric:  { nodes: 0, channels: 0, capacity: 0 },
    maxPerCapitaByMetric: { nodes: 0, channels: 0, capacity: 0 },
    avgDistByPubkey:      {},
    networkMaxByMetric:   { channels: 0, capacity: 0, dist: 0 },
  };
  const [workerResult, setWorkerResult] = useState(EMPTY_WORKER_RESULT);
  const workerRef = useRef(null);

  const handleWorkerMessage = useCallback((event) => {
    const msg = event.data;
    if (msg.type === 'RESULT') {
      setWorkerResult(msg);
    }
    // ERROR: silently keep previous result so the map stays visible
  }, []);

  // Create worker once — Vite ?worker import ensures correct bundling in dev + prod
  useEffect(() => {
    const worker = new S07Worker();
    worker.addEventListener('message', handleWorkerMessage);
    workerRef.current = worker;
    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, [handleWorkerMessage]);

  // Dispatch to worker whenever inputs change
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !payload?.data) return;
    worker.postMessage({
      type: 'PROCESS',
      payload: payload.data,
      channelsGeoLines,
      populationMap,
      featureCodeByName,
      featureNameByCode,
    });
  }, [payload?.data, channelsGeoLines, populationMap, featureCodeByName, featureNameByCode]);

  // Destructure worker result into the same variable names the rest of the component expects
  const {
    networkPoints,
    resolvedCountryRows,
    metricRows,
    statsByCode,
    totals,
    perCapitaByCode,
    maxAbsoluteByMetric,
    maxPerCapitaByMetric,
    avgDistByPubkey,
    networkMaxByMetric,
  } = workerResult;

  // networkData keeps the same shape { points, lines } as before
  const networkData = useMemo(
    () => ({ points: networkPoints, lines: channelsGeoLines }),
    [networkPoints, channelsGeoLines],
  );

  const networkScale = useMemo(() => {
    const networkMetric = metricType === 'nodes' ? 'channels' : metricType;
    return computeAbsoluteScale(networkMaxByMetric[networkMetric] || 0, networkMetric);
  }, [metricType, networkMaxByMetric]);

  // Active scale for current metricType + isAbsolute combo
  const activeScale = useMemo(() => {
    if (layerMode === 'bubble') return networkScale;
    if (isAbsolute) {
      if (metricType === 'nodes') return NODE_DENSITY_SCALE;
      return computeAbsoluteScale(maxAbsoluteByMetric[metricType] || 0, metricType);
    }
    return computePerCapitaScale(maxPerCapitaByMetric[metricType] || 0, metricType);
  }, [layerMode, networkScale, isAbsolute, metricType, maxAbsoluteByMetric, maxPerCapitaByMetric]);

  const maxMetricValue = layerMode === 'bubble'
    ? (networkMaxByMetric[metricType === 'nodes' ? 'channels' : metricType] || 0)
    : isAbsolute
      ? (maxAbsoluteByMetric[metricType] || 0)
      : (maxPerCapitaByMetric[metricType] || 0);

  // Grouped network nodes by country (for sidebar in network mode)
  const groupedNetworkNodes = useMemo(() => {
    if (layerMode !== 'bubble') return null;
    const sortKey = metricType === 'capacity' ? 'capacity' : 'channels';
    const groups = new Map();
    networkData.points.forEach((pt) => {
      const cc = pt.countryCode || '?';
      if (!groups.has(cc)) groups.set(cc, []);
      groups.get(cc).push(pt);
    });
    const groupArr = [...groups.entries()].map(([cc, nodes]) => ({
      countryCode: cc,
      nodes: [...nodes].sort((a, b) => b[sortKey] - a[sortKey]),
      totalChannels: nodes.reduce((s, n) => s + n.channels, 0),
      totalCapacity: nodes.reduce((s, n) => s + n.capacity, 0),
    }));
    if (metricType === 'capacity') {
      groupArr.sort((a, b) => b.totalCapacity - a.totalCapacity);
    } else {
      groupArr.sort((a, b) => b.totalChannels - a.totalChannels);
    }
    return groupArr;
  }, [layerMode, networkData.points, metricType]);

  const toggleCountry = (cc) =>
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      next.has(cc) ? next.delete(cc) : next.add(cc);
      return next;
    });

  // Flat sorted node list for network mode
  const sortedNetworkNodes = useMemo(() => {
    if (layerMode !== 'bubble') return [];
    return [...networkData.points].sort((a, b) => {
      let va, vb;
      switch (networkSortCol) {
        case 'country':  va = a.countryName.toLowerCase();       vb = b.countryName.toLowerCase();       break;
        case 'alias':    va = a.alias.toLowerCase();             vb = b.alias.toLowerCase();             break;
        case 'channels': va = a.channels;                       vb = b.channels;                        break;
        case 'dist':     va = avgDistByPubkey[a.pubkey] ?? -1;  vb = avgDistByPubkey[b.pubkey] ?? -1;   break;
        default:         va = a.capacity;                       vb = b.capacity;
      }
      if (networkSortDir === 'asc') return va > vb ? 1 : va < vb ? -1 : 0;
      return va < vb ? 1 : va > vb ? -1 : 0;
    });
  }, [layerMode, networkData.points, networkSortCol, networkSortDir, avgDistByPubkey]);

  useEffect(() => {
    if (layerMode !== 'bubble') return undefined;

    setVisibleNetworkNodeCount(INITIAL_NETWORK_ROWS);
    if (sortedNetworkNodes.length <= INITIAL_NETWORK_ROWS) return undefined;

    let cancelled = false;
    let timer = null;

    const pump = () => {
      timer = setTimeout(() => {
        if (cancelled) return;
        setVisibleNetworkNodeCount((current) => {
          const next = Math.min(sortedNetworkNodes.length, current + NETWORK_ROWS_BATCH);
          if (next < sortedNetworkNodes.length) pump();
          return next;
        });
      }, NETWORK_ROWS_BATCH_DELAY_MS);
    };

    pump();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [layerMode, sortedNetworkNodes, metricType, networkSortCol, networkSortDir]);

  const visibleNetworkNodes = useMemo(
    () => sortedNetworkNodes.slice(0, visibleNetworkNodeCount),
    [sortedNetworkNodes, visibleNetworkNodeCount],
  );

  const remainingNetworkNodes = Math.max(0, sortedNetworkNodes.length - visibleNetworkNodes.length);

  const handleNetworkSort = (col) => {
    if (networkSortCol === col) setNetworkSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setNetworkSortCol(col); setNetworkSortDir('desc'); }
  };

  const handleMetricTypeChange = (value) => {
    setMetricType(value);
    if (layerMode === 'bubble' && ['channels', 'capacity', 'dist'].includes(value)) {
      setNetworkSortCol(value);
      setNetworkSortDir('desc');
    }
  };

  // Breakdown list sorted by active metric
  const displayRows = useMemo(() => {
    if (isAbsolute) {
      return [...resolvedCountryRows].sort((a, b) => {
        return getMetricRawValue(b, metricType) - getMetricRawValue(a, metricType);
      });
    }
    return resolvedCountryRows
      .filter((row) => /^[A-Z]{2}$/.test(row.country_code_resolved) && populationMap[row.country_code_resolved] != null)
      .map((row) => {
        const pc = perCapitaByCode[row.country_code_resolved];
        const pcVal = pc
          ? (metricType === 'nodes' ? pc.nodes : metricType === 'channels' ? pc.channels : pc.capacity)
          : 0;
        return { ...row, perCapitaActive: pcVal };
      })
      .sort((a, b) => b.perCapitaActive - a.perCapitaActive);
  }, [resolvedCountryRows, isAbsolute, metricType, populationMap, perCapitaByCode]);

  const maxChannels        = Number(payload?.data?.maxChannels)  || 0;
  const maxLiquidity       = Number(payload?.data?.maxLiquidity) || 0;
  const avgChannelsPerNode = totals.nodes > 0 ? totals.channels / totals.nodes : 0;
  const hasCountryData     = countryCounts.length > 0;
  const isLoading          = (!hasCountryData && apiLoading) || (!hasCountryData && geoLoading);
  const isMapLoading       = (!payload && apiLoading) || (!countriesGeo && geoLoading);

  // ── Helpers used inside JSX ───────────────────────────────────────────────

  function getFeatureFillColor(code) {
    if (isAbsolute) {
      const val = getMetricRawValue(statsByCode[code], metricType);
      return metricType === 'nodes' ? getFillColorNodes(val) : getColorByScale(val, activeScale);
    }
    const pc = perCapitaByCode[code];
    if (!pc) return '#141414';
    const val = metricType === 'nodes' ? pc.nodes : metricType === 'channels' ? pc.channels : pc.capacity;
    return getColorByScale(val, activeScale);
  }

  function buildTooltipText(code, name) {
    const stats = statsByCode[code] || { nodes: 0, channels: 0, capacity: 0 };
    const display = code && code !== '-99' ? code : UNKNOWN_COUNTRY_LABEL;
    if (!isAbsolute) {
      const pc = perCapitaByCode[code];
      const pcVal = pc ? (metricType === 'nodes' ? pc.nodes : metricType === 'channels' ? pc.channels : pc.capacity) : null;
      if (pcVal == null || pcVal <= 0) return `${name} (${display}): no per-capita data`;
      const step = activeScale.find((s) => pcVal >= s.minVal);
      return `${name} (${display}): ${formatPerCapitaValue(pcVal, metricType)} — ${METRIC_LABELS[metricType]} per capita — ${step?.label ?? 'Minimal'}`;
    }
    if (metricType === 'nodes') {
      return `${name} (${display}): ${fmt.num(stats.nodes)} nodes — ${fmt.num(stats.channels)} ch — ${formatBtcFromSats(stats.capacity)} — ${getDensityLabel(stats.nodes)}`;
    }
    if (metricType === 'channels') {
      const step = activeScale.find((s) => stats.channels >= s.minVal);
      return `${name} (${display}): ${fmt.num(stats.channels)} channels — ${fmt.num(stats.nodes)} nodes — ${step?.label ?? 'Minimal'}`;
    }
    const step = activeScale.find((s) => stats.capacity >= s.minVal);
    return `${name} (${display}): ${formatBtcFromSats(stats.capacity)} — ${fmt.num(stats.nodes)} nodes — ${step?.label ?? 'Minimal'}`;
  }

  // GeoJSON key: forces re-render when metric/mode changes
  const geoJsonKey = `s07-${metricType}-${isAbsolute ? 'abs' : 'pc'}-${layerMode}-${maxMetricValue}-${countryCounts.length}`;

  // Legend title
  const legendTitle = layerMode === 'bubble'
    ? metricType === 'capacity'
      ? 'Capacity Concentration'
      : metricType === 'dist'
        ? 'Avg channel distance'
        : 'Channel Concentration'
    : !isAbsolute
    ? `${METRIC_LABELS[metricType]} per capita`
    : metricType === 'nodes'    ? 'Node Concentration'
    : metricType === 'channels' ? 'Channel Concentration'
    :                             'Capacity Concentration';

  return (
    <div className="visual-integrity-lock flex h-full w-full flex-col bg-[#111111] lg:flex-row">

      {/* ══ MAP SURFACE ══════════════════════════════════════════════════════ */}
      <div className="visual-map-surface relative h-[50dvh] min-h-[280px] min-w-0 flex-none sm:min-h-[320px] lg:h-auto lg:min-h-0 lg:flex-1">
        {isMapLoading ? (
          <div className="h-full w-full p-6">
            <div className="skeleton h-full w-full rounded-md" />
          </div>
        ) : !countryCounts.length ? (
          <div className="flex h-full w-full items-center justify-center p-6">
            <div className="max-w-[520px] rounded border border-white/10 bg-[#151515] px-4 py-4 font-mono text-[12px] text-white/70">
              <div>No country data available from the Lightning API.</div>
              <div className="mt-2 text-white/45">
                Next update: {nextUpdateDelay === 'N/A' ? 'N/A' : nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`}
              </div>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[20, 10]}
            zoom={2}
            minZoom={1}
            keyboard={false}
            style={{ height: '100%', width: '100%', background: '#101010' }}
            zoomControl={false}
            attributionControl={false}
            worldCopyJump
          >
            <LeafletLayoutSync watchKey={`${layerMode}-${isCompactViewport}-${metricType}-${selectedPubkey ? 'selected' : 'idle'}`} />

            {/* ── World outline base layer (network mode: dark fill + borders) ── */}
            {layerMode === 'bubble' && countriesGeo && (
              <GeoJSON
                key="s07-base-outline"
                data={countriesGeo}
                style={() => ({ color: '#2a2a2a', weight: 0.6, fillColor: '#161620', fillOpacity: 0.85 })}
              />
            )}

            {/* ── Choropleth layer ── */}
            {layerMode === 'choropleth' && countriesGeo && (
              <GeoJSON
                key={geoJsonKey}
                data={countriesGeo}
                style={(feature) => {
                  const code = getFeatureCountryCode(feature);
                  return { color: '#2d2d2d', weight: 0.7, fillColor: getFeatureFillColor(code), fillOpacity: 0.9 };
                }}
                onEachFeature={(feature, layer) => {
                  const code = getFeatureCountryCode(feature);
                  const name = getFeatureCountryName(feature, 0);
                  layer.bindTooltip(buildTooltipText(code, name), { sticky: true, opacity: 0.95 });
                }}
              />
            )}

            {/* ── Network layer (canvas — individual nodes with real lat/lng) ── */}
            {layerMode === 'bubble' && (
              <LightningNetworkCanvas
                networkData={networkData}
                maxMetricValue={maxMetricValue}
                selectedPubkey={selectedPubkey}
                onNodeClick={setSelectedPubkey}
                showAllConnectionLines={showAllConnectionLines && canRenderAllConnectionLines}
                metricType={metricType}
                nodeColorScale={activeScale}
                avgDistByPubkey={avgDistByPubkey}
              />
            )}
          </MapContainer>
        )}

        {/* ── Bottom badge ── */}
        <div className="visual-integrity-lock absolute bottom-2 left-1/2 z-[1000] -translate-x-1/2 rounded-md border border-white/10 bg-[#080808]/92 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm sm:bottom-5 sm:px-5 sm:py-2 sm:text-[12px]">
          {isLoading ? (
            <div className="skeleton" style={{ width: 190, height: '0.95em' }} />
          ) : (
            <>
              <span className="text-white/60">
                {isAbsolute ? METRIC_LABELS[metricType] : `${METRIC_LABELS[metricType]} /M`}
                {layerMode === 'bubble' ? ' · Network' : ''}:{' '}
              </span>
              <span className="font-bold text-white">
                {(layerMode === 'bubble' && metricType === 'dist')
                  ? formatMetricValueShort(maxMetricValue, metricType)
                  : isAbsolute
                    ? formatMetricValueShort(totals[metricType === 'capacity' ? 'capacity' : metricType], metricType)
                    : 'per-capita view'
                }
              </span>
            </>
          )}
        </div>

        {/* ── Map overlays: legend + bubble toggle ── */}
        {!isMapLoading && countryCounts.length > 0 && (
          <>
            {/* Compact: density expand button */}
            {isCompactViewport && (
              <button
                type="button"
                onClick={() => setIsDensityExpanded((prev) => !prev)}
                className="visual-integrity-lock absolute left-3 top-3 z-[1001] min-h-[40px] rounded border border-white/15 bg-[#080808]/90 px-3 py-2 font-mono text-[12px] text-white/80 backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                aria-expanded={showDensityLegend}
                aria-controls="s07-density-legend"
                aria-label={showDensityLegend ? 'Hide Legend' : 'Show Legend'}
              >
                {showDensityLegend ? 'Hide Legend' : 'Show Legend'}
              </button>
            )}

            {/* Grouped container: density legend + bubble toggle */}
            <div
              className={`visual-integrity-lock absolute z-[1000] flex flex-col gap-1.5 ${
                isCompactViewport ? 'left-3 top-14' : 'left-3 top-3 sm:left-4 sm:top-4'
              }`}
            >
              {/* Density legend */}
              {showDensityLegend && (
                <div
                  id="s07-density-legend"
                  className="max-w-[calc(100vw-1.5rem)] rounded border border-white/15 bg-[#080808]/92 px-3 py-2.5 font-mono text-[12px] backdrop-blur-sm"
                >
                  <div className="mb-1 text-[12px] text-white/85">{legendTitle}</div>
                  {!isAbsolute && (
                    <div className="mb-1.5 text-[11px] text-white/45">Per 1M people</div>
                  )}
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {activeScale.map((step) => (
                      <span key={step.key} className="inline-flex min-w-0 items-center gap-2 text-white/80">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ background: step.color, boxShadow: `0 0 6px ${step.color}` }}
                        />
                        <span className="text-[11px] text-white/82">{step.label}</span>
                        <span className="min-w-0 text-[11px] text-white/55">{step.legend}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {layerMode === 'bubble' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAllConnectionLines((prev) => {
                      const next = !prev;
                      if (next) setCanRenderAllConnectionLines(true);
                      return next;
                    });
                  }}
                  className="visual-integrity-lock self-start rounded border border-white/15 bg-[#080808]/90 px-3 py-1.5 font-mono text-[12px] text-white/75 backdrop-blur-sm transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                  style={{ color: showAllConnectionLines ? 'rgba(255,255,255,0.75)' : UI_COLORS.lightning }}
                  title={showAllConnectionLines ? 'Hide background connection lines' : 'Show background connection lines'}
                >
                  {showAllConnectionLines
                    ? (canRenderAllConnectionLines ? 'Hide all lines' : 'Loading all lines...')
                    : 'Show all lines'}
                </button>
              )}

              {/* Bubble/Choropleth toggle */}
              <button
                type="button"
                onClick={() => setLayerMode((m) => m === 'choropleth' ? 'bubble' : 'choropleth')}
                className="visual-integrity-lock self-start rounded border border-white/15 bg-[#080808]/90 px-3 py-1.5 font-mono text-[12px] backdrop-blur-sm transition hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                style={{ color: layerMode === 'bubble' ? UI_COLORS.lightning : 'rgba(255,255,255,0.70)' }}
                title={layerMode === 'choropleth' ? 'Show Network View' : 'Show Heatmap View'}
              >
                {layerMode === 'choropleth' ? 'Network View' : 'Heatmap View'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ══ ASIDE PANEL ══════════════════════════════════════════════════════ */}
      <aside className={`visual-integrity-lock relative flex h-[50dvh] min-h-0 w-full flex-none flex-col overflow-hidden border-t border-white/10 bg-[#111111] lg:h-auto lg:border-l lg:border-t-0 ${layerMode === 'bubble' ? 'lg:w-[560px] xl:w-[620px]' : 'lg:w-[320px]'}`}>

        {layerMode === 'choropleth' && (
          <>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[12px] tracking-wide text-white/60">
              Global Lightning Network
              <button
                type="button"
                onClick={() => setIsMetaExpanded((prev) => !prev)}
                className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] transition hover:border-white/25 hover:bg-white/[0.06]"
                aria-label="Data Info"
                aria-expanded={isMetaExpanded}
                aria-controls="s07-meta-panel"
              >
                <Info size={13} style={{ color: isMetaExpanded ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.55)' }} />
              </button>
            </div>

            <div className="border-b border-white/10 px-3 py-2">
              {isCompactViewport && (
                <button
                  type="button"
                  onClick={() => setIsBreakdownExpanded((prev) => !prev)}
                  className="flex min-h-[44px] w-full items-center justify-between rounded border border-white/10 bg-white/[0.02] px-3 py-2 text-left font-mono text-[12px] text-white/70 transition hover:border-white/20"
                  aria-expanded={showBreakdownPanel}
                  aria-controls="s07-breakdown-panel"
                >
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.08em] text-white/45">Network Summary</span>
                    <span className="block truncate text-[12px] text-white/78">{fmt.num(totals.nodes)} nodes without Tor</span>
                  </span>
                  <span style={{ color: UI_COLORS.lightning }}>{isBreakdownExpanded ? 'Hide' : 'View'}</span>
                </button>
              )}
              {showBreakdownPanel && (
                <div id="s07-breakdown-panel" className={`${isCompactViewport ? 'mt-2' : ''} grid grid-cols-2 gap-1.5 font-mono text-[12px]`}>
                  <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                      <div className="text-white/50">Nodes</div>
                    <div className="text-white/85">{fmt.num(totals.nodes)}</div>
                  </div>
                  <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                      <div className="text-white/50">Channels</div>
                    <div className="text-white/85">{fmt.num(totals.channels)}</div>
                  </div>
                  <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                      <div className="text-white/50">Capacity</div>
                    <div className="text-white/85">{formatBtcFromSats(totals.capacity)}</div>
                  </div>
                  <div className="rounded border border-white/10 bg-white/[0.02] px-2 py-1">
                      <div className="text-white/50">Avg ch/node</div>
                    <div className="text-white/85">{avgChannelsPerNode.toFixed(1)}</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Feature A: Metric selector — adapts to layerMode ── */}
        <div className="border-b border-white/10 px-3 py-2">
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-white/45">Table Metric</div>
          <div className="flex items-center gap-1">
            {/* Dropdown */}
            <div className="relative min-w-0 flex-1">
              <select
                value={metricType}
                onChange={(e) => handleMetricTypeChange(e.target.value)}
                name="s07MetricType"
                aria-label="Select map metric"
                className="w-full appearance-none rounded border border-white/15 py-2 pl-3 pr-8 font-mono text-[12px] transition hover:border-white/25 focus:outline-none focus:border-white/30 focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                style={{
                  cursor: 'pointer',
                  background: '#1a1a24',
                  color: 'rgba(255,255,255,0.85)',
                  accentColor: UI_COLORS.lightning,
                  colorScheme: 'dark',
                }}
              >
                {layerMode === 'bubble' ? (
                  <>
                    <option value="channels" style={{ background: '#1a1a24' }}>By Channels</option>
                    <option value="capacity" style={{ background: '#1a1a24' }}>By Capacity</option>
                    <option value="dist" style={{ background: '#1a1a24' }}>Avg channel distance</option>
                  </>
                ) : (
                  <>
                    <option value="nodes"    style={{ background: '#1a1a24' }}>Node Count</option>
                    <option value="channels" style={{ background: '#1a1a24' }}>Channel Count</option>
                    <option value="capacity" style={{ background: '#1a1a24' }}>Total Capacity</option>
                  </>
                )}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40">▼</span>
            </div>
            {/* Abs / /M — choropleth only */}
            {layerMode !== 'bubble' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAbsolute(true)}
                  aria-pressed={isAbsolute}
                  className="flex-none rounded border px-2.5 py-2 font-mono text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                  style={isAbsolute
                    ? { borderColor: UI_COLORS.lightning, color: UI_COLORS.lightning, backgroundColor: 'rgba(59,163,255,0.1)' }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }}
                >
                  Absolute
                </button>
                <button
                  type="button"
                  onClick={() => setIsAbsolute(false)}
                  aria-pressed={!isAbsolute}
                  className="flex-none rounded border px-2.5 py-2 font-mono text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BA3FF]/60"
                  style={!isAbsolute
                    ? { borderColor: UI_COLORS.lightning, color: UI_COLORS.lightning, backgroundColor: 'rgba(59,163,255,0.1)' }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }}
                >
                  Per 1M
                </button>
              </>
            )}
          </div>
        </div>

        {/* Breakdown list — nodes in Network mode, countries in Choropleth mode */}
        <div className="scrollbar-hidden-mobile min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton h-6 w-full rounded" />
              ))}
            </div>
          ) : layerMode === 'bubble' ? (
            /* ── Network mode: tabla plana con cabeceras ordenables ── */
            <div className="w-full font-mono">
              {remainingNetworkNodes > 0 && (
                <div className="mb-2 rounded border border-white/8 bg-white/[0.02] px-2.5 py-2 text-[11px] text-white/55">
                  Showing {fmt.num(visibleNetworkNodes.length)} of {fmt.num(sortedNetworkNodes.length)} nodes. Loading the rest in the background...
                </div>
              )}
              {isCompactViewport ? (
                <div className="space-y-2">
                  {visibleNetworkNodes.map((node, i) => {
                    const color = getNetworkNodeMetricColor(node, metricType, activeScale, avgDistByPubkey);
                    const isNodeSelected = node.pubkey === selectedPubkey;
                    const avgDist = avgDistByPubkey[node.pubkey];
                    return (
                      <button
                        key={`${node.pubkey || node.alias}-${i}`}
                        type="button"
                        onClick={() => setSelectedPubkey((p) => (p === node.pubkey ? null : node.pubkey))}
                        className="w-full rounded-md border px-3 py-2 text-left transition hover:bg-white/[0.04]"
                        style={{
                          background: isNodeSelected ? 'rgba(59,163,255,0.08)' : 'rgba(255,255,255,0.02)',
                          borderColor: isNodeSelected ? 'rgba(59,163,255,0.45)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-1 inline-block h-2.5 w-2.5 flex-none rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                          <div className="min-w-0 flex-1">
                            <div className="break-words text-[12px] leading-5 text-white" title={node.alias}>{node.alias}</div>
                            <div className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-white/48" title={node.countryName}>{node.countryName}</div>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded border border-white/8 bg-white/[0.02] px-2 py-1">
                            <div className="text-white/38">Channels</div>
                            <div className="mt-0.5 tabular-nums" style={{ color: UI_COLORS.lightning }}>{formatCompactTableValue(node.channels, 'channels')}</div>
                          </div>
                          <div className="rounded border border-white/8 bg-white/[0.02] px-2 py-1">
                            <div className="text-white/38">Capacity</div>
                            <div className="mt-0.5 tabular-nums" style={{ color: '#FF80AA' }}>{formatCompactTableValue(node.capacity, 'capacity')}</div>
                          </div>
                          <div className="rounded border border-white/8 bg-white/[0.02] px-2 py-1">
                            <div className="text-white/38">Distance</div>
                            <div className="mt-0.5 tabular-nums text-white/62">{avgDist != null ? formatCompactTableValue(avgDist, 'dist') : '—'}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <div className="sticky top-0 z-10 mb-1 grid grid-cols-[10px_112px_minmax(220px,1.8fr)_92px_108px_96px] gap-x-3 border-b border-white/[0.07] pb-1.5" style={{ background: '#111111' }}>
                    <span />
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('country')}
                      title="Sort by country"
                      className="flex items-center gap-1 text-left text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'country' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      {networkSortCol === 'country' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'} Country
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('alias')}
                      title="Sort by node alias"
                      className="flex items-center gap-1 text-left text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'alias' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      {networkSortCol === 'alias' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'} Node
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('channels')}
                      title="Sort by channels"
                      className="flex items-center justify-end gap-1 text-right text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'channels' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      Channels {networkSortCol === 'channels' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('capacity')}
                      title="Sort by capacity"
                      className="flex items-center justify-end gap-1 text-right text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'capacity' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      Capacity {networkSortCol === 'capacity' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNetworkSort('dist')}
                      title="Sort by average channel distance"
                      className="flex items-center justify-end gap-1 text-right text-[11px] uppercase tracking-[0.08em] transition hover:text-white/60"
                      style={{ color: networkSortCol === 'dist' ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)' }}
                    >
                      Distance {networkSortCol === 'dist' ? (networkSortDir === 'desc' ? '▼' : '▲') : '·'}
                    </button>
                  </div>

                  {visibleNetworkNodes.map((node, i) => {
                    const color = getNetworkNodeMetricColor(node, metricType, activeScale, avgDistByPubkey);
                    const isNodeSelected = node.pubkey === selectedPubkey;
                    const avgDist = avgDistByPubkey[node.pubkey];
                    return (
                      <button
                        key={`${node.pubkey || node.alias}-${i}`}
                        type="button"
                        onClick={() => setSelectedPubkey((p) => (p === node.pubkey ? null : node.pubkey))}
                        className="grid w-full grid-cols-[10px_112px_minmax(220px,1.8fr)_92px_108px_96px] items-center gap-x-3 rounded py-1.5 pl-1.5 pr-1 text-left transition hover:bg-white/[0.04]"
                        style={{
                          background: isNodeSelected ? 'rgba(59,163,255,0.08)' : 'transparent',
                          borderLeft: isNodeSelected ? `2px solid ${UI_COLORS.lightning}` : '2px solid transparent',
                        }}
                        title={`${node.countryName} | ${node.alias} | ${formatCompactTableValue(node.channels, 'channels')} channels | ${formatCompactTableValue(node.capacity, 'capacity')} | ${avgDist != null ? formatCompactTableValue(avgDist, 'dist') : 'No distance data'}`}
                      >
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 3px ${color}` }} />
                        <span className="text-[11px] uppercase tracking-[0.06em] text-white/56" title={node.countryName}>{node.countryName}</span>
                        <span className="break-words pr-2 text-[12px] leading-5 text-white/86" title={node.alias}>{node.alias}</span>
                        <span className="text-right text-[12px] tabular-nums" style={{ color: UI_COLORS.lightning }} title={String(node.channels)}>{formatCompactTableValue(node.channels, 'channels')}</span>
                        <span className="text-right text-[12px] tabular-nums" style={{ color: '#FF80AA' }} title={formatCompactTableValue(node.capacity, 'capacity')}>{formatCompactTableValue(node.capacity, 'capacity')}</span>
                        <span className="text-right text-[12px] tabular-nums text-white/46" title={avgDist != null ? formatCompactTableValue(avgDist, 'dist') : 'No distance data'}>{avgDist != null ? formatCompactTableValue(avgDist, 'dist') : '—'}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            /* ── Choropleth mode: country aggregates ── */
            <div className="space-y-1">
              {displayRows.map((item, index) => {
                const code  = item.country_code_resolved;
                const stats = statsByCode[code] || { nodes: 0, channels: 0, capacity: 0 };
                let dotColor, valueLabel;
                if (isAbsolute) {
                  const val = getMetricRawValue(stats, metricType);
                  dotColor   = metricType === 'nodes' ? getFillColorNodes(val) : getColorByScale(val, activeScale);
                  valueLabel = formatMetricValue(val, metricType);
                } else {
                  const pc     = perCapitaByCode[code];
                  const pcVal  = pc ? (metricType === 'nodes' ? pc.nodes : metricType === 'channels' ? pc.channels : pc.capacity) : 0;
                  dotColor   = getColorByScale(pcVal, activeScale);
                  valueLabel = formatPerCapitaValue(pcVal, metricType);
                }
                return (
                  <div
                    key={`${item.country_label}-${code}-${index}`}
                    className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] px-2 py-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="inline-block h-2 w-2 flex-none rounded-sm" style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }} />
                      <span className="truncate font-mono text-[12px] sm:text-[13px]" style={{ color: 'rgba(255,255,255,0.8)' }} title={item.country_label}>
                        {item.country_label}
                      </span>
                    </span>
                    <span className="flex-none font-mono text-[12px] sm:text-[13px]" style={{ color: dotColor }} title={valueLabel}>
                      {valueLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Meta footer */}
        <div className="relative border-t border-white/10 px-3 py-2 font-mono text-[11px]">
          <div className="hidden flex-wrap items-center gap-2 text-white/65 lg:flex">
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5">
              src:{' '}
              <a href="https://mempool.space" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                {sourceProviderLabel}
              </a>
            </span>
            <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/75">
              refresh: {nextUpdateDelay === 'N/A' ? 'N/A' : nextUpdateDelay === 'now' ? 'now' : `in ${nextUpdateDelay}`}
            </span>
            {!isAbsolute && (
              <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/55">
                pop:{' '}
                {popSource === 'worldbank' || popSource === 'cache' ? (
                  <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                    World Bank
                  </a>
                ) : <span>estimates</span>}
                {popDataYear && ` · ${popDataYear}`}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsMetaExpanded((prev) => !prev)}
              className="ml-auto rounded border border-white/10 bg-white/[0.02] px-2 py-1 text-white/70 transition hover:border-white/20"
              aria-expanded={isMetaExpanded}
              aria-controls="s07-meta-panel"
            >
              {isMetaExpanded ? 'Menos' : 'Detalles'}
            </button>
          </div>

          {isMetaExpanded && (
            <div id="s07-meta-panel" className="scrollbar-hidden-mobile absolute inset-x-3 bottom-[calc(100%+0.5rem)] z-20 max-h-[min(42vh,20rem)] overflow-y-auto rounded border border-white/10 bg-[#111111]/96 px-2 py-1.5 text-white/55 shadow-[0_14px_36px_rgba(0,0,0,0.42)] backdrop-blur-sm lg:static lg:inset-auto lg:bottom-auto lg:mt-2 lg:max-h-none lg:overflow-visible lg:bg-white/[0.02] lg:shadow-none lg:backdrop-blur-0">
              <div>
                Source:{' '}
                <a href="https://mempool.space/graphs/lightning/nodes-channels-map" target="_blank" rel="noreferrer" style={{ color: UI_COLORS.lightningSoft, textDecoration: 'none' }}>
                  mempool.space/graphs/lightning
                </a>
              </div>
              <div>API: {LIGHTNING_WORLD_ENDPOINT}</div>
              <div>Latest data: {payload?.fetched_at ? `${fmt.date(payload.fetched_at)} ${fmt.time(payload.fetched_at)}` : 'N/A'}</div>
              <div>Refresh cadence: every {Math.round(REFRESH_INTERVAL_MS / 60_000)} min</div>
              <div>Max channels (node): {fmt.num(maxChannels)}</div>
              <div>Max liquidity (node): {formatBtcFromSats(maxLiquidity)}</div>
              <div>Note: Tor nodes excluded from metrics</div>
              <div className="mt-2 border-t border-white/10 pt-2">
                <div className="mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Population Data</div>
                <div>
                  Source:{' '}
                  <a href="https://data.worldbank.org/indicator/SP.POP.TOTL" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}>
                    World Bank
                  </a>
                  {popDataYear && ` · ${popDataYear}`}
                </div>
                <div>Cadence: annual (published mid-year)</div>
                <div>
                  Cache TTL: 24h · status:{' '}
                  <span style={{ color: popSource === 'worldbank' ? '#00D897' : popSource === 'cache' ? 'var(--accent-bitcoin)' : 'rgba(255,255,255,0.4)' }}>
                    {popSource === 'worldbank' ? 'updated' : popSource === 'cache' ? 'from cache' : 'embedded estimates'}
                  </span>
                </div>
                {popLastFetched && (
                  <div style={{ color: 'rgba(255,255,255,0.4)' }}>Last update: {new Date(popLastFetched).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-white/10 px-4 py-2 font-mono text-[11px]" style={{ color: UI_COLORS.warning }}>
            {error}
          </div>
        )}
      </aside>
    </div>
  );
}
