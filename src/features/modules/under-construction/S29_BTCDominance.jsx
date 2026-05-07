// Historical Annual Returns — BTC Performance Analytics
// Y axis auto-adapts to data. Dual-zone scale with fixed negative zone height.

import { useState, useCallback, useRef } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────
const ANNUAL_RETURNS = [
  { year: 2011, pct: 1467 },
  { year: 2012, pct: 187 },
  { year: 2013, pct: 5870 },
  { year: 2014, pct: -61 },
  { year: 2015, pct: 35 },
  { year: 2016, pct: 124 },
  { year: 2017, pct: 1338 },
  { year: 2018, pct: -73 },
  { year: 2019, pct: 94 },
  { year: 2020, pct: 302 },
  { year: 2021, pct: 60 },
  { year: 2022, pct: -64 },
  { year: 2023, pct: 156 },
  { year: 2024, pct: 121 },
  { year: 2025, pct: 25.85, live: true },
];

const CAGR    = 136.03;
const STD_DEV = 85.85;
const SHARPE  = 0.66;

const BEST_MONTHS = [
  { label: 'November 2013', pct: +450.0 },
  { label: 'March 2013',    pct: +186.8 },
  { label: 'May 2017',      pct: +70.2  },
];
const WORST_MONTHS = [
  { label: 'September 2011', pct: -39.7 },
  { label: 'June 2022',      pct: -37.3 },
  { label: 'November 2018',  pct: -37.0 },
];
const KEY_STATS = [
  { label: 'Max Drawdown',   value: '-84.2%', color: '#FF4757' },
  { label: 'Positive Years', value: '12/15',  color: '#00D897' },
  { label: 'Best Year',      value: '2013',   color: '#F7931A' },
];

// ─── Auto-compute Y ranges from data ──────────────────────────────────────────
const MAX_POS_RAW = Math.max(...ANNUAL_RETURNS.map(d => d.pct));
const MAX_NEG_RAW = Math.abs(Math.min(...ANNUAL_RETURNS.map(d => d.pct)));

// Round Y_POS_MAX up to next clean thousand
const Y_POS_MAX = Math.ceil(MAX_POS_RAW / 1000) * 1000;

// Y-axis ticks: step 1000 (or 500 if max ≤ 2000)
const TICK_STEP = Y_POS_MAX <= 2000 ? 500 : 1000;
const Y_POS_TICKS = Array.from(
  { length: Math.floor(Y_POS_MAX / TICK_STEP) + 1 },
  (_, i) => i * TICK_STEP
);

// ─── SVG layout ───────────────────────────────────────────────────────────────
const VW = 900, VH = 500;
const ML = 62, MR = 16, MT = 38, MB = 38;
const CW = VW - ML - MR;
const CH = VH - MT - MB;   // total chart pixel height

// Negative zone: fixed 100px so bars are clearly visible regardless of max_pos
const CH_NEG = 100;
const CH_POS = CH - CH_NEG;

const ZERO_Y = MT + CH_POS;   // y-coordinate of the 0% line

function yScale(v) {
  if (v >= 0) {
    // map [0, Y_POS_MAX] → [ZERO_Y, MT]
    return ZERO_Y - (v / Y_POS_MAX) * CH_POS;
  }
  // map [0, -MAX_NEG_RAW] → [ZERO_Y, ZERO_Y + CH_NEG]
  return ZERO_Y + (Math.abs(v) / MAX_NEG_RAW) * CH_NEG;
}

