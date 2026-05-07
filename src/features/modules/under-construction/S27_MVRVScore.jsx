// MVRV Z-Score — percentile chart with dynamic gradient line
// Displays historical MVRV Z-Score as 0–100 percentile with
// blue (oversold) → green → yellow → red (overbought) color encoding

import { useState, useCallback, useRef } from 'react';

// ─── Current values ───────────────────────────────────────────────────────────
const CURRENT_PCT = 45.64;
const CHANGE_PCT  = 1.13;

// ─── Color scale: percentile → rgb ───────────────────────────────────────────
const COLOR_STOPS = [
  { p: 0,   r: 0,   g: 30,  b: 255 },  // deep blue
  { p: 18,  r: 0,   g: 200, b: 255 },  // cyan
  { p: 38,  r: 0,   g: 255, b: 100 },  // green
  { p: 58,  r: 200, g: 255, b: 0   },  // yellow-green
  { p: 72,  r: 255, g: 200, b: 0   },  // orange-yellow
  { p: 86,  r: 255, g: 60,  b: 0   },  // orange-red
  { p: 100, r: 255, g: 0,   b: 0   },  // red
];

function mvrvColor(pct) {
  const v = Math.max(0, Math.min(100, pct));
  let lo = COLOR_STOPS[0], hi = COLOR_STOPS[COLOR_STOPS.length - 1];
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (v >= COLOR_STOPS[i].p && v <= COLOR_STOPS[i + 1].p) {
      lo = COLOR_STOPS[i]; hi = COLOR_STOPS[i + 1]; break;
    }
  }
  const t = hi.p === lo.p ? 0 : (v - lo.p) / (hi.p - lo.p);
  return `rgb(${Math.round(lo.r + t * (hi.r - lo.r))},${Math.round(lo.g + t * (hi.g - lo.g))},${Math.round(lo.b + t * (hi.b - lo.b))})`;
}

function signalZone(pct) {
  if (pct < 20) return { label: 'Oversold',   color: mvrvColor(10)  };
  if (pct < 40) return { label: 'Accumulate', color: mvrvColor(30)  };
  if (pct < 60) return { label: 'Neutral',    color: mvrvColor(50)  };
  if (pct < 80) return { label: 'Caution',    color: mvrvColor(70)  };
  return           { label: 'Overbought',  color: mvrvColor(90)  };
}

// ─── Historical anchor points [year_decimal, percentile] ─────────────────────
// Based on real MVRV Z-Score cycles (normalized to 0–100 percentile)
const ANCHORS = [
  [2010.0,  4], [2010.5,  6], [2011.0, 18], [2011.42, 93], [2011.55, 52],
  [2011.75, 17],[2012.0,  9], [2012.5,  7], [2013.0,  11], [2013.25, 33],
  [2013.42, 27],[2013.75, 38],[2013.92, 96],[2014.0,  65], [2014.2,  43],
  [2014.5,  20],[2014.75, 16],[2015.0,  13],[2015.25,  8], [2015.58, 10],
  [2015.83, 14],[2016.0,  17],[2016.5,  15],[2016.75, 18], [2017.0,  23],
  [2017.25, 34],[2017.5,  49],[2017.75, 68],[2017.95, 95], [2018.08, 50],
  [2018.25, 40],[2018.5,  35],[2018.75, 22],[2018.92,  7], [2019.0,   8],
  [2019.25, 17],[2019.5,  27],[2019.75, 20],[2020.0,  12], [2020.25,  7],
  [2020.5,  16],[2020.75, 27],[2020.92, 35],[2021.08, 78], [2021.25, 83],
  [2021.42, 55],[2021.5,  52],[2021.67, 56],[2021.83, 80], [2022.0,  52],
  [2022.17, 37],[2022.42,  9],[2022.67,  7],[2022.92,  5], [2023.0,   6],
  [2023.25, 13],[2023.5,  19],[2023.75, 22],[2023.92, 28], [2024.0,  32],
  [2024.17, 47],[2024.33, 40],[2024.5,  36],[2024.67, 38], [2024.83, 43],
  [2024.92, 50],[2025.0,  47],[2025.17, 44],[2025.33, 40], [2025.5,  42],
  [2025.75, 43],[2026.0,  44],[2026.17, 45.64],
];

