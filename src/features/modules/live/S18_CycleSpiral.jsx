import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { ModuleShell } from '@/shared/components/module/index.js';
import s18WaypointData from '@/data/s18WaypointData.js';

const HALVINGS_Y = [2012.907, 2016.524, 2020.356, 2024.300, 2028.295];

const WP = [
  [2010.5,  0.08],
  [2011.4,  30],
  [2012.0,  5],
  [2012.9,  12],
  [2013.3,  140],
  [2013.92, 1100],
  [2015.0,  180],
  [2016.0,  430],
  [2016.52, 660],
  [2017.0,  1000],
  [2017.95, 19400],
  [2018.5,  7000],
  [2019.0,  3500],
  [2019.5,  11000],
  [2020.0,  7200],
  [2020.36, 8700],
  [2020.92, 29000],
  [2021.35, 59000],
  [2021.86, 67000],
  [2022.45, 30000],
  [2022.90, 16000],
  [2023.0,  23000],
  [2023.95, 42000],
  [2024.20, 73700],
  [2024.30, 64000],
  [2024.96, 108000],
  [2025.05, 97000],
  [2025.55, 105000],
  [2025.95, 100000],
  [2026.17, 84000],
];

function interpLogPrice(year) {
  if (year <= WP[0][0]) return WP[0][1];
  if (year >= WP[WP.length - 1][0]) return WP[WP.length - 1][1];
  let i = 0;
  while (i < WP.length - 1 && WP[i + 1][0] < year) i++;
  const [y0, p0] = WP[i];
  const [y1, p1] = WP[i + 1];
  const t = (year - y0) / (y1 - y0);
  const lp = Math.log10(p0) + t * (Math.log10(p1) - Math.log10(p0));
  return Math.pow(10, lp);
}

function cycleInfo(year) {
  let cycleStart = 2009.0083;
  let cycleEnd = HALVINGS_Y[0];
  for (let i = 0; i < HALVINGS_Y.length; i++) {
    if (year < HALVINGS_Y[i]) {
      cycleStart = i === 0 ? 2009.0083 : HALVINGS_Y[i - 1];
      cycleEnd = HALVINGS_Y[i];
      break;
    }
    if (i === HALVINGS_Y.length - 1) {
      cycleStart = HALVINGS_Y[i];
      cycleEnd = HALVINGS_Y[i] + (HALVINGS_Y[i] - HALVINGS_Y[i - 1]);
    }
  }
  const t = Math.max(0, Math.min(1, (year - cycleStart) / (cycleEnd - cycleStart)));
  return { t, cycleStart, cycleEnd };
}

// Responsive dimensions - scale based on viewport
function getResponsiveDimensions() {
  if (typeof window === 'undefined') return { VW: 900, VH: 720, CX: 450, CY: 370, R_MIN: 18, R_MAX: 310 };

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Mobile (< 640px): smaller spiral
  if (width < 640) {
    return { VW: 360, VH: 320, CX: 180, CY: 165, R_MIN: 12, R_MAX: 140 };
  }
  // Tablet (640px - 1024px)
  if (width < 1024) {
    return { VW: 600, VH: 520, CX: 300, CY: 270, R_MIN: 15, R_MAX: 220 };
  }
  // Desktop
  return { VW: 900, VH: 720, CX: 450, CY: 370, R_MIN: 18, R_MAX: 310 };
}

const LOG_MIN = Math.log10(0.05);
const LOG_MAX = Math.log10(150000);

function priceToRadius(price, R_MIN, R_MAX) {
  const lp = Math.log10(Math.max(0.05, price));
  return R_MIN + (R_MAX - R_MIN) * (lp - LOG_MIN) / (LOG_MAX - LOG_MIN);
}

function cycleColor(t) {
  const stops = [
    [0,    [30,  80, 255]],
    [0.20, [0,  180, 255]],
    [0.40, [0,  220, 120]],
    [0.60, [200, 220,  0]],
    [0.80, [255, 140,  0]],
    [1.0,  [255,  20, 20]],
  ];
  let i = 0;
  while (i < stops.length - 1 && stops[i + 1][0] < t) i++;
  const [t0, c0] = stops[i];
  const [t1, c1] = stops[Math.min(i + 1, stops.length - 1)];
  const f = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
  const r = Math.round(c0[0] + f * (c1[0] - c0[0]));
  const g = Math.round(c0[1] + f * (c1[1] - c0[1]));
  const b = Math.round(c0[2] + f * (c1[2] - c0[2]));
  return `rgb(${r},${g},${b})`;
}

