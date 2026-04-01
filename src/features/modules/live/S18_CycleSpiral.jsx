/**
 * S18: Bitcoin Halving Cycle Spiral
 * Replicates giocaizzi visualization with live Binance API data
 *
 * Architecture:
 * - Polar coordinate spiral: year → angle, price → radius
 * - 4 halving cycles marked on spiral
 * - Click-activated tooltip with price + date
 * - Zoom (0.5x-3x) and pan interaction
 * - Responsive SVG rendering
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useBinanceHistoricalBTC } from '@/shared/hooks/useBinanceHistoricalBTC';
import { ModuleShell } from '@/shared/components/module';

// ============================================================================
// CONSTANTS
// ============================================================================

// Halving cycle boundaries (decimal year format)
const HALVINGS_Y = [2012.907, 2016.524, 2020.356, 2024.300, 2028.295];

// Price scaling (logarithmic)
const LOG_MIN = Math.log10(0.05); // ~$0.05
const LOG_MAX = Math.log10(150000); // ~$150k

// Responsive dimensions (will be updated on window resize)
function getResponsiveDimensions(width) {
  if (width < 640) {
    return { VW: 360, VH: 320, CX: 180, CY: 160, R_MIN: 12, R_MAX: 130 };
  }
  if (width < 1024) {
    return { VW: 600, VH: 500, CX: 300, CY: 260, R_MIN: 15, R_MAX: 210 };
  }
  return { VW: 900, VH: 700, CX: 450, CY: 360, R_MIN: 18, R_MAX: 300 };
}

// Cycle phases for coloring
const CYCLE_PHASES = [
  { range: [0, 0.15], label: 'Post-Halving Accumulation', color: '#1E50FF' },
  { range: [0.15, 0.4], label: 'Bull Run', color: '#00B4FF' },
  { range: [0.4, 0.65], label: 'Market Peak', color: '#00DC78' },
  { range: [0.65, 0.85], label: 'Bear Decline', color: '#DCDC00' },
  { range: [0.85, 1.0], label: 'Pre-Halving Bottom', color: '#FF8C00' },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const DRAG_THRESHOLD_PX = 4;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Unix timestamp to decimal year (e.g., 2020.5 = mid-2020)
 */
function getFractionalYear(ts) {
  const date = new Date(ts);
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1).getTime();
  const endOfYear = new Date(year + 1, 0, 1).getTime();
  const fraction = (ts - startOfYear) / (endOfYear - startOfYear);
  return year + fraction;
}

/**
 * Get current halving cycle info
 * Returns: { t: 0-1 progress within cycle, cycleStart, cycleEnd }
 */
function cycleInfo(year) {
  for (let i = 0; i < HALVINGS_Y.length - 1; i++) {
    if (year >= HALVINGS_Y[i] && year < HALVINGS_Y[i + 1]) {
      const cycleStart = HALVINGS_Y[i];
      const cycleEnd = HALVINGS_Y[i + 1];
      const t = (year - cycleStart) / (cycleEnd - cycleStart);
      return { t: Math.max(0, Math.min(1, t)), cycleStart, cycleEnd, cycleIndex: i };
    }
  }
  // Before first halving or after last
  const cycleStart = HALVINGS_Y[0];
  const cycleEnd = HALVINGS_Y[1];
  const t = (year - cycleStart) / (cycleEnd - cycleStart);
  return { t: Math.max(0, Math.min(1, t)), cycleStart, cycleEnd, cycleIndex: 0 };
}

/**
 * Map cycle progress (0-1) to RGB color
 */
function cycleColor(t) {
  // Clamp to 0-1
  t = Math.max(0, Math.min(1, t));

  // Color stops: blue → cyan → green → yellow → orange → red
  const stops = [
    { pos: 0, rgb: [30, 80, 255] },
    { pos: 0.2, rgb: [0, 180, 255] },
    { pos: 0.4, rgb: [0, 220, 120] },
    { pos: 0.6, rgb: [200, 220, 0] },
    { pos: 0.8, rgb: [255, 140, 0] },
    { pos: 1.0, rgb: [255, 20, 20] },
  ];

  // Find surrounding stops
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].pos && t <= stops[i + 1].pos) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  // Linear interpolation
  const range = upper.pos - lower.pos;
  const localT = range === 0 ? 0 : (t - lower.pos) / range;
  const r = Math.round(lower.rgb[0] + (upper.rgb[0] - lower.rgb[0]) * localT);
  const g = Math.round(lower.rgb[1] + (upper.rgb[1] - lower.rgb[1]) * localT);
  const b = Math.round(lower.rgb[2] + (upper.rgb[2] - lower.rgb[2]) * localT);

  return `rgb(${r},${g},${b})`;
}