// Dense interpolation for smooth rendering
const DATA = (() => {
  const pts = [];
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const [t0, p0] = ANCHORS[i];
    const [t1, p1] = ANCHORS[i + 1];
    const steps = Math.max(3, Math.round((t1 - t0) * 100));
    for (let j = 0; j < steps; j++) {
      const frac = j / steps;
      pts.push({ t: t0 + (t1 - t0) * frac, pct: p0 + (p1 - p0) * frac });
    }
  }
  const last = ANCHORS[ANCHORS.length - 1];
  pts.push({ t: last[0], pct: last[1] });
  return pts;
})();

// ─── SVG layout ───────────────────────────────────────────────────────────────
const VW = 900, VH = 540;
const ML = 52, MR = 72, MT = 22, MB = 40;
const CW = VW - ML - MR;
const CH = VH - MT - MB;
const X_MIN = 2010.0, X_MAX = 2026.5;
const Y_MIN = 0, Y_MAX = 100;

function xS(t)   { return ML + (t   - X_MIN) / (X_MAX - X_MIN) * CW; }
function yS(pct) { return MT + CH  - (pct - Y_MIN) / (Y_MAX - Y_MIN) * CH; }

const Y_TICKS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
const X_YEARS = [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025];

// Color bar position
const BAR_X = ML + CW + 12;
const BAR_W = 16;

