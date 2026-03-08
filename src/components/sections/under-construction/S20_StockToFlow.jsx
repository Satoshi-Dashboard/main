// Bitcoin Stock-to-Flow — log-log SVG scatter chart
// Model: price ≈ 0.34 × SF^2.94  (simplified PlanB)
// Dots colored by months-to-next-halving (blue=far, red=near)

// Halvings (fractional year)
const HALVINGS_Y = [2012.907, 2016.524, 2020.356, 2024.300, 2028.295];

// Historical quarterly data: [year, sf, price, mthsToNextHalving]
// S2F jumps at each halving (supply rate halves)
const RAW = [
  // 2010-2012 (pre-halving 1)
  [2010.5,  0.4,  0.07, 28], [2010.8,  0.8,  0.30, 25], [2011.0,  1.2,  1.00, 23],
  [2011.3,  2.0,  8.0,  20], [2011.5,  2.5, 14.0,  17], [2011.8,  3.5,  4.0,  13],
  [2012.0,  4.5,  5.5,  11], [2012.3,  5.5,  5.0,   8], [2012.6,  6.5,  9.0,   4],
  [2012.85, 7.5, 11.5,   1],
  // 2012-2016 (post-halving 1, pre-halving 2)
  [2013.1, 13,   20,  42], [2013.3, 14, 130,  40], [2013.6, 14,  90,  36],
  [2013.9, 15, 800,  34], [2014.1, 15, 600,  30], [2014.5, 17, 450,  26],
  [2014.8, 17, 330,  21], [2015.0, 18, 220,  19], [2015.3, 19, 240,  16],
  [2015.6, 19, 280,  13], [2015.9, 20, 390,  10], [2016.2, 21, 400,   4],
  [2016.4, 22, 450,   1],
  // 2016-2020 (post-halving 2, pre-halving 3)
  [2016.6, 24,  660,  46], [2016.9, 25,  750,  43], [2017.1, 25,  1000, 40],
  [2017.4, 26,  2200, 36], [2017.6, 27,  4000, 34], [2017.8, 27,  9000, 31],
  [2017.95,28, 19000, 29], [2018.2, 28, 10000, 26], [2018.5, 28,  7500, 22],
  [2018.8, 29,  4200, 19], [2019.0, 29,  3500, 17], [2019.2, 30,  5200, 14],
  [2019.5, 30, 10000, 11], [2019.8, 31,  8000,  7], [2020.0, 31,  7200,  4],
  [2020.2, 32,  7600,  2],
  // 2020-2024 (post-halving 3, pre-halving 4)
  [2020.4, 55,  8700,  47], [2020.6, 57,  9500,  45], [2020.8, 58, 13500, 43],
  [2020.95,60, 29000,  40], [2021.1, 61, 40000,  38], [2021.3, 62, 50000, 36],
  [2021.5, 63, 32000,  34], [2021.6, 63, 41000,  33], [2021.85,65, 63000, 30],
  [2022.0, 65, 47000,  28], [2022.3, 67, 30000,  24], [2022.5, 68, 20000, 22],
  [2022.8, 69, 17000,  19], [2023.0, 69, 23000,  16], [2023.3, 70, 27000,  13],
  [2023.6, 71, 29000,  10], [2023.8, 71, 34000,   7], [2023.95,72, 43000,  4],
  [2024.1, 73, 65000,   2],
  // 2024-2026 (post-halving 4)
  [2024.35,120, 64000, 47], [2024.5, 122, 60000, 45], [2024.7, 124, 59000, 43],
  [2024.85,125, 67000, 43], [2024.95,127, 97000, 40], [2025.1, 128, 94000, 38],
  [2025.3, 130, 82000, 36], [2025.5, 131,105000, 34], [2025.7, 132,104000, 32],
  [2025.9, 133, 99000, 30], [2026.0, 134, 90000, 28], [2026.17,135, 84000, 26],
];

// Model line: price = 0.34 × SF^2.94
const MODEL_C   = 0.34;
const MODEL_EXP = 2.94;
function modelP(sf) { return MODEL_C * Math.pow(sf, MODEL_EXP); }

// SVG layout
const VW = 900;
const VH = 580;
const ML = 72;
const MR = 24;
const MT = 18;
const MB = 54;
const CW = VW - ML - MR;
const CH = VH - MT - MB;

