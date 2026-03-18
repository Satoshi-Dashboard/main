// Google Trends — Bitcoin Search Interest (24h) + BTC Price Correlation
// Primary: Search interest 0–100 (orange area fill)
// Secondary: BTC price $K (light-blue line, right axis)
// Shows visual correlation between search spikes and price movement

import { useState, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CURRENT_INTEREST = 41;
const CHANGE_PCT       = +20.6;

// 24-hour window: 08:10 AM → 08:16 AM (next day)
// [elapsed_hours, search_interest_0–100, btc_price_$K]
const ANCHORS = [
  [0.00, 28, 84.2], [0.50, 26, 84.0], [1.00, 25, 83.8], [1.50, 25, 83.9],
  [1.92, 25, 84.0], [2.25, 26, 84.1], [2.75, 30, 84.5], [2.95, 42, 85.2],
  [3.10, 68, 86.5], [3.25, 90, 88.0], [3.33,100, 88.5], [3.48, 65, 87.0],
  [3.58, 75, 87.5], [3.75, 65, 87.0], [3.92, 62, 86.9], [4.10, 65, 87.1],
  [4.25, 60, 86.7], [4.50, 50, 86.0], [4.75, 47, 85.8], [5.00, 46, 85.7],
  [5.25, 50, 86.0], [5.40, 63, 86.9], [5.67, 60, 86.7], [5.92, 63, 87.0],
  [6.25, 58, 86.6], [6.58, 57, 86.5], [6.92, 60, 86.7], [7.10, 58, 86.5],
  [7.20, 35, 85.0], [7.50, 33, 84.8], [8.00, 33, 84.7], [8.50, 34, 84.8],
  [9.00, 33, 84.7], [9.17, 48, 85.5], [9.42, 46, 85.3], [9.83, 42, 85.0],
  [10.5, 35, 84.6], [11.0, 33, 84.5], [11.5, 33, 84.5], [12.0, 33, 84.5],
  [12.5, 34, 84.6], [13.0, 34, 84.6], [13.5, 33, 84.5], [14.0, 33, 84.5],
  [14.5, 35, 84.7], [15.0, 38, 85.0], [15.5, 44, 85.3], [16.0, 50, 85.8],
  [16.5, 56, 86.2], [17.0, 61, 86.7], [17.25,63, 86.9], [17.5, 60, 86.6],
  [18.0, 53, 86.1], [18.5, 50, 85.8], [19.0, 50, 85.8], [19.2, 35, 84.9],
  [19.5, 33, 84.7], [20.0, 32, 84.6], [20.5, 31, 84.5], [21.0, 33, 84.6],
  [21.12,48, 85.4], [21.5, 45, 85.2], [22.0, 42, 85.0], [22.5, 38, 84.8],
  [23.0, 35, 84.6], [23.5, 34, 84.5], [24.0, 38, 84.8], [24.10,41, 85.0],
];

// ─── Pearson correlation ──────────────────────────────────────────────────────
function pearson(xs, ys) {
  const n  = xs.length;
  const mx = xs.reduce((a,b) => a+b, 0) / n;
  const my = ys.reduce((a,b) => a+b, 0) / n;
  const num = xs.reduce((s,x,i) => s + (x-mx)*(ys[i]-my), 0);
  const dx  = Math.sqrt(xs.reduce((s,x) => s+(x-mx)**2, 0));
  const dy  = Math.sqrt(ys.reduce((s,y) => s+(y-my)**2, 0));
  return +(num / (dx * dy)).toFixed(2);
}

const SEARCHES     = ANCHORS.map(a => a[1]);
const BTCPRICES    = ANCHORS.map(a => a[2]);
const CORR         = pearson(SEARCHES, BTCPRICES);
const PEAK_VAL     = Math.max(...SEARCHES);
const CURRENT_BTC  = BTCPRICES[BTCPRICES.length - 1];

// ─── SVG layout ───────────────────────────────────────────────────────────────
const VW = 900, VH = 520;
const ML = 46, MR = 58, MT = 16, MB = 40;
const CW = VW - ML - MR;
const CH = VH - MT - MB;

const H_MIN = 0,    H_MAX = 24.3;
const S_MIN = 0,    S_MAX = 100;
const BTC_LO = 83.4, BTC_HI = 89.2;

function xS(h) { return ML + (h - H_MIN) / (H_MAX - H_MIN) * CW; }
function yS(s) { return MT + CH - (s - S_MIN) / (S_MAX - S_MIN) * CH; }
function yB(p) { return MT + CH - (p - BTC_LO) / (BTC_HI - BTC_LO) * CH; }

const Y_TICKS   = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const BTC_TICKS = [84, 85, 86, 87, 88, 89];

// Time labels at key reference positions [hours_elapsed, display_time]
const X_LABELS = [
  [0.00,  '08:10'],
  [1.92,  '10:05'],
  [3.33,  '11:30'],
  [17.25, '01:25'],
  [19.20, '03:22'],
  [21.12, '05:17'],
  [24.10, '08:16'],
];

// ─── Smooth bezier path builder ───────────────────────────────────────────────
function buildPath(pts) {
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i-1], p1 = pts[i];
    const cx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C ${cx},${p0.y.toFixed(1)} ${cx},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }
  return d;
}