const BAR_COUNT = ANNUAL_RETURNS.length;
const BAR_SLOT  = CW / BAR_COUNT;
const BAR_W     = BAR_SLOT * 0.60;

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatPct(pct) {
  const abs  = Math.abs(pct);
  const sign = pct >= 0 ? '+' : '-';
  if (abs >= 1000) {
    const k   = Math.floor(abs / 1000);
    const rem = Math.round(abs % 1000);
    return `${sign}${k},${String(rem).padStart(3, '0')}%`;
  }
  if (abs % 1 !== 0) return `${sign}${abs.toFixed(2)}%`;
  return `${sign}${Math.round(abs)}%`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function S28_BTCDominance() {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX  = (e.clientX - rect.left) * (VW / rect.width);
    const idx   = Math.floor((svgX - ML) / BAR_SLOT);
    if (idx < 0 || idx >= BAR_COUNT) { setHover(null); return; }
    setHover(ANNUAL_RETURNS[idx]);
  }, []);

  const handleMouseLeave = useCallback(() => setHover(null), []);

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">

      {/* ── Stat boxes ───────────────────────────────────────────────────── */}
      <div className="flex-none grid grid-cols-3 gap-3 px-5 pt-4 pb-3">
        {[
          { label: '~ Compound Annual Growth Rate', value: `+${CAGR}%`,  sub: 'Since 2010',                       color: '#00D897' },
          { label: '||| Standard Deviation',         value: `${STD_DEV}%`, sub: 'Annual Volatility (5-Year Period)', color: '#F7931A' },
          { label: '= Sharpe Ratio',                 value: `${SHARPE}`,   sub: 'Risk-Adjusted Return',             color: '#38BDF8' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{
            background: '#161616', border: '1px solid #262626',
            borderRadius: 8, padding: '12px 14px', textAlign: 'center',
          }}>
            <div style={{
              color: '#555', fontFamily: 'monospace',
              fontSize: 'var(--fs-micro)',
              textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 4,
            }}>{label}</div>
            <div style={{
              color, fontFamily: 'monospace',
              fontSize: 'var(--fs-title)', fontWeight: 700,
              letterSpacing: '-0.02em',
            }}>{value}</div>
            <div style={{
              color: '#444', fontFamily: 'monospace',
              fontSize: 'var(--fs-micro)', marginTop: 3,
            }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 flex gap-3 px-5 pb-2">

        {/* Left: chart */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div style={{
            color: '#444', fontFamily: 'monospace',
            fontSize: 'var(--fs-micro)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3,
          }}>
            Historical Annual Returns
          </div>

          <div className="flex-1" style={{ cursor: hover ? 'crosshair' : 'default' }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VW} ${VH}`}
              style={{ width: '100%', height: '100%' }}
              preserveAspectRatio="xMidYMid meet"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {/* ── Positive grid lines ────────────────────────────────── */}
              {Y_POS_TICKS.filter(v => v > 0).map(v => (
                <line key={v}
                  x1={ML} y1={yScale(v)} x2={ML + CW} y2={yScale(v)}
                  stroke="#1c1c1c" strokeWidth={1}
                />
              ))}

              {/* ── Negative zone background ───────────────────────────── */}
              <rect x={ML} y={ZERO_Y} width={CW} height={CH_NEG}
                fill="#FF4757" fillOpacity={0.05} />

              {/* Negative grid line at -MAX (bottom) */}
              <line x1={ML} y1={ZERO_Y + CH_NEG} x2={ML + CW} y2={ZERO_Y + CH_NEG}
                stroke="#2a1515" strokeWidth={1} strokeDasharray="4 3" />

              {/* ── Zero line ──────────────────────────────────────────── */}
              <line x1={ML} y1={ZERO_Y} x2={ML + CW} y2={ZERO_Y}
                stroke="#3a3a3a" strokeWidth={1.5} />

              {/* ── Y axis labels (positive) ───────────────────────────── */}
              {Y_POS_TICKS.map(v => (
                <text key={`yt${v}`}
                  x={ML - 6} y={yScale(v) + 3.5}
                  textAnchor="end" fill="#444" fontSize={9} fontFamily="monospace"
                >
                  {v === 0 ? '0%' : `${(v / 1000).toFixed(0)}k%`}
                </text>
              ))}

              {/* ── Y axis label (negative max) ────────────────────────── */}
              <text x={ML - 6} y={ZERO_Y + CH_NEG + 3.5}
                textAnchor="end" fill="#553333" fontSize={8} fontFamily="monospace">
                -{Math.round(MAX_NEG_RAW)}%
              </text>

              {/* ── Bars ───────────────────────────────────────────────── */}
              {ANNUAL_RETURNS.map((d, i) => {
                const barX     = ML + i * BAR_SLOT + (BAR_SLOT - BAR_W) / 2;
                const isPos    = d.pct >= 0;
                const barTop   = isPos ? yScale(d.pct) : ZERO_Y;
                const barH     = Math.max(Math.abs(yScale(d.pct) - ZERO_Y), 2);
                const barColor = isPos ? '#00D897' : '#FF4757';
                const isHov    = hover?.year === d.year;
                const hColor   = isPos ? '#00ffb0' : '#ff6b7a';
                const label    = formatPct(d.pct);

                // Label positioning
                // Positive: above bar, clamped to not overflow top
                const posLabelY = Math.max(MT + 11, barTop - 4);
                // Tall bars (2013, etc.): label inside near top
                const insideBar = isPos && barTop < MT + 16;
                // Negative: centered inside bar (bar is always ≥ 60px for worst case)
                const negLabelY = ZERO_Y + barH / 2 + 4;

                return (
                  <g key={d.year}>
                    <rect x={barX} y={barTop} width={BAR_W} height={barH}
                      fill={isHov ? hColor : barColor} rx={2} />

                    {/* % label */}
                    <text
                      x={barX + BAR_W / 2}
                      y={isPos ? (insideBar ? barTop + 16 : posLabelY) : negLabelY}
                      textAnchor="middle"
                      fill={isHov ? '#fff' : (isPos ? barColor : '#fff')}
                      fontSize={isHov ? 9 : 8}
                      fontFamily="monospace" fontWeight="700"
                    >
                      {label}
                    </text>

                    {/* Year label */}
                    <text
                      x={barX + BAR_W / 2} y={MT + CH + 16}
                      textAnchor="middle"
                      fill={isHov ? '#F7931A' : '#555'}
                      fontSize={8.5} fontFamily="monospace"
                    >
                      {d.year}
                    </text>

                    {/* Live dot */}
                    {d.live && (
                      <circle cx={barX + BAR_W / 2 + 14} cy={MT + CH + 12}
                        r={3} fill="#00D897" />
                    )}
                  </g>
                );
              })}

              {/* ── Hover tooltip ──────────────────────────────────────── */}
              {hover && (() => {
                const idx   = ANNUAL_RETURNS.findIndex(d => d.year === hover.year);
                const barX  = ML + idx * BAR_SLOT + (BAR_SLOT - BAR_W) / 2;
                const isPos = hover.pct >= 0;
                const TW = 148, TH = 56;
                let tx = barX + BAR_W + 8;
                let ty = ZERO_Y - TH - 8;
                if (tx + TW > ML + CW) tx = barX - TW - 8;
                if (ty < MT) ty = MT + 4;
                return (
                  <g>
                    <rect x={tx} y={ty} width={TW} height={TH}
                      rx={4} fill="#171717" stroke="#F7931A" strokeWidth={1} />
                    <text x={tx + 10} y={ty + 15}
                      fill="#F7931A" fontSize={11} fontFamily="monospace" fontWeight="700">
                      {hover.year}{hover.live ? ' ●' : ''}
                    </text>
                    <line x1={tx + 8} y1={ty + 20} x2={tx + TW - 8} y2={ty + 20}
                      stroke="#2a2a2a" strokeWidth={1} />
                    <text x={tx + 10} y={ty + 34}
                      fill="#666" fontSize={9} fontFamily="monospace">Annual Return</text>
                    <text x={tx + TW - 10} y={ty + 34}
                      textAnchor="end"
                      fill={isPos ? '#00D897' : '#FF4757'}
                      fontSize={10} fontFamily="monospace" fontWeight="700">
                      {formatPct(hover.pct)}
                    </text>
                    <text x={tx + 10} y={ty + 48}
                      fill="#666" fontSize={9} fontFamily="monospace">Year type</text>
                    <text x={tx + TW - 10} y={ty + 48}
                      textAnchor="end"
                      fill={isPos ? '#00D897' : '#FF4757'}
                      fontSize={9} fontFamily="monospace" fontWeight="600">
                      {isPos ? 'Bull Year' : 'Bear Year'}
                    </text>
                  </g>
                );
              })()}

              {/* ── Axes ───────────────────────────────────────────────── */}
              <line x1={ML} y1={MT} x2={ML} y2={MT + CH} stroke="#2a2a2a" strokeWidth={1} />
              <line x1={ML} y1={MT + CH} x2={ML + CW} y2={MT + CH} stroke="#2a2a2a" strokeWidth={1} />
            </svg>
          </div>
        </div>

        {/* Right: stat panels */}
        <div className="flex-none flex flex-col gap-1" style={{ width: 220 }}>

          {/* Best Months */}
          <div style={{
            background: '#161616', border: '1px solid #1c2a1c',
            borderRadius: 8, padding: '8px 12px', flex: 1,
          }}>
            <div style={{
              color: '#00D897', fontFamily: 'monospace',
              fontSize: 'var(--fs-micro)', fontWeight: 700, marginBottom: 8,
            }}>
              ↑ Best Months
            </div>
            {BEST_MONTHS.map((m, i) => (
              <div key={i} style={{
                marginBottom: i < BEST_MONTHS.length - 1 ? 8 : 0,
              }}>
                <div style={{
                  color: '#666', fontFamily: 'monospace', fontSize: 'var(--fs-micro)',
                  marginBottom: 1,
                }}>{m.label}</div>
                <div style={{
                  color: '#00D897', fontFamily: 'monospace',
                  fontSize: 'var(--fs-caption)', fontWeight: 700,
                }}>+{m.pct.toFixed(1)}%</div>
              </div>
            ))}
          </div>

          {/* Worst Months */}
          <div style={{
            background: '#161616', border: '1px solid #2a1c1c',
            borderRadius: 8, padding: '8px 12px', flex: 1,
          }}>
            <div style={{
              color: '#FF4757', fontFamily: 'monospace',
              fontSize: 'var(--fs-micro)', fontWeight: 700, marginBottom: 8,
            }}>
              ↓ Worst Months
            </div>
            {WORST_MONTHS.map((m, i) => (
              <div key={i} style={{
                marginBottom: i < WORST_MONTHS.length - 1 ? 8 : 0,
              }}>
                <div style={{
                  color: '#666', fontFamily: 'monospace', fontSize: 'var(--fs-micro)',
                  marginBottom: 1,
                }}>{m.label}</div>
                <div style={{
                  color: '#FF4757', fontFamily: 'monospace',
                  fontSize: 'var(--fs-caption)', fontWeight: 700,
                }}>{m.pct.toFixed(1)}%</div>
              </div>
            ))}
          </div>

          {/* Key Statistics */}
          <div style={{
            background: '#161616', border: '1px solid #2a2a1a',
            borderRadius: 8, padding: '8px 12px', flex: 1,
          }}>
            <div style={{
              color: '#F7931A', fontFamily: 'monospace',
              fontSize: 'var(--fs-micro)', fontWeight: 700, marginBottom: 8,
            }}>
              = Key Statistics
            </div>
            {KEY_STATS.map((s, i) => (
              <div key={i} style={{
                marginBottom: i < KEY_STATS.length - 1 ? 8 : 0,
              }}>
                <div style={{
                  color: '#666', fontFamily: 'monospace', fontSize: 'var(--fs-micro)',
                  marginBottom: 1,
                }}>{s.label}</div>
                <div style={{
                  color: s.color, fontFamily: 'monospace',
                  fontSize: 'var(--fs-caption)', fontWeight: 700,
                }}>{s.value}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
