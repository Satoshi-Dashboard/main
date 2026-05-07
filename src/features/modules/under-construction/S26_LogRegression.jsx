// Bitcoin Log-Log Regression — Interactive
// Model: log₁₀(P_4yr_ma) = A × log₁₀(days_since_genesis) + B
// Calibrated: A=5.729, B=−17.05, R²=98.89%

import { useState, useCallback, useRef } from 'react';

// ─── Model constants ──────────────────────────────────────────────────────────
const A  = 5.729;
const B  = -17.05;
const R2 = 98.89;

const DAYS_NOW    = 6269;
const LOG_T_NOW   = Math.log10(DAYS_NOW);
const LOG_P_MODEL = A * LOG_T_NOW + B;
const P_MODEL     = Math.round(Math.pow(10, LOG_P_MODEL));
const P_4YR_MA    = 47000;
const LOG_P_NOW   = Math.log10(P_4YR_MA);
const DEV_PCT     = +((P_4YR_MA - P_MODEL) / P_MODEL * 100).toFixed(1);

const GENESIS_MS  = new Date('2009-01-03T00:00:00Z').getTime();

// ─── Data generation ─────────────────────────────────────────────────────────
const CURVE_DATA = (() => {
  const pts = [];
  const N = 400;
  for (let i = 0; i <= N; i++) {
    const logT = 2.40 + (1.40 * i) / N;
    const days  = Math.pow(10, logT);
    const base  = A * logT + B;
    const phase = (days / 1460) * 2 * Math.PI;
    const amp   = 0.11 * Math.exp(-0.42 * (logT - 2.4));
    const osc   = amp * Math.sin(phase - 1.05);
    const early = logT < 2.78 ? 0.032 * Math.sin((logT - 2.4) * 32) : 0;
    pts.push({ logT, logP: base + osc + early });
  }
  return pts;
})();

// ─── SVG layout ──────────────────────────────────────────────────────────────
const VW = 900, VH = 560;
const ML = 64, MR = 28, MT = 20, MB = 56;
const CW = VW - ML - MR;
const CH = VH - MT - MB;
const X_MIN = 2.4, X_MAX = 3.8;
const Y_MIN = -4,  Y_MAX = 5;

function xS(logT) { return ML + (logT - X_MIN) / (X_MAX - X_MIN) * CW; }
function yS(logP) { return MT + CH - (logP - Y_MIN) / (Y_MAX - Y_MIN) * CH; }

const X_TICKS = [2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8];
const Y_TICKS = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

const curvePath = CURVE_DATA.map((pt, i) =>
  `${i === 0 ? 'M' : 'L'} ${xS(pt.logT).toFixed(1)} ${yS(pt.logP).toFixed(1)}`
).join(' ');

const regPath = [
  `M ${xS(2.40).toFixed(1)} ${yS(A * 2.40 + B).toFixed(1)}`,
  `L ${xS(3.80).toFixed(1)} ${yS(A * 3.80 + B).toFixed(1)}`,
].join(' ');