function fmtDate(t) {
  const yr  = Math.floor(t);
  const mo  = Math.min(11, Math.round((t - yr) * 12));
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mo] + ' ' + yr;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function S26_MVRVScore() {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const up           = CHANGE_PCT >= 0;
  const currentColor = mvrvColor(CURRENT_PCT);
  const zone         = signalZone(CURRENT_PCT);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect  = svg.getBoundingClientRect();
    const scaleX = VW / rect.width;
    const svgX   = (e.clientX - rect.left) * scaleX;
    const t      = X_MIN + (svgX - ML) / CW * (X_MAX - X_MIN);
    if (t < X_MIN || t > X_MAX) { setHover(null); return; }

    let best = DATA[0], bestD = Infinity;
    for (const pt of DATA) {
      const d = Math.abs(pt.t - t);
      if (d < bestD) { bestD = d; best = pt; }
    }
    setHover({
      x:       xS(best.t),
      y:       yS(best.pct),
      pct:     best.pct,
      color:   mvrvColor(best.pct),
      dateStr: fmtDate(best.t),
      zone:    signalZone(best.pct),
    });
  }, []);

  const handleMouseLeave = useCallback(() => setHover(null), []);

  // Tooltip sizing
  const TW = 172, TH = 90;
  let tx = hover ? hover.x + 14 : 0;
  let ty = hover ? hover.y - TH / 2 : 0;
  if (hover && tx + TW > ML + CW - 2) tx = hover.x - TW - 14;
  if (hover && ty < MT + 2)           ty = MT + 2;
  if (hover && ty + TH > MT + CH - 2) ty = MT + CH - TH - 2;

  const lastPt = DATA[DATA.length - 1];

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center gap-3 px-8 pt-5 pb-1 flex-wrap">
        <span style={{
          display:'inline-block', width:12, height:12, borderRadius:'50%',
          backgroundColor:'#00D897', flexShrink:0,
        }} />
        <span style={{
          color:'#fff', fontFamily:'monospace',
          fontSize:'var(--fs-subtitle)', fontWeight:700,
        }}>
          MVRV Z-Score:{' '}
          <span style={{ color: currentColor }}>{CURRENT_PCT}</span>
        </span>
        <span style={{
          color: up ? '#00D897' : '#FF4757',
          fontFamily:'monospace',
          fontSize:'var(--fs-section)', fontWeight:600,
        }}>
          {up ? '+' : ''}{CHANGE_PCT}% {up ? '▲' : '▼'}
        </span>
      </div>

      {/* ── Chart ────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 px-2 pb-1"
        style={{ cursor: hover ? 'crosshair' : 'default' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width:'100%', height:'100%' }}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Color bar gradient (top=overbought=red, bottom=oversold=blue) */}
            <linearGradient id="mvrvBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgb(255,0,0)"   />
              <stop offset="14%"  stopColor="rgb(255,60,0)"  />
              <stop offset="28%"  stopColor="rgb(255,200,0)" />
              <stop offset="42%"  stopColor="rgb(200,255,0)" />
              <stop offset="62%"  stopColor="rgb(0,255,100)" />
              <stop offset="82%"  stopColor="rgb(0,200,255)" />
              <stop offset="100%" stopColor="rgb(0,30,255)"  />
            </linearGradient>
          </defs>

          {/* Mouse hit area */}
          <rect x={ML} y={MT} width={CW} height={CH} fill="transparent" />

          {/* Horizontal grid */}
          {Y_TICKS.map(v => (
            <line key={`gy${v}`}
              x1={ML} y1={yS(v)} x2={ML+CW} y2={yS(v)}
              stroke="#1c1c1c" strokeWidth={1} />
          ))}

          {/* Vertical year grid */}
          {X_YEARS.map(yr => (
            <line key={yr}
              x1={xS(yr)} y1={MT} x2={xS(yr)} y2={MT+CH}
              stroke="#1a1a1a" strokeWidth={1} />
          ))}

          {/* Current level reference line */}
          <line
            x1={ML} y1={yS(CURRENT_PCT)}
            x2={ML+CW} y2={yS(CURRENT_PCT)}
            stroke="#666" strokeWidth={1} strokeDasharray="5 4" opacity={0.6}
          />
          <rect x={ML+3} y={yS(CURRENT_PCT)-9} width={48} height={14}
            rx={2} fill="#222200" stroke="#666" strokeWidth={0.5} />
          <text x={ML+27} y={yS(CURRENT_PCT)+2.5}
            textAnchor="middle"
            fill="#d4d400" fontSize={8} fontFamily="monospace" fontWeight="700">
            {CURRENT_PCT}%
          </text>

          {/* ── Gradient-colored line segments ─────────────────────────── */}
          {DATA.map((pt, i) => {
            if (i === 0) return null;
            const prev   = DATA[i - 1];
            const avgPct = (pt.pct + prev.pct) / 2;
            return (
              <line key={i}
                x1={xS(prev.t).toFixed(1)} y1={yS(prev.pct).toFixed(1)}
                x2={xS(pt.t).toFixed(1)}   y2={yS(pt.pct).toFixed(1)}
                stroke={mvrvColor(avgPct)}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            );
          })}

          {/* NOW marker */}
          <circle cx={xS(lastPt.t)} cy={yS(lastPt.pct)} r={7}
            fill="none" stroke="#fff" strokeWidth={1.5} />
          <circle cx={xS(lastPt.t)} cy={yS(lastPt.pct)} r={3.5} fill="#fff" />
          <text x={xS(lastPt.t)} y={yS(lastPt.pct) - 12}
            textAnchor="middle" fill="#fff"
            fontSize={7} fontFamily="monospace" fontWeight="700">NOW</text>

          {/* ── Hover crosshair + tooltip ───────────────────────────────── */}
          {hover && (
            <g>
              <line x1={hover.x} y1={MT} x2={hover.x} y2={MT+CH}
                stroke="#333" strokeWidth={1} strokeDasharray="3 3" />
              <line x1={ML} y1={hover.y} x2={ML+CW} y2={hover.y}
                stroke="#333" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={hover.x} cy={hover.y} r={5}
                fill={hover.color} stroke="#fff" strokeWidth={1.5} />

              {/* Tooltip */}
              <rect x={tx} y={ty} width={TW} height={TH}
                rx={4} fill="#171717" stroke={hover.color} strokeWidth={1} />
              <text x={tx+10} y={ty+15}
                fill={hover.color} fontSize={11} fontFamily="monospace" fontWeight="700">
                {hover.dateStr}
              </text>
              <line x1={tx+8} y1={ty+20} x2={tx+TW-8} y2={ty+20}
                stroke="#2a2a2a" strokeWidth={1} />
              {[
                { label:'MVRV Z-Score', val: hover.pct.toFixed(2)+'%', color:'#e0e0e0' },
                { label:'Signal',       val: hover.zone.label,          color: hover.zone.color },
                { label:'Zone',         val: hover.pct < 20 ? '0–20%' : hover.pct < 40 ? '20–40%'
                                           : hover.pct < 60 ? '40–60%' : hover.pct < 80 ? '60–80%'
                                           : '80–100%',                  color:'#888' },
              ].map(({ label, val, color }, ri) => (
                <g key={label}>
                  <text x={tx+10} y={ty+36+ri*18}
                    fill="#666" fontSize={8.5} fontFamily="monospace">{label}</text>
                  <text x={tx+TW-10} y={ty+36+ri*18}
                    textAnchor="end" fill={color}
                    fontSize={9} fontFamily="monospace" fontWeight="700">{val}</text>
                </g>
              ))}
            </g>
          )}

          {/* Y axis ticks */}
          {Y_TICKS.map(v => (
            <g key={`yt${v}`}>
              <line x1={ML-3} y1={yS(v)} x2={ML} y2={yS(v)} stroke="#333" strokeWidth={1} />
              <text x={ML-5} y={yS(v)+3.5}
                textAnchor="end" fill="#555" fontSize={9} fontFamily="monospace">{v}%</text>
            </g>
          ))}

          {/* X axis year labels */}
          {X_YEARS.map(yr => (
            <g key={yr}>
              <line x1={xS(yr)} y1={MT+CH} x2={xS(yr)} y2={MT+CH+4}
                stroke="#333" strokeWidth={1} />
              <text x={xS(yr)} y={MT+CH+16}
                textAnchor="middle" fill="#555" fontSize={9} fontFamily="monospace">{yr}</text>
            </g>
          ))}

          {/* Axis borders */}
          <line x1={ML} y1={MT} x2={ML} y2={MT+CH} stroke="#2a2a2a" strokeWidth={1} />
          <line x1={ML} y1={MT+CH} x2={ML+CW} y2={MT+CH} stroke="#2a2a2a" strokeWidth={1} />

          {/* ── Color bar (right) ───────────────────────────────────────── */}
          <rect x={BAR_X} y={MT} width={BAR_W} height={CH}
            rx={3} fill="url(#mvrvBarGrad)" />

          {/* Color bar tick lines + labels */}
          {[100, 80, 60, 40, 20, 0].map(pct => {
            const barY = MT + CH * (1 - pct / 100);
            return (
              <g key={`cb${pct}`}>
                <line x1={BAR_X-2} y1={barY} x2={BAR_X} y2={barY}
                  stroke="#111" strokeWidth={1} />
                <text x={BAR_X + BAR_W + 4} y={barY + 3.5}
                  fill="#555" fontSize={8} fontFamily="monospace">{pct}%</text>
              </g>
            );
          })}

          {/* Overbought / Oversold labels */}
          <text x={BAR_X} y={MT - 5}
            fill="#666" fontSize={7} fontFamily="monospace">Overbought</text>
          <text x={BAR_X} y={MT + CH + 12}
            fill="#666" fontSize={7} fontFamily="monospace">Oversold</text>

          {/* Current level indicator on color bar */}
          <line
            x1={BAR_X - 4} y1={yS(CURRENT_PCT)}
            x2={BAR_X + BAR_W + 2} y2={yS(CURRENT_PCT)}
            stroke="#fff" strokeWidth={1.5}
          />
        </svg>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-around px-8 pb-4 pt-1"
        style={{ borderTop:'1px solid #1a1a1a' }}>
        {[
          { label:'Current',    value: CURRENT_PCT + '%',            color: currentColor },
          { label:'24h Change', value: (up?'+':'') + CHANGE_PCT+'%', color: up ? '#00D897' : '#FF4757' },
          { label:'Signal',     value: zone.label,                   color: zone.color },
          { label:'Bull Top',   value: '96%',                        color: mvrvColor(96) },
          { label:'Bear Bottom',value: '5%',                         color: mvrvColor(5) },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign:'center' }}>
            <div style={{
              color:'#444', fontFamily:'monospace',
              fontSize:'var(--fs-micro)',
              textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3,
            }}>{label}</div>
            <div style={{
              color, fontFamily:'monospace',
              fontSize:'var(--fs-label)', fontWeight:700,
            }}>{value}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