function getCyclePhase(t) {
  if (t < 0.15) return { label: 'Post-Halving Accumulation', color: 'rgb(30,80,255)' };
  if (t < 0.40) return { label: 'Bull Run', color: 'rgb(0,180,255)' };
  if (t < 0.65) return { label: 'Market Peak', color: 'rgb(0,220,120)' };
  if (t < 0.85) return { label: 'Bear Decline', color: 'rgb(200,220,0)' };
  return { label: 'Pre-Halving Bottom', color: 'rgb(255,140,0)' };
}

// Generate dots dynamically based on current dimensions
function generateDots(dims, waypointData = s18WaypointData) {
  const { CX, CY, R_MIN, R_MAX } = dims;
  const dots = [];

  // Use real waypoint data (909 points 2009-2026)
  for (const wp of waypointData) {
    const year = getFractionalYear(wp.ts);
    const price = wp.price;
    const { t, cycleStart, cycleEnd } = cycleInfo(year);
    const angle = t * 2 * Math.PI - Math.PI / 2;
    const r = priceToRadius(price, R_MIN, R_MAX);
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    dots.push({ x, y, t, price, year, r, cycleStart, cycleEnd, ts: wp.ts });
  }
  return dots;
}

function generateRings(R_MIN, R_MAX) {
  return [
    { price: 1,       label: '$1' },
    { price: 100,     label: '$100' },
    { price: 10000,   label: '$10K' },
    { price: 100000,  label: '$100K' },
  ];
}

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatUsd(value) {
  return PRICE_FORMATTER.format(value);
}

function fractionalYearToDate(year) {
  const startYear = Math.floor(year);
  const fraction = year - startYear;
  const start = new Date(startYear, 0, 1);
  const end = new Date(startYear + 1, 0, 1);
  const date = new Date(start.getTime() + fraction * (end.getTime() - start.getTime()));
  return date;
}

// Responsive tooltip component
function SpiralTooltip({ active, payload, position }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const phase = getCyclePhase(point.t);
  const cycleProgress = Math.round(point.t * 100);
  const date = fractionalYearToDate(point.year);

  return (
    <div
      className="rounded-xl border border-white/12 bg-[rgba(9,12,18,0.96)] px-3 py-2.5 font-mono shadow-[0_12px_28px_rgba(0,0,0,0.48)] md:px-3.5 md:py-3"
      style={{
        minWidth: 160,
        maxWidth: 220,
        position: 'absolute',
        zIndex: 50,
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-12px)',
      }}
      role="tooltip"
    >
      <div className="flex items-center gap-2 border-b border-white/8 pb-1.5 md:pb-2">
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: phase.color }}
        />
        <span className="text-[9px] uppercase tracking-[0.16em] text-white/55 truncate md:text-[10px]">
          {phase.label}
        </span>
      </div>
      <div className="mt-2 space-y-1.5 text-[10px] md:text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-white/55">Price</span>
          <span style={{ color: 'var(--accent-bitcoin)', fontWeight: 600 }} className="truncate">
            {formatUsd(point.price)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-white/55">Date</span>
          <span className="text-white/80 truncate">{DATE_FORMATTER.format(date)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-white/55">Cycle</span>
          <span style={{ color: phase.color }}>{cycleProgress}%</span>
        </div>
      </div>
    </div>
  );
}