const TREND_PTS  = ANCHORS.map(a => ({ x: xS(a[0]), y: yS(a[1]) }));
const BTC_PTS    = ANCHORS.map(a => ({ x: xS(a[0]), y: yB(a[2]) }));
const TREND_LINE = buildPath(TREND_PTS);
const BTC_LINE   = buildPath(BTC_PTS);
const AREA_PATH  = (() => {
  const botY = (MT + CH).toFixed(1);
  const last  = TREND_PTS[TREND_PTS.length - 1];
  const first = TREND_PTS[0];
  return `${TREND_LINE} L ${last.x.toFixed(1)},${botY} L ${first.x.toFixed(1)},${botY} Z`;
})();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function elapsedToTime(h) {
  const totalMin = Math.round(8 * 60 + 10 + h * 60);
  const hrs  = Math.floor(totalMin / 60) % 24;
  const mins = totalMin % 60;
  return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
}
function signalOf(s) {
  if (s < 20) return { label: 'Low Interest',   color: '#556' };
  if (s < 40) return { label: 'Normal',          color: '#888' };
  if (s < 60) return { label: 'Growing',         color: '#F7931A' };
  if (s < 80) return { label: 'High Interest',   color: '#FFcc00' };
  return             { label: 'Extreme / FOMO',  color: '#FF4757' };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function S27_GoogleTrends() {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const up = CHANGE_PCT >= 0;

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (VW / rect.width);
    const h    = H_MIN + (svgX - ML) / CW * (H_MAX - H_MIN);
    if (h < H_MIN || h > H_MAX) { setHover(null); return; }

    let best = ANCHORS[0], bestD = Infinity;
    for (const a of ANCHORS) {
      const d = Math.abs(a[0] - h);
      if (d < bestD) { bestD = d; best = a; }
    }
    setHover({
      x:    xS(best[0]),
      yS:   yS(best[1]),
      yB:   yB(best[2]),
      s:    best[1],
      p:    best[2],
      time: elapsedToTime(best[0]),
    });
  }, []);

  const handleMouseLeave = useCallback(() => setHover(null), []);

  // Tooltip geometry
  const TW = 178, TH = 84;
  let tx = hover ? hover.x + 14 : 0;
  let ty = hover ? hover.yS - TH / 2 : 0;
  if (hover && tx + TW > ML + CW - 2) tx = hover.x - TW - 14;
  if (hover && ty < MT + 2)           ty = MT + 2;
  if (hover && ty + TH > MT + CH - 2) ty = MT + CH - TH - 2;

  const lastTrend = TREND_PTS[TREND_PTS.length - 1];

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex-none pt-4 pb-0 text-center">
        <div style={{
          color: '#F7931A', fontFamily: 'monospace',
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3,
        }}>
          Google Trends
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
          <span style={{
            display:'inline-block', width:12, height:12, borderRadius:'50%',
            backgroundColor:'#00D897', flexShrink:0,
          }} />
          <span style={{
            color:'#fff', fontFamily:'monospace',
            fontSize:'var(--fs-title)', fontWeight:700,
          }}>
            Search Interest: {CURRENT_INTEREST}
          </span>
          <span style={{
            color: up ? '#00D897' : '#FF4757',
            fontFamily:'monospace',
            fontSize:'var(--fs-section)', fontWeight:600,
          }}>
            {up ? '+' : ''}{CHANGE_PCT}% {up ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* ── Chart ────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 px-1"
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
            <linearGradient id="gtFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#F7931A" stopOpacity="0.45" />
              <stop offset="55%"  stopColor="#F7931A" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#F7931A" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Hit area */}
          <rect x={ML} y={MT} width={CW} height={CH} fill="transparent" />

          {/* Faint horizontal grid */}
          {Y_TICKS.map(v => (
            <line key={v}
              x1={ML} y1={yS(v)} x2={ML+CW} y2={yS(v)}
              stroke="#1a1a1a" strokeWidth={1} />
          ))}

          {/* ── Area fill (search interest) ─────────────────────────────── */}
          <path d={AREA_PATH} fill="url(#gtFill)" />

          {/* ── BTC price line (secondary, right axis) ──────────────────── */}
          <path d={BTC_LINE} fill="none"
            stroke="rgba(100,190,255,0.50)" strokeWidth={1.8}
            strokeLinejoin="round" strokeLinecap="round"
            strokeDasharray="none"
          />

          {/* ── Search interest line (orange, primary) ──────────────────── */}
          <path d={TREND_LINE} fill="none"
            stroke="#F7931A" strokeWidth={2.5}
            strokeLinejoin="round" strokeLinecap="round" />

          {/* NOW marker */}
          <circle cx={lastTrend.x} cy={lastTrend.y} r={7}
            fill="none" stroke="#fff" strokeWidth={1.5} />
          <circle cx={lastTrend.x} cy={lastTrend.y} r={3.5} fill="#fff" />
          <text x={lastTrend.x} y={lastTrend.y - 12}
            textAnchor="middle" fill="#fff"
            fontSize={7} fontFamily="monospace" fontWeight="700">NOW</text>

          {/* ── Hover crosshair + tooltip ───────────────────────────────── */}
          {hover && (() => {
            const sig = signalOf(hover.s);
            return (
              <g>
                {/* Vertical crosshair */}
                <line x1={hover.x} y1={MT} x2={hover.x} y2={MT+CH}
                  stroke="#333" strokeWidth={1} strokeDasharray="3 3" />
                {/* Horizontal at search interest */}
                <line x1={ML} y1={hover.yS} x2={ML+CW} y2={hover.yS}
                  stroke="#2a2a2a" strokeWidth={1} strokeDasharray="3 3" />

                {/* Dots on both lines */}
                <circle cx={hover.x} cy={hover.yS} r={5}
                  fill="#F7931A" stroke="#fff" strokeWidth={1.5} />
                <circle cx={hover.x} cy={hover.yB} r={4}
                  fill="rgba(100,190,255,0.9)" stroke="#fff" strokeWidth={1} />

                {/* Tooltip box */}
                <rect x={tx} y={ty} width={TW} height={TH}
                  rx={4} fill="#171717" stroke="#F7931A" strokeWidth={1} />
                <text x={tx+10} y={ty+15}
                  fill="#F7931A" fontSize={11} fontFamily="monospace" fontWeight="700">
                  {hover.time}
                </text>
                <line x1={tx+8} y1={ty+20} x2={tx+TW-8} y2={ty+20}
                  stroke="#2a2a2a" strokeWidth={1} />
                {[
                  { label:'Search Interest', val:`${hover.s.toFixed(0)} / 100`,  color:'#F7931A' },
                  { label:'BTC Price',        val:`$${hover.p.toFixed(1)}K`,      color:'rgba(100,190,255,0.95)' },
                  { label:'Signal',           val: sig.label,                     color: sig.color },
                ].map(({ label, val, color }, i) => (
                  <g key={label}>
                    <text x={tx+10} y={ty+36+i*17}
                      fill="#666" fontSize={8.5} fontFamily="monospace">{label}</text>
                    <text x={tx+TW-10} y={ty+36+i*17}
                      textAnchor="end" fill={color}
                      fontSize={9} fontFamily="monospace" fontWeight="700">{val}</text>
                  </g>
                ))}
              </g>
            );
          })()}

          {/* ── Y axis left (search interest) ──────────────────────────── */}
          {Y_TICKS.map(v => (
            <g key={`yt${v}`}>
              <line x1={ML-3} y1={yS(v)} x2={ML} y2={yS(v)} stroke="#333" strokeWidth={1} />
              <text x={ML-5} y={yS(v)+3.5}
                textAnchor="end" fill="#555" fontSize={9} fontFamily="monospace">{v}</text>
            </g>
          ))}

          {/* ── Y axis right (BTC price) ────────────────────────────────── */}
          {BTC_TICKS.map(v => {
            const y = yB(v);
            if (y < MT - 4 || y > MT + CH + 4) return null;
            return (
              <g key={`bt${v}`}>
                <line x1={ML+CW} y1={y} x2={ML+CW+3} y2={y} stroke="#333" strokeWidth={1} />
                <text x={ML+CW+6} y={y+3.5}
                  fill="rgba(100,190,255,0.55)" fontSize={8} fontFamily="monospace">
                  ${v}K
                </text>
              </g>
            );
          })}

          {/* ── X axis time labels ──────────────────────────────────────── */}
          {X_LABELS.map(([h, label]) => {
            const x = xS(h);
            return (
              <g key={label}>
                <line x1={x} y1={MT+CH} x2={x} y2={MT+CH+4} stroke="#333" strokeWidth={1} />
                <text x={x} y={MT+CH+16}
                  textAnchor="middle" fill="#555" fontSize={9} fontFamily="monospace">
                  {label}
                </text>
              </g>
            );
          })}

          {/* Axis borders */}
          <line x1={ML} y1={MT} x2={ML} y2={MT+CH} stroke="#2a2a2a" strokeWidth={1} />
          <line x1={ML} y1={MT+CH} x2={ML+CW} y2={MT+CH} stroke="#2a2a2a" strokeWidth={1} />

          {/* Legend — top left */}
          <g transform={`translate(${ML+10},${MT+10})`}>
            <line x1={0} y1={6} x2={22} y2={6} stroke="#F7931A" strokeWidth={2.5} />
            <text x={26} y={10} fill="#888" fontSize={8} fontFamily="monospace">
              Search Interest (0–100)
            </text>
            <line x1={0} y1={20} x2={22} y2={20}
              stroke="rgba(100,190,255,0.55)" strokeWidth={1.8} />
            <text x={26} y={24} fill="#555" fontSize={8} fontFamily="monospace">
              BTC Price (right axis)
            </text>
          </g>

          {/* Correlation badge — top right */}
          <rect x={ML+CW-145} y={MT+8} width={145} height={22}
            rx={4} fill="#1a1a1a" stroke="#2a2a2a" strokeWidth={1} />
          <text x={ML+CW-72} y={MT+23}
            textAnchor="middle" fill="#88BBff" fontSize={10} fontFamily="monospace">
            Correlation R = {CORR}
          </text>
        </svg>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-around px-8 pb-4 pt-1"
        style={{ borderTop:'1px solid #1a1a1a' }}>
        {[
          { label:'Search Interest', value:`${CURRENT_INTEREST}/100`,            color:'#F7931A' },
          { label:'24h Change',      value:`${up?'+':''}${CHANGE_PCT}%`,          color: up ? '#00D897' : '#FF4757' },
          { label:'Corr. (R)',       value: CORR.toFixed(2),                      color:'#88BBFF' },
          { label:'BTC (current)',   value:`$${CURRENT_BTC.toFixed(1)}K`,         color:'rgba(100,190,255,0.9)' },
          { label:'Peak (24h)',      value:`${PEAK_VAL}/100`,                     color:'#FF4757' },
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