/**
 * Convert price to spiral radius (logarithmic scale)
 */
function priceToRadius(price, R_MIN, R_MAX) {
  if (price <= 0) return R_MIN;
  const lp = Math.log10(price);
  const range = LOG_MAX - LOG_MIN;
  const normalized = (lp - LOG_MIN) / range;
  return R_MIN + normalized * (R_MAX - R_MIN);
}

/**
 * Convert polar coordinates to Cartesian
 * @param {number} angle - Angle in radians
 * @param {number} radius - Radius from center
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 */
function polarToCartesian(angle, radius, cx, cy) {
  const x = cx + radius * Math.cos(angle - Math.PI / 2);
  const y = cy + radius * Math.sin(angle - Math.PI / 2);
  return { x, y };
}

/**
 * Get tooltip label based on cycle phase
 */
function getCyclePhaseLabel(t) {
  for (const phase of CYCLE_PHASES) {
    if (t >= phase.range[0] && t < phase.range[1]) {
      return phase.label;
    }
  }
  return 'Unknown Phase';
}

function clampZoom(scale) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
}

function buildViewportTransform(pan, scale) {
  return `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
}

function getZoomPanForCursor({ mouseX, mouseY, centerX, centerY, currentScale, nextScale, currentPan }) {
  const scaleRatio = nextScale / currentScale;
  return {
    x: mouseX - centerX - ((mouseX - centerX - currentPan.x) * scaleRatio),
    y: mouseY - centerY - ((mouseY - centerY - currentPan.y) * scaleRatio),
  };
}

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

function SpiralTooltip({ active, payload, position }) {
  if (!active || !payload) return null;

  const { price, date, cycleProgress, phaseLabel } = payload;
  const { x, y } = position;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${x + 10}px`,
        top: `${y - 80}px`,
      }}
    >
      <div className="bg-black/95 border border-white/20 rounded-lg p-4 backdrop-blur-sm shadow-2xl">
        <div className="text-white/60 text-xs mb-2">{phaseLabel}</div>
        <div className="text-white font-bold text-lg">${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
        <div className="text-white/70 text-sm mt-1">{date}</div>
        <div className="text-white/50 text-xs mt-2">{(cycleProgress * 100).toFixed(1)}% through cycle</div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function S18_CycleSpiral() {
  // Data fetching from Binance
  const { waypoints, loading, error, dataPoints, latestPrice } = useBinanceHistoricalBTC(300000);

  // Responsive container
  const containerRef = useRef(null);
  const interactionAreaRef = useRef(null);
  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Interaction state
  const [hoveredWaypoint, setHoveredWaypoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    active: false,
    hasDragged: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const suppressDotClickRef = useRef(false);
  // Get responsive dimensions
  const dims = useMemo(
    () => getResponsiveDimensions(containerWidth),
    [containerWidth]
  );
  const viewportTransform = useMemo(
    () => buildViewportTransform(pan, zoomScale),
    [pan, zoomScale]
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prepare waypoint circles for rendering
  const circles = useMemo(() => {
    if (!waypoints || waypoints.length === 0) return [];

    return waypoints
      .filter(w => w.price > 0) // Skip zero/negative prices
      .map((w, idx) => {
        const year = getFractionalYear(w.ts);
        const { t, cycleIndex } = cycleInfo(year);
        const angle = ((year - HALVINGS_Y[cycleIndex]) / (HALVINGS_Y[cycleIndex + 1] - HALVINGS_Y[cycleIndex])) * Math.PI * 2;
        const radius = priceToRadius(w.price, dims.R_MIN, dims.R_MAX);
        const { x, y } = polarToCartesian(angle, radius, dims.CX, dims.CY);
        const color = cycleColor(t);

        // Size dot based on price
        let dotSize = 2;
        if (w.price > 50000) dotSize = 5;
        else if (w.price > 1000) dotSize = 3.5;
        else if (w.price > 100) dotSize = 3;

        return {
          idx,
          x,
          y,
          price: w.price,
          ts: w.ts,
          color,
          dotSize,
          t,
          angle,
          radius,
        };
      });
  }, [waypoints, dims]);

  // Mouse event handlers
  const handleDotClick = useCallback((e, circle) => {
    if (suppressDotClickRef.current) {
      suppressDotClickRef.current = false;
      return;
    }

    e.stopPropagation();

    const date = new Date(circle.ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    if (hoveredWaypoint?.idx === circle.idx) {
      // Toggle tooltip off if clicking same dot
      setHoveredWaypoint(null);
    } else {
      // Show tooltip
      setHoveredWaypoint({
        idx: circle.idx,
        price: circle.price,
        date,
        cycleProgress: circle.t,
        phaseLabel: getCyclePhaseLabel(circle.t),
      });

      // Position tooltip at click location
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect && e.clientX !== undefined && e.clientY !== undefined) {
        setTooltipPosition({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        });
      }
    }
  }, [hoveredWaypoint]);

  // Zoom with mouse wheel - pinpoint zoom like Google Maps
  const handleWheel = useCallback((e) => {
    if (!containerRef.current) return;
    e.preventDefault();

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = clampZoom(zoomScale * delta);
    if (newScale === zoomScale) return;

    const newPan = getZoomPanForCursor({
      mouseX,
      mouseY,
      centerX: dims.CX,
      centerY: dims.CY,
      currentScale: zoomScale,
      nextScale: newScale,
      currentPan: pan,
    });

    setZoomScale(newScale);
    setPan(newPan);
  }, [dims.CX, dims.CY, pan, zoomScale]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;

    dragStateRef.current = {
      active: true,
      hasDragged: false,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  }, [pan.x, pan.y]);

  const handlePointerMove = useCallback((e) => {
    const dragState = dragStateRef.current;
    if (!dragState.active) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    if (!dragState.hasDragged) {
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
        return;
      }

      dragState.hasDragged = true;
      suppressDotClickRef.current = true;
      setIsDragging(true);
    }

    setPan({
      x: dragState.startPanX + deltaX,
      y: dragState.startPanY + deltaY,
    });
  }, []);

  const handlePointerEnd = useCallback(() => {
    const dragState = dragStateRef.current;
    if (!dragState.active) return;

    if (dragState.hasDragged) {
      suppressDotClickRef.current = true;
    }

    dragStateRef.current = {
      active: false,
      hasDragged: false,
      startX: 0,
      startY: 0,
      startPanX: dragState.startPanX,
      startPanY: dragState.startPanY,
    };
    setIsDragging(false);
  }, []);

  // Reset zoom/pan
  const handleReset = useCallback(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
    dragStateRef.current = {
      active: false,
      hasDragged: false,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
    };
    suppressDotClickRef.current = false;
    setIsDragging(false);
  }, []);

  // Lazy-initialized state: Date.now() runs once at component creation, not on every render
  const [mountTime] = useState(() => Date.now());

  // Today marker computation — derived from captured mount time
  const todayMarker = useMemo(() => {
    const todayYear = getFractionalYear(mountTime);
    const { cycleIndex: todayCycleIndex } = cycleInfo(todayYear);
    const currentPrice = latestPrice || (waypoints && waypoints.length > 0 ? waypoints[waypoints.length - 1]?.price : null);
    if (!currentPrice || currentPrice <= 0) return null;
    const todayRadius = priceToRadius(currentPrice, dims.R_MIN, dims.R_MAX);
    const startYear = HALVINGS_Y[todayCycleIndex];
    const endYear = HALVINGS_Y[todayCycleIndex + 1] || HALVINGS_Y[todayCycleIndex] + 4;
    const angleProgress = (todayYear - startYear) / (endYear - startYear);
    const angle = angleProgress * Math.PI * 2;
    const { x: todayX, y: todayY } = polarToCartesian(angle, todayRadius, dims.CX, dims.CY);
    const todayDate = new Date(mountTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { todayX, todayY, todayDate };
  }, [mountTime, latestPrice, waypoints, dims]);

  const isInteractive = !loading && !error && waypoints.length > 0;
  const interactionCursor = isInteractive ? (isDragging ? 'grabbing' : 'grab') : 'default';

  useEffect(() => {
    const interactionNode = interactionAreaRef.current;
    if (!interactionNode || !isInteractive) return undefined;

    const handleNativeWheel = (event) => {
      handleWheel(event);
    };

    interactionNode.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      interactionNode.removeEventListener('wheel', handleNativeWheel);
    };
  }, [handleWheel, isInteractive]);

  return (
    <ModuleShell bg="#111111" layout="flex-col" overflow="hidden">
      <div
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#111111]"
      >
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <div className="text-white text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full mb-4" />
              <div className="text-white/70">Loading Bitcoin history...</div>
              <div className="text-white/50 text-sm mt-2">{dataPoints} data points</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <div className="text-center">
              <div className="text-red-400 mb-4">Failed to load Bitcoin data</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-amber-500 text-black rounded hover:bg-amber-400 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* SVG Visualization */}
        {!loading && waypoints.length > 0 && (
          <div
            ref={interactionAreaRef}
            data-testid="cycle-spiral-interaction-area"
            style={{
              transform: viewportTransform,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              transformOrigin: 'center center',
              cursor: interactionCursor,
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            <svg
              ref={svgRef}
              data-testid="cycle-spiral-svg"
              width={dims.VW}
              height={dims.VH}
              viewBox={`0 0 ${dims.VW} ${dims.VH}`}
              className="select-none"
              style={{ cursor: interactionCursor }}
            >
              {/* Background */}
              <rect width={dims.VW} height={dims.VH} fill="#111111" />

              {/* Price rings */}
              {[1, 100, 10000, 100000].map(price => {
                const radius = priceToRadius(price, dims.R_MIN, dims.R_MAX);
                return (
                  <g key={`ring-${price}`}>
                    <circle
                      cx={dims.CX}
                      cy={dims.CY}
                      r={radius}
                      fill="none"
                      stroke="white"
                      strokeOpacity="0.08"
                      strokeWidth="1"
                    />
                    <text
                      x={dims.CX + radius + 10}
                      y={dims.CY + 5}
                      fill="white"
                      opacity="0.3"
                      fontSize={containerWidth < 640 ? 10 : 12}
                      fontFamily="monospace"
                    >
                      ${price >= 1000 ? `${price / 1000}k` : price}
                    </text>
                  </g>
                );
              })}

              {/* Halving cycle lines - vertical lines from center to edge */}
              {HALVINGS_Y.slice(0, 4).map((year, idx) => (
                <g key={`halving-${idx}`}>
                  <line
                    x1={dims.CX}
                    y1={dims.CY}
                    x2={dims.CX}
                    y2={dims.CY - dims.R_MAX - (containerWidth < 640 ? 4 : 8)}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={0.5}
                    strokeDasharray={containerWidth < 640 ? '4 3' : '6 4'}
                  />
                  {/* Halving year label */}
                  <text
                    x={dims.CX - 10}
                    y={dims.CY - dims.R_MAX - 15}
                    fill="white"
                    opacity="0.5"
                    fontSize={containerWidth < 640 ? 11 : 13}
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    ₿ {Math.floor(year)}
                  </text>
                </g>
              ))}

              {/* Legend - Cycle Phases (SVG, for tablet/desktop only) */}
              {containerWidth >= 640 && (() => {
                const isTablet = containerWidth < 1024;
                const legendItemHeight = 16;
                const legendPaddingX = isTablet ? 8 : 12;
                const legendPaddingY = isTablet ? 6 : 8;
                const legendBoxWidth = isTablet ? 180 : 220;

                // Position legend at bottom-left corner of screen
                const legendX = legendPaddingX;
                const bottomMargin = 12;
                const legendY = dims.VH - (CYCLE_PHASES.length * legendItemHeight) - (legendPaddingY * 2) - bottomMargin;
                const legendBoxHeight = (CYCLE_PHASES.length * legendItemHeight) + (legendPaddingY * 2);

                return (
                  <g key="legend">
                    {/* Legend background box */}
                    <rect
                      x={legendX - 2}
                      y={legendY - 2}
                      width={legendBoxWidth + 4}
                      height={legendBoxHeight + 4}
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="0.5"
                      rx="2"
                    />
                    {/* Legend items */}
                    {CYCLE_PHASES.map((phase, idx) => {
                      const itemY = legendY + legendPaddingY + (idx * legendItemHeight);
                      const swatchSize = 12;
                      const fontSize = isTablet ? 10 : 11;
                      const label = phase.label;
                      return (
                        <g key={`legend-${idx}`}>
                          {/* Color swatch */}
                          <rect
                            x={legendX + legendPaddingX}
                            y={itemY + 1}
                            width={swatchSize}
                            height={swatchSize}
                            fill={phase.color}
                            opacity="0.9"
                          />
                          {/* Label */}
                          <text
                            x={legendX + legendPaddingX + swatchSize + 6}
                            y={itemY + swatchSize - 1}
                            fill="white"
                            opacity="0.7"
                            fontSize={fontSize}
                            fontFamily="monospace"
                          >
                            {label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}

              {/* Data points */}
              {circles.map(circle => (
                <circle
                  key={`dot-${circle.idx}`}
                  cx={circle.x}
                  cy={circle.y}
                  r={circle.dotSize}
                  fill={circle.color}
                  opacity="0.8"
                  className="cursor-pointer hover:opacity-100 transition-all"
                  style={{
                    filter: hoveredWaypoint?.idx === circle.idx ? 'drop-shadow(0 0 6px rgba(247,147,26,0.6))' : 'none',
                    transform: hoveredWaypoint?.idx === circle.idx ? 'scale(1.8)' : 'scale(1)',
                    transformOrigin: `${circle.x}px ${circle.y}px`,
                  }}
                  onClick={e => handleDotClick(e, circle)}
                />
              ))}

              {/* Today Indicator - White marker at current date */}
              {todayMarker && (
                  <g key="today-indicator">
                    {/* Outer pulsing ring */}
                    <circle
                      cx={todayMarker.todayX}
                      cy={todayMarker.todayY}
                      r={containerWidth < 640 ? 6 : 8}
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                      opacity="0.4"
                      style={{
                        animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                      }}
                    />
                    {/* Main white indicator */}
                    <circle
                      cx={todayMarker.todayX}
                      cy={todayMarker.todayY}
                      r={containerWidth < 640 ? 4 : 5}
                      fill="white"
                      opacity="0.95"
                    />
                    {/* Today label */}
                    <text
                      x={todayMarker.todayX}
                      y={todayMarker.todayY - (containerWidth < 640 ? 10 : 12)}
                      textAnchor="middle"
                      fill="white"
                      opacity="0.8"
                      fontSize={containerWidth < 640 ? 9 : 10}
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      TODAY
                    </text>
                    {/* Date label */}
                    <text
                      x={todayMarker.todayX}
                      y={todayMarker.todayY + (containerWidth < 640 ? 12 : 14)}
                      textAnchor="middle"
                      fill="white"
                      opacity="0.6"
                      fontSize={containerWidth < 640 ? 8 : 9}
                      fontFamily="monospace"
                    >
                      {todayMarker.todayDate}
                    </text>
                  </g>
              )}

              {/* Center label */}
              <text
                x={dims.CX}
                y={dims.CY + 15}
                fill="white"
                opacity="0.3"
                fontSize={containerWidth < 640 ? 12 : 16}
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                2009
              </text>
            </svg>
          </div>
        )}

        {/* Legend - HTML div for mobile */}
        {containerWidth < 640 && (
          <div className="absolute bottom-1 left-2 z-20 bg-black/40 backdrop-blur-sm rounded border border-white/10 p-2">
            <div className="space-y-1">
              {CYCLE_PHASES.map((phase) => (
                <div key={phase.label} className="flex items-center gap-2 text-xs font-mono">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: phase.color, opacity: 0.9 }}
                  />
                  <span className="text-white/70">{phase.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={`absolute flex gap-2 z-30 ${containerWidth < 640 ? 'bottom-20 right-3' : 'bottom-4 right-4'}`}>
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-amber-500 text-black text-sm rounded font-mono hover:bg-amber-400 transition"
            title="Reset zoom and pan"
          >
            Reset
          </button>
          <div className="px-3 py-2 bg-white/10 text-white/70 text-sm rounded font-mono border border-white/20">
            {zoomScale.toFixed(1)}x
          </div>
        </div>

        {/* Tooltip */}
        {hoveredWaypoint && <SpiralTooltip active payload={hoveredWaypoint} position={tooltipPosition} />}
      </div>
    </ModuleShell>
  );
}