// Phase legend sidebar - collapsible on mobile
function PhaseLegend({ isOpen, onToggle }) {
  const phases = [
    { phase: 'Post-Halving', color: 'rgb(30,80,255)', range: '0-15%' },
    { phase: 'Bull Run', color: 'rgb(0,180,255)', range: '15-40%' },
    { phase: 'Market Peak', color: 'rgb(0,220,120)', range: '40-65%' },
    { phase: 'Bear Decline', color: 'rgb(200,220,0)', range: '65-85%' },
    { phase: 'Pre-Halving', color: 'rgb(255,140,0)', range: '85-100%' },
  ];

  return (
    <div className="absolute right-2 top-2 md:right-3 md:top-3 lg:block">
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden absolute right-0 top-0 z-10 flex items-center justify-center w-8 h-8 rounded-lg border border-white/8 bg-[rgba(17,17,17,0.9)] text-white/60 hover:text-white transition-colors"
        aria-label="Toggle phase legend"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Desktop always visible, mobile as dropdown */}
      <div className={`
        rounded-lg border border-white/8 bg-[rgba(17,17,17,0.9)] p-2.5 md:p-3 backdrop-blur-sm
        ${isOpen ? 'block' : 'hidden lg:block'}
      `}>
        <div className="mb-2 border-b border-white/8 pb-1.5 md:mb-2 md:pb-1.5">
          <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono md:text-[10px]">
            Cycle Phases
          </span>
        </div>
        <div className="space-y-1 md:space-y-1.5">
          {phases.map(({ phase, color, range }) => (
            <div key={phase} className="flex items-center justify-between gap-2 md:gap-3" style={{ minHeight: 24 }}>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="h-1.5 w-1.5 rounded-full flex-shrink-0 md:h-2 md:w-2" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-white/60 truncate font-mono md:text-[10px]">
                  {phase}
                </span>
              </div>
              <span className="text-[8px] text-white/30 flex-shrink-0 font-mono md:text-[9px]">
                {range}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function S18_CycleSpiral() {
  const [hoveredDot, setHoveredDot] = useState(null);
  const [dimensions, setDimensions] = useState(getResponsiveDimensions);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [legendOpen, setLegendOpen] = useState(false);
  const containerRef = useRef(null);

  const { VW, VH, CX, CY, R_MIN, R_MAX } = dimensions;
  const DOTS = generateDots(dimensions);
  const RINGS = generateRings(R_MIN, R_MAX);

  const getInitialReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions(getResponsiveDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => {
      if (e.matches !== reducedMotion) {
        setReducedMotion(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [reducedMotion]);

  const handleDotHover = useCallback((dot) => (event) => {
    if (event.type === 'mouseenter' || event.type === 'touchstart' || event.type === 'focus') {
      setHoveredDot(dot);
      // Update tooltip position based on container
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Position tooltip near the center of the spiral area
        setTooltipPosition({
          x: rect.width / 2,
          y: rect.height * 0.4,
        });
      }
    } else if (event.type === 'mouseleave' || event.type === 'blur') {
      setHoveredDot(null);
    }
  }, []);

  const handleKeyDown = useCallback((dot) => (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setHoveredDot(dot);
    } else if (event.key === 'Escape') {
      setHoveredDot(null);
    }
  }, []);

  const handleContainerClick = useCallback((dot) => () => {
    setHoveredDot(prev => prev?.year === dot.year ? null : dot);
  }, []);

  const lastDot = DOTS[DOTS.length - 1];
  const currentPhase = getCyclePhase(lastDot?.t || 0);

  const tooltipData = hoveredDot ? { active: true, payload: [{ payload: hoveredDot }] } : { active: false, payload: [] };

  // Determine if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

  // Calculate font sizes based on screen size
  const titleSize = isMobile ? '0.9rem' : isTablet ? '1rem' : 'clamp(1.1rem, 4vw, var(--fs-section))';
  const subtitleSize = isMobile ? '0.6rem' : isTablet ? '0.65rem' : 'clamp(0.65rem, 2vw, var(--fs-micro))';

  return (
    <ModuleShell overflow="hidden">
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(247,147,26,0.6)); }
          50% { filter: drop-shadow(0 0 12px rgba(247,147,26,0.9)); }
        }
        .spiral-container {
          animation: fadeInScale 0.7s ease-out forwards;
        }
        .spiral-header {
          animation: fadeInUp 0.5s ease-out 0.1s forwards;
          opacity: 0;
        }
        .spiral-legend {
          animation: fadeInUp 0.5s ease-out 0.3s forwards;
          opacity: 0;
        }
        .cycle-dot {
          cursor: pointer;
          transition: transform 0.15s ease-out, filter 0.15s ease-out;
        }
        .cycle-dot:hover, .cycle-dot:focus {
          transform: scale(1.6);
          filter: brightness(1.25);
        }
        /* Touch-friendly: always show hover state on touch devices */
        @media (hover: none) {
          .cycle-dot:active {
            transform: scale(1.6);
            filter: brightness(1.25);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .spiral-container, .spiral-header, .spiral-legend {
            animation: none;
            opacity: 1;
          }
          .cycle-dot {
            transition: none;
          }
        }
        /* Prevent text selection on chart */
        .spiral-svg {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>

      {/* Header */}
      <div className="flex-none px-3 pt-3 pb-2 sm:px-5 sm:pt-5 sm:pb-3 md:px-8 md:pt-6 md:pb-4">
        <header className="spiral-header">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h1
                style={{
                  color: 'var(--accent-bitcoin)',
                  fontFamily: 'monospace',
                  fontSize: titleSize,
                  fontWeight: 700,
                }}
                className="truncate"
              >
                Bitcoin Cycle Spiral
              </h1>
              <p
                style={{
                  color: 'rgba(255,255,255,0.42)',
                  fontFamily: 'monospace',
                  fontSize: subtitleSize,
                  marginTop: 4,
                }}
                className="truncate"
              >
                Polar chart — each revolution = one halving cycle
              </p>
            </div>

            <div
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 sm:self-start md:gap-3 md:px-3.5 md:py-2.5"
              role="status"
              aria-live="polite"
            >
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 sm:h-3 sm:w-3"
                style={{
                  backgroundColor: currentPhase.color,
                  animation: reducedMotion ? 'none' : 'pulseGlow 2s ease-in-out infinite',
                }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] uppercase tracking-wider text-white/40 font-mono truncate sm:text-[10px]">
                  Phase
                </span>
                <span
                  className="font-mono text-[10px] font-semibold text-white truncate sm:text-xs"
                  style={{ color: currentPhase.color }}
                >
                  {currentPhase.label}
                </span>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Main visualization area */}
      <div
        ref={containerRef}
        className="spiral-container min-h-0 flex-1 flex items-center justify-center px-1 pb-1 sm:px-2 sm:pb-2 md:px-4 md:pb-3"
      >
        <div className="relative h-full w-full max-w-[350px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[800px]">
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '100%',
            }}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-labelledby="spiralTitle spiralDesc"
            className="spiral-svg"
          >
            <title id="spiralTitle">Bitcoin Cycle Spiral</title>
            <desc id="spiralDesc">
              A polar visualization showing Bitcoin price history from 2010 to 2026.
              The spiral expands outward representing price on a logarithmic scale,
              with each complete revolution representing one halving cycle.
            </desc>

            <defs>
              <linearGradient id="spiralLegend" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(30,80,255)" />
                <stop offset="25%" stopColor="rgb(0,180,255)" />
                <stop offset="50%" stopColor="rgb(0,220,120)" />
                <stop offset="75%" stopColor="rgb(255,140,0)" />
                <stop offset="100%" stopColor="rgb(255,20,20)" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Price rings */}
            {RINGS.map(({ price, label }) => {
              const rr = priceToRadius(price, R_MIN, R_MAX);
              const isSmall = isMobile;
              return (
                <g key={price}>
                  <circle
                    cx={CX}
                    cy={CY}
                    r={rr}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={isMobile ? 0.8 : 1.2}
                  />
                  <text
                    x={CX + rr + (isMobile ? 3 : 6)}
                    y={CY - 2}
                    fill="rgba(255,255,255,0.28)"
                    fontSize={isMobile ? 7 : 10}
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Halving lines */}
            {HALVINGS_Y.slice(0, 4).map((_, i) => (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={CX}
                y2={CY - R_MAX - (isMobile ? 4 : 8)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.5}
                strokeDasharray={isMobile ? "4 3" : "6 4"}
              />
            ))}

            {/* Data dots - larger touch targets on mobile */}
            {DOTS.map((d, i) => {
              const isHovered = hoveredDot?.year === d.year;
              const isCurrent = lastDot?.year === d.year;
              const baseSize = isMobile
                ? (d.price > 50000 ? 4 : d.price > 1000 ? 3 : 2)
                : (d.price > 50000 ? 5 : d.price > 1000 ? 3.5 : 2.5);

              return (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={isHovered ? baseSize * 1.5 : baseSize}
                  fill={cycleColor(d.t)}
                  opacity={isHovered ? 1 : 0.8}
                  filter={isCurrent && !reducedMotion ? 'url(#glow)' : undefined}
                  className="cycle-dot"
                  role="button"
                  tabIndex={0}
                  aria-label={`${formatUsd(d.price)} - ${DATE_FORMATTER.format(fractionalYearToDate(d.year))}`}
                  onMouseEnter={handleDotHover(d)}
                  onMouseLeave={handleDotHover(d)}
                  onTouchStart={handleDotHover(d)}
                  onFocus={handleDotHover(d)}
                  onBlur={() => setHoveredDot(null)}
                  onKeyDown={handleKeyDown(d)}
                />
              );
            })}

            {/* Current position indicator */}
            {lastDot && (
              <>
                <circle
                  cx={lastDot.x}
                  cy={lastDot.y}
                  r={isMobile ? 6 : 9}
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1}
                />
                <circle
                  cx={lastDot.x}
                  cy={lastDot.y}
                  r={isMobile ? 3 : 5}
                  fill="var(--accent-bitcoin)"
                  filter="url(#glow)"
                />
                <text
                  x={lastDot.x + (isMobile ? 8 : 14)}
                  y={lastDot.y + 3}
                  fill="white"
                  fontSize={isMobile ? 8 : 11}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  NOW
                </text>
              </>
            )}

            {/* Halving year labels */}
            {[2012, 2016, 2020, 2024].map((yr, i) => {
              const rr = priceToRadius(interpLogPrice(HALVINGS_Y[i]), R_MIN, R_MAX);
              return (
                <text
                  key={yr}
                  x={CX}
                  y={CY - rr - (isMobile ? 8 : 16)}
                  textAnchor="middle"
                  fill="var(--accent-bitcoin)"
                  fontSize={isMobile ? 7 : 10}
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  ₿ {yr}
                </text>
              );
            })}

            {/* Center year */}
            <text
              x={CX}
              y={CY + 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.2)"
              fontSize={isMobile ? 7 : 10}
              fontFamily="monospace"
            >
              2009
            </text>
          </svg>

          {/* Color legend - bottom */}
          <div
            className="spiral-legend pointer-events-none absolute bottom-1 left-1/2 w-[90%] max-w-[240px] -translate-x-1/2 px-2 sm:max-w-[280px] md:max-w-[320px]"
            role="img"
            aria-label="Cycle position color legend"
          >
            <div className="rounded-lg border border-white/8 bg-[rgba(17,17,17,0.85)] px-3 py-2 backdrop-blur-sm sm:px-4 sm:py-3">
              <div
                className="relative h-2 rounded-full sm:h-3"
                style={{ background: 'linear-gradient(90deg, rgb(30,80,255) 0%, rgb(0,180,255) 25%, rgb(0,220,120) 50%, rgb(255,140,0) 75%, rgb(255,20,20) 100%)' }}
              />
              <div className="mt-1.5 flex justify-between text-[7px] uppercase tracking-wider sm:mt-2 sm:text-[8px] md:text-[9px]" style={{ fontFamily: 'monospace' }}>
                <span className="text-white/40">Post-halving</span>
                <span className="text-white/40">Pre-halving</span>
              </div>
            </div>
          </div>

          {/* Phase legend sidebar - responsive */}
          <PhaseLegend isOpen={legendOpen} onToggle={() => setLegendOpen(!legendOpen)} />

          {/* Tooltip - positioned in chart area */}
          {hoveredDot && (
            <SpiralTooltip {...tooltipData} position={tooltipPosition} />
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div
        className="flex-none px-3 pb-2 pt-1 sm:px-5 sm:pb-4 sm:pt-1 md:px-8 md:pb-4"
        role="contentinfo"
        aria-label="Chart data information"
      >
        <div className="rounded-xl border border-white/8 bg-white/5 p-2 sm:p-3 md:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            <div className="text-center">
              <div className="text-[8px] uppercase tracking-wider text-white/40 font-mono truncate sm:text-[9px] md:text-[10px]" style={{ marginBottom: 2 }}>
                Current Price
              </div>
              <div className="font-mono text-[10px] font-semibold tabular-nums truncate sm:text-sm" style={{ color: 'var(--accent-bitcoin)' }}>
                {formatUsd(lastDot?.price || 0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] uppercase tracking-wider text-white/40 font-mono truncate sm:text-[9px] md:text-[10px]" style={{ marginBottom: 2 }}>
                Cycle Progress
              </div>
              <div className="font-mono text-[10px] font-semibold tabular-nums truncate sm:text-sm" style={{ color: currentPhase.color }}>
                {Math.round((lastDot?.t || 0) * 100)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] uppercase tracking-wider text-white/40 font-mono truncate sm:text-[9px] md:text-[10px]" style={{ marginBottom: 2 }}>
                Halving Cycle
              </div>
              <div className="font-mono text-[10px] font-semibold tabular-nums text-white/80 truncate sm:text-sm">
                #{(lastDot?.year || 2024) >= 2024 ? 5 : (lastDot?.year || 2020) >= 2020 ? 4 : 3}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[8px] uppercase tracking-wider text-white/40 font-mono truncate sm:text-[9px] md:text-[10px]" style={{ marginBottom: 2 }}>
                Data Points
              </div>
              <div className="font-mono text-[10px] font-semibold tabular-nums text-white/80 truncate sm:text-sm">
                {DOTS.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
