// Bitcoin Cycle Spiral — polar SVG chart
// Angle = position within halving cycle (0→2π per cycle)
// Radius = log₁₀(price) mapped to SVG units

// Halvings (fractional year)
const HALVINGS_Y = [2012.907, 2016.524, 2020.356, 2024.300, 2028.295];

// Key price waypoints [fractional year, USD price]
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
  let cycleStart = 2009.0083; // genesis
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

// SVG canvas
const VW = 900;
const VH = 720;
const CX = 450;
const CY = 370;
const R_MIN = 18;
const R_MAX = 310;
const LOG_MIN = Math.log10(0.05);
const LOG_MAX = Math.log10(150000);

function priceToRadius(price) {
  const lp = Math.log10(Math.max(0.05, price));
  return R_MIN + (R_MAX - R_MIN) * (lp - LOG_MIN) / (LOG_MAX - LOG_MIN);
}

function cycleColor(t) {
  // blue(0) → cyan → green → yellow → orange → red(1)
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

// Generate data points (~monthly, 2010-mid to 2026-Mar)
const DOTS = [];
for (let yi = 0; yi <= 187; yi++) {
  const year = 2010.5 + yi / 12;
  if (year > 2026.2) break;
  const price = interpLogPrice(year);
  const { t } = cycleInfo(year);
  const angle = t * 2 * Math.PI - Math.PI / 2; // start from top
  const r = priceToRadius(price);
  const x = CX + r * Math.cos(angle);
  const y = CY + r * Math.sin(angle);
  DOTS.push({ x, y, t, price, year, r });
}

// Price ring labels
const RINGS = [
  { price: 1,       label: '$1' },
  { price: 100,     label: '$100' },
  { price: 10000,   label: '$10K' },
  { price: 100000,  label: '$100K' },
];

// Halving arm labels
const HALVING_LABELS = HALVINGS_Y.slice(0, 4).map((hy, i) => {
  const angle = 0 * 2 * Math.PI - Math.PI / 2; // t=0 means halving → top
  const r = priceToRadius(interpLogPrice(hy));
  return { year: Math.round(hy), r, label: `Halving ${i + 1}` };
});

export default function S18_CycleSpiral() {
  const lastDot = DOTS[DOTS.length - 1];

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Header */}
      <div className="flex-none px-8 pt-5 pb-1">
        <h1
          style={{
            color: '#F7931A',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-section)',
            fontWeight: 700,
          }}
        >
          Bitcoin Cycle Spiral
        </h1>
        <p style={{ color: '#555', fontFamily: 'monospace', fontSize: 'var(--fs-micro)', marginTop: 2 }}>
          Polar chart — each revolution = one halving cycle · radius = log(price)
        </p>
      </div>

      {/* SVG */}
      <div className="min-h-0 flex-1 flex items-center justify-center px-2 pb-2">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', height: '100%', maxHeight: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Price rings */}
          {RINGS.map(({ price, label }) => {
            const rr = priceToRadius(price);
            return (
              <g key={price}>
                <circle cx={CX} cy={CY} r={rr} fill="none" stroke="#2a2a2a" strokeWidth={1} />
                <text
                  x={CX + rr + 4}
                  y={CY - 4}
                  fill="#444"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Cycle divider lines (at t=0 = each halving position → top) */}
          {HALVINGS_Y.slice(0, 4).map((hy, i) => (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={CX}
              y2={CY - R_MAX - 8}
              stroke="#2a2a2a"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          {/* Spiral dots */}
          {DOTS.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={d.y}
              r={d.price > 50000 ? 4.5 : d.price > 1000 ? 3.5 : 2.5}
              fill={cycleColor(d.t)}
              opacity={0.85}
            />
          ))}

          {/* Current position marker */}
          {lastDot && (
            <>
              <circle cx={lastDot.x} cy={lastDot.y} r={7} fill="none" stroke="#fff" strokeWidth={1.5} />
              <circle cx={lastDot.x} cy={lastDot.y} r={4} fill="#ffffff" />
              <text
                x={lastDot.x + 12}
                y={lastDot.y + 4}
                fill="#ffffff"
                fontSize={10}
                fontFamily="monospace"
                fontWeight="700"
              >
                NOW
              </text>
            </>
          )}

          {/* Year labels at halving positions (top of spiral) */}
          {[2012, 2016, 2020, 2024].map((yr, i) => {
            const rr = priceToRadius(interpLogPrice(HALVINGS_Y[i]));
            return (
              <text
                key={yr}
                x={CX}
                y={CY - rr - 14}
                textAnchor="middle"
                fill="#F7931A"
                fontSize={9}
                fontFamily="monospace"
                fontWeight="700"
              >
                ₿ {yr}
              </text>
            );
          })}

          {/* Color legend — horizontal bar */}
          <defs>
            <linearGradient id="spiralLegend" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="rgb(30,80,255)" />
              <stop offset="25%"  stopColor="rgb(0,180,255)" />
              <stop offset="50%"  stopColor="rgb(0,220,120)" />
              <stop offset="75%"  stopColor="rgb(255,140,0)" />
              <stop offset="100%" stopColor="rgb(255,20,20)" />
            </linearGradient>
          </defs>
          <rect x={620} y={640} width={240} height={10} rx={5} fill="url(#spiralLegend)" />
          <text x={620} y={660} fill="#555" fontSize={8} fontFamily="monospace">Post-halving</text>
          <text x={860} y={660} textAnchor="end" fill="#555" fontSize={8} fontFamily="monospace">Pre-halving</text>

          {/* Center label */}
          <text x={CX} y={CY + 4} textAnchor="middle" fill="#333" fontSize={9} fontFamily="monospace">2009</text>
        </svg>
      </div>
    </div>
  );
}