const SF_MIN_LOG  = Math.log10(0.3);
const SF_MAX_LOG  = Math.log10(200);
const P_MIN_LOG   = Math.log10(0.05);
const P_MAX_LOG   = Math.log10(300000);

function xScale(sf)  { return ML + (Math.log10(sf) - SF_MIN_LOG) / (SF_MAX_LOG - SF_MIN_LOG) * CW; }
function yScale(p)   { return MT + CH - (Math.log10(p) - P_MIN_LOG) / (P_MAX_LOG - P_MIN_LOG) * CH; }

// Color dots by months-to-halving (0=red, 48=blue)
function dotColor(mths) {
  const t = Math.max(0, Math.min(1, mths / 48));
  // blue(0) → yellow → red: t=1→blue, t=0→red
  const r = Math.round(255 * (1 - t));
  const g = Math.round(140 * Math.min(t * 2, 1) * (1 - Math.max(0, t * 2 - 1)));
  const b = Math.round(255 * t);
  return `rgb(${r},${g},${b})`;
}

// Model line path (straight in log-log space → use many points)
const modelPath = (() => {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const sf = Math.pow(10, SF_MIN_LOG + i / 60 * (SF_MAX_LOG - SF_MIN_LOG));
    const p  = modelP(sf);
    const x  = xScale(sf);
    const y  = yScale(p);
    if (y < MT - 5 || y > MT + CH + 5) continue;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return 'M ' + pts.join(' L ');
})();

// Axes ticks
const X_SF_TICKS  = [0.5, 1, 2, 5, 10, 20, 50, 100];
const Y_P_TICKS   = [0.1, 1, 10, 100, 1000, 10000, 100000];
const Y_P_LABELS  = ['$0.1', '$1', '$10', '$100', '$1K', '$10K', '$100K'];

// Halving S2F step markers (vertical dashed lines at S2F jump)
const HALVING_SF  = [8, 24, 56, 120];
const HALVING_LABELS = ['H1 \'12', 'H2 \'16', 'H3 \'20', 'H4 \'24'];

// Current values
const CURRENT_SF  = 135;
const CURRENT_P   = 84000;
const MODEL_NOW   = modelP(CURRENT_SF);