const HALVINGS = [
  { days: 1458, label: "H1 '12" },
  { days: 2628, label: "H2 '16" },
  { days: 3798, label: "H3 '20" },
  { days: 4968, label: "H4 '24" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtPrice(p) {
  if (p >= 1e6) return '$' + (p / 1e6).toFixed(2) + 'M';
  if (p >= 1000) return '$' + Math.round(p).toLocaleString('en-US');
  if (p >= 1)    return '$' + p.toFixed(2);
  return '$' + p.toFixed(6);
}
function daysToDate(days) {
  const d = new Date(GENESIS_MS + days * 86400000);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function S25_LogRegression() {
  const svgRef  = useRef(null);
  const [hover, setHover] = useState(null);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect   = svg.getBoundingClientRect();
    const scaleX = VW / rect.width;
    const svgX   = (e.clientX - rect.left) * scaleX;
    const logT   = X_MIN + (svgX - ML) / CW * (X_MAX - X_MIN);
    if (logT < X_MIN || logT > X_MAX) { setHover(null); return; }

    // Binary-search nearest point
    let best = CURVE_DATA[0], bestD = Infinity;
    for (const pt of CURVE_DATA) {
      const d = Math.abs(pt.logT - logT);
      if (d < bestD) { bestD = d; best = pt; }
    }

    const days  = Math.round(Math.pow(10, best.logT));
    const price = Math.pow(10, best.logP);
    const modelLogP = A * best.logT + B;
    const modelP    = Math.pow(10, modelLogP);
    const dev       = ((price - modelP) / modelP * 100).toFixed(1);

    setHover({
      x: xS(best.logT),
      y: yS(best.logP),
      logT:  best.logT,
      logP:  best.logP,
      days,
      price: fmtPrice(price),
      date:  daysToDate(days),
      dev:   +dev,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setHover(null), []);

  // Tooltip box geometry
  const TW = 200, TH = 102;
  let tx = hover ? hover.x + 16 : 0;
  let ty = hover ? hover.y - TH / 2 : 0;
  if (hover && tx + TW > ML + CW - 4) tx = hover.x - TW - 16;
  if (hover && ty < MT + 2)           ty = MT + 2;
  if (hover && ty + TH > MT + CH - 2) ty = MT + CH - TH - 2;

  const up = DEV_PCT >= 0;

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-baseline gap-4 px-8 pt-5 pb-1 flex-wrap">
        <span style={{
          display:'inline-block', width:10, height:10, borderRadius:'50%',
          backgroundColor:'#F7931A', flexShrink:0, marginBottom:2,
        }} />
        <span style={{
          color:'#fff', fontFamily:'monospace',
          fontSize:'var(--fs-subtitle)', fontWeight:700,
        }}>
          Log-Log Regression
        </span>
        <span style={{ color:'#666', fontFamily:'monospace', fontSize:'var(--fs-caption)' }}>
          log₁₀(4yr MA Price) vs log₁₀(Days)
        </span>
        <span style={{ color:'#888', fontFamily:'monospace', fontSize:'var(--fs-caption)' }}>
          Model ≈ ${(P_MODEL / 1000).toFixed(0)}K
        </span>
        <span style={{
          color: up ? '#00D897' : '#FF4757',
          fontFamily:'monospace', fontSize:'var(--fs-caption)', fontWeight:600,
        }}>
          {up ? '+' : ''}{DEV_PCT}% {up ? '▲' : '▼'}
        </span>
      </div>

      {/* ── Chart ──────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 px-2 pb-2" style={{ cursor: hover ? 'crosshair' : 'default' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width:'100%', height:'100%' }}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Transparent hit area */}
          <rect x={ML} y={MT} width={CW} height={CH} fill="transparent" />

          {/* Grid — horizontal */}
          {Y_TICKS.map(v => (
            <line key={`gy${v}`} x1={ML} y1={yS(v)} x2={ML+CW} y2={yS(v)}
              stroke={v === 0 ? '#2a2a2a' : '#1c1c1c'} strokeWidth={v === 0 ? 1.2 : 1} />
          ))}

          {/* Grid — vertical */}
          {X_TICKS.map(v => (
            <line key={`gx${v}`} x1={xS(v)} y1={MT} x2={xS(v)} y2={MT+CH}
              stroke="#1c1c1c" strokeWidth={1} />
          ))}

          {/* Halving markers */}
          {HALVINGS.map(({ days, label }) => {
            const logT = Math.log10(days);
            if (logT < X_MIN || logT > X_MAX) return null;
            const x = xS(logT);
            return (
              <g key={label}>
                <line x1={x} y1={MT} x2={x} y2={MT+CH}
                  stroke="#2d2d2d" strokeWidth={1} strokeDasharray="4 4" />
                <text x={x+3} y={MT+13} fill="#3a3a3a" fontSize={8} fontFamily="monospace">
                  {label}
                </text>
              </g>
            );
          })}

          {/* Regression line (dashed) */}
          <path d={regPath} fill="none"
            stroke="#444" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7} />

          {/* 4yr MA data curve */}
          <path d={curvePath} fill="none"
            stroke="#F7931A" strokeWidth={2.5}
            strokeLinejoin="round" strokeLinecap="round" />

          {/* NOW marker */}
          <circle cx={xS(LOG_T_NOW)} cy={yS(LOG_P_NOW)} r={8}
            fill="none" stroke="#fff" strokeWidth={1.5} />
          <circle cx={xS(LOG_T_NOW)} cy={yS(LOG_P_NOW)} r={4} fill="#ffffff" />
          <text x={xS(LOG_T_NOW)+11} y={yS(LOG_P_NOW)+4}
            fill="#fff" fontSize={9} fontFamily="monospace" fontWeight="700">NOW</text>

          {/* ── Hover crosshair ──────────────────────────────────────────── */}
          {hover && (
            <g>
              {/* Vertical line */}
              <line x1={hover.x} y1={MT} x2={hover.x} y2={MT+CH}
                stroke="#555" strokeWidth={1} strokeDasharray="3 3" />
              {/* Horizontal line */}
              <line x1={ML} y1={hover.y} x2={ML+CW} y2={hover.y}
                stroke="#555" strokeWidth={1} strokeDasharray="3 3" />
              {/* Cursor dot */}
              <circle cx={hover.x} cy={hover.y} r={5}
                fill="#F7931A" stroke="#fff" strokeWidth={1.5} />

              {/* ── Tooltip box ─────────────────────────────────────────── */}
              <rect x={tx} y={ty} width={TW} height={TH}
                rx={5} fill="#1a1a1a" stroke="#F7931A"
                strokeWidth={1} opacity={0.97} />

              {/* Date + days */}
              <text x={tx+10} y={ty+16}
                fill="#F7931A" fontSize={11} fontFamily="monospace" fontWeight="700">
                {hover.date}
              </text>
              <text x={tx+TW-10} y={ty+16}
                textAnchor="end" fill="#666" fontSize={9} fontFamily="monospace">
                {hover.days.toLocaleString()} days
              </text>

              {/* Divider */}
              <line x1={tx+8} y1={ty+22} x2={tx+TW-8} y2={ty+22}
                stroke="#2a2a2a" strokeWidth={1} />

              {/* log₁₀(t) */}
              <text x={tx+10} y={ty+38}
                fill="#888" fontSize={9} fontFamily="monospace">log₁₀(t)</text>
              <text x={tx+TW-10} y={ty+38}
                textAnchor="end" fill="#ddd" fontSize={9} fontFamily="monospace" fontWeight="600">
                {hover.logT.toFixed(4)}
              </text>

              {/* log₁₀(P) */}
              <text x={tx+10} y={ty+54}
                fill="#888" fontSize={9} fontFamily="monospace">log₁₀(P)</text>
              <text x={tx+TW-10} y={ty+54}
                textAnchor="end" fill="#ddd" fontSize={9} fontFamily="monospace" fontWeight="600">
                {hover.logP.toFixed(4)}
              </text>

              {/* 4yr MA Price */}
              <text x={tx+10} y={ty+70}
                fill="#888" fontSize={9} fontFamily="monospace">4yr MA Price</text>
              <text x={tx+TW-10} y={ty+70}
                textAnchor="end" fill="#F7931A" fontSize={10} fontFamily="monospace" fontWeight="700">
                {hover.price}
              </text>

              {/* Deviation */}
              <text x={tx+10} y={ty+88}
                fill="#888" fontSize={9} fontFamily="monospace">vs Model</text>
              <text x={tx+TW-10} y={ty+88}
                textAnchor="end"
                fill={hover.dev >= 0 ? '#00D897' : '#FF4757'}
                fontSize={9} fontFamily="monospace" fontWeight="700">
                {hover.dev >= 0 ? '+' : ''}{hover.dev}%
              </text>
            </g>
          )}

          {/* Y axis ticks + labels */}
          {Y_TICKS.map(v => (
            <g key={`yt${v}`}>
              <line x1={ML-4} y1={yS(v)} x2={ML} y2={yS(v)} stroke="#333" strokeWidth={1} />
              <text x={ML-7} y={yS(v)+3.5}
                textAnchor="end" fill="#555" fontSize={9} fontFamily="monospace">{v}</text>
            </g>
          ))}

          {/* X axis ticks + labels */}
          {X_TICKS.map(v => (
            <g key={`xt${v}`}>
              <line x1={xS(v)} y1={MT+CH} x2={xS(v)} y2={MT+CH+4} stroke="#333" strokeWidth={1} />
              <text x={xS(v)} y={MT+CH+16}
                textAnchor="middle" fill="#555" fontSize={9} fontFamily="monospace">
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Axis borders */}
          <line x1={ML} y1={MT} x2={ML} y2={MT+CH} stroke="#2a2a2a" strokeWidth={1} />
          <line x1={ML} y1={MT+CH} x2={ML+CW} y2={MT+CH} stroke="#2a2a2a" strokeWidth={1} />

          {/* Y axis label */}
          <text x={13} y={MT+CH/2}
            textAnchor="middle" fill="#444" fontSize={10} fontFamily="monospace"
            transform={`rotate(-90,13,${MT+CH/2})`}>
            log₁₀(4-Year Moving Average of Price)
          </text>

          {/* X axis label */}
          <text x={ML+CW/2} y={VH-6}
            textAnchor="middle" fill="#444" fontSize={10} fontFamily="monospace">
            log₁₀(Time in Days)
          </text>

          {/* Legend */}
          <g transform={`translate(${ML+12},${MT+10})`}>
            <line x1={0} y1={6} x2={24} y2={6} stroke="#F7931A" strokeWidth={2.5} />
            <text x={28} y={10} fill="#777" fontSize={8} fontFamily="monospace">
              4-Year Moving Average Price
            </text>
            <line x1={0} y1={20} x2={24} y2={20}
              stroke="#444" strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={28} y={24} fill="#555" fontSize={8} fontFamily="monospace">
              Power-law fit  (a={A}, b={B})
            </text>
          </g>

          {/* R² badge */}
          <rect x={ML+CW-152} y={MT+CH-30} width={152} height={22}
            rx={4} fill="#1a1a1a" stroke="#2a2a2a" strokeWidth={1} />
          <text x={ML+CW-76} y={MT+CH-15}
            textAnchor="middle" fill="#888" fontSize={10} fontFamily="monospace">
            Model Fit (R²) = {R2}%
          </text>
        </svg>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-around px-8 pb-4 pt-2"
        style={{ borderTop:'1px solid #1a1a1a' }}>
        {[
          { label:'Slope (a)',     value: A.toFixed(3),                  color:'#F7931A' },
          { label:'Intercept (b)', value: B.toFixed(2),                  color:'#F7931A' },
          { label:'R² Fit',        value: R2 + '%',                      color:'#00D897' },
          { label:'Days',          value: DAYS_NOW.toLocaleString(),      color:'#aaa'    },
          { label:'Model Price',   value: '$'+(P_MODEL/1000).toFixed(0)+'K', color:'#aaa' },
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