export default function S20_StockToFlow() {
  const devPct = +((CURRENT_P - MODEL_NOW) / MODEL_NOW * 100).toFixed(1);
  const up = devPct >= 0;

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Header */}
      <div className="flex-none flex items-baseline gap-4 px-8 pt-5 pb-1">
        <span className="inline-block h-3 w-3 flex-none rounded-full bg-green-400" style={{ marginBottom: 2 }} />
        <span
          style={{
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 700,
          }}
        >
          Stock-to-Flow Model
        </span>
        <span
          style={{
            color: '#888',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-caption)',
          }}
        >
          S2F={CURRENT_SF} · Model ${Math.round(MODEL_NOW / 1000)}K
        </span>
        <span
          style={{
            color: up ? '#00D897' : '#FF4757',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-label)',
            fontWeight: 600,
          }}
        >
          {up ? '+' : ''}{devPct}% {up ? '▲' : '▼'}
        </span>
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1 px-2 pb-2">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid */}
          {Y_P_TICKS.map((p) => {
            const y = yScale(p);
            if (y < MT || y > MT + CH) return null;
            return <line key={p} x1={ML} y1={y} x2={ML + CW} y2={y} stroke="#1a1a1a" strokeWidth={1} />;
          })}
          {X_SF_TICKS.map((sf) => {
            const x = xScale(sf);
            if (x < ML || x > ML + CW) return null;
            return <line key={sf} x1={x} y1={MT} x2={x} y2={MT + CH} stroke="#1a1a1a" strokeWidth={1} />;
          })}

          {/* Halving vertical lines */}
          {HALVING_SF.map((sf, i) => {
            const x = xScale(sf);
            return (
              <g key={sf}>
                <line x1={x} y1={MT} x2={x} y2={MT + CH}
                  stroke="#2a2a2a" strokeWidth={1} strokeDasharray="4 3" />
                <text x={x + 3} y={MT + 12} fill="#444" fontSize={8} fontFamily="monospace">
                  {HALVING_LABELS[i]}
                </text>
              </g>
            );
          })}

          {/* Model line (green) */}
          <path d={modelPath} fill="none" stroke="#00cc66" strokeWidth={2.5} opacity={0.85} />

          {/* Scatter dots */}
          {RAW.map(([, sf, price, mths], i) => {
            const x = xScale(sf);
            const y = yScale(price);
            if (x < ML || x > ML + CW || y < MT || y > MT + CH) return null;
            return (
              <circle
                key={i}
                cx={x} cy={y}
                r={4}
                fill={dotColor(mths)}
                opacity={0.82}
                stroke="none"
              />
            );
          })}

          {/* Current dot */}
          {(() => {
            const cx = xScale(CURRENT_SF);
            const cy = yScale(CURRENT_P);
            return (
              <>
                <circle cx={cx} cy={cy} r={7} fill="none" stroke="#fff" strokeWidth={1.5} />
                <circle cx={cx} cy={cy} r={4} fill="#ffffff" />
                <text x={cx + 10} y={cy + 4} fill="#fff" fontSize={9} fontFamily="monospace" fontWeight="700">
                  NOW
                </text>
              </>
            );
          })()}

          {/* Y axis ticks */}
          {Y_P_TICKS.map((p, i) => {
            const y = yScale(p);
            if (y < MT || y > MT + CH) return null;
            return (
              <g key={p}>
                <line x1={ML - 4} y1={y} x2={ML} y2={y} stroke="#444" strokeWidth={1} />
                <text x={ML - 7} y={y + 3.5} textAnchor="end" fill="#555" fontSize={9} fontFamily="monospace">
                  {Y_P_LABELS[i]}
                </text>
              </g>
            );
          })}

          {/* X axis ticks */}
          {X_SF_TICKS.map((sf) => {
            const x = xScale(sf);
            if (x < ML || x > ML + CW) return null;
            return (
              <g key={sf}>
                <line x1={x} y1={MT + CH} x2={x} y2={MT + CH + 4} stroke="#444" strokeWidth={1} />
                <text x={x} y={MT + CH + 16} textAnchor="middle" fill="#555" fontSize={9} fontFamily="monospace">
                  {sf}
                </text>
              </g>
            );
          })}

          {/* Axes borders */}
          <line x1={ML} y1={MT} x2={ML} y2={MT + CH} stroke="#2a2a2a" strokeWidth={1} />
          <line x1={ML} y1={MT + CH} x2={ML + CW} y2={MT + CH} stroke="#2a2a2a" strokeWidth={1} />

          {/* Axis labels */}
          <text x={ML + CW / 2} y={VH - 6} textAnchor="middle" fill="#444" fontSize={10} fontFamily="monospace">
            Stock-to-Flow Ratio (log scale)
          </text>
          <text
            x={14} y={MT + CH / 2}
            textAnchor="middle" fill="#444" fontSize={10} fontFamily="monospace"
            transform={`rotate(-90, 14, ${MT + CH / 2})`}
          >
            Price USD (log scale)
          </text>

          {/* Color legend */}
          <defs>
            <linearGradient id="s2fLegend" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="rgb(255,0,0)" />
              <stop offset="50%"  stopColor="rgb(0,140,0)" />
              <stop offset="100%" stopColor="rgb(0,0,255)" />
            </linearGradient>
          </defs>
          <rect x={ML + CW - 180} y={MT + CH - 24} width={180} height={8} rx={4}
            fill="url(#s2fLegend)" />
          <text x={ML + CW - 180} y={MT + CH - 28} fill="#555" fontSize={7} fontFamily="monospace">
            Near halving
          </text>
          <text x={ML + CW} y={MT + CH - 28} textAnchor="end" fill="#555" fontSize={7} fontFamily="monospace">
            Far from halving
          </text>

          {/* Model legend */}
          <line x1={ML + 10} y1={MT + 14} x2={ML + 34} y2={MT + 14}
            stroke="#00cc66" strokeWidth={2.5} />
          <text x={ML + 38} y={MT + 18} fill="#00cc66" fontSize={8} fontFamily="monospace">
            S2F Model (0.34 × SF²·⁹⁴)
          </text>
        </svg>
      </div>
    </div>
  );
}
