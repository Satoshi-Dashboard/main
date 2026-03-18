// Bitcoin Power Law Model — full-screen log-scale SVG chart
// Formula: log10(price) = -17.02 + 5.98 * log10(daysSinceGenesis)
// Refs: Harold Christopher Burger's Power Law Corridor

const GENESIS = new Date('2009-01-03').getTime(); // ms

function daysFromGenesis(year) {
  const ms = (year - 1970) * 365.2425 * 86400 * 1000;
  return (ms - GENESIS) / 86400000;
}

function modelPrice(year, offset = 0) {
  const d = daysFromGenesis(year);
  if (d <= 0) return null;
  const log10p = -17.02 + 5.98 * Math.log10(d) + offset;
  return Math.pow(10, log10p);
}

// SVG layout
const VW = 900;
const VH = 560;
const ML = 68;
const MR = 24;
const MT = 20;
const MB = 52;
const CW = VW - ML - MR;
const CH = VH - MT - MB;

const YEAR_MIN = 2010;
const YEAR_MAX = 2028;
const LOG_MIN = 0;   // $1
const LOG_MAX = 7;   // $10M

function xScale(year) {
  return ML + (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN) * CW;
}

function yScale(price) {
  if (!price || price <= 0) return MT + CH;
  const lp = Math.log10(price);
  return MT + CH - (lp - LOG_MIN) / (LOG_MAX - LOG_MIN) * CH;
}

// 5 power law bands (log10 offsets from fair-value model)
const BANDS = [
  { offset:  0.9, color: '#cc2200', label: 'Extreme Top' },
  { offset:  0.45, color: '#e07800', label: 'Top' },
  { offset:  0,   color: '#00aa55', label: 'Fair Value' },
  { offset: -0.45, color: '#0088cc', label: 'Bottom' },
  { offset: -0.9, color: '#2244ff', label: 'Extreme Bottom' },
];

function makePath(offsetVal) {
  const pts = [];
  for (let mo = 0; mo <= (YEAR_MAX - YEAR_MIN) * 12; mo++) {
    const year = YEAR_MIN + mo / 12;
    const p = modelPrice(year, offsetVal);
    if (!p) continue;
    const x = xScale(year);
    const y = yScale(p);
    if (y < MT - 5 || y > MT + CH + 5) continue;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return 'M ' + pts.join(' L ');
}

// Historical BTC price waypoints for orange price line
const PRICE_WP = [
  [2010.5,  0.08], [2011.4, 30],    [2012.0,  5],   [2012.9, 12],
  [2013.3,  140],  [2013.92, 1100], [2015.0, 180],  [2016.52, 660],
  [2017.95, 19400],[2018.5,  7000], [2019.0, 3500], [2019.5, 11000],
  [2020.0,  7200], [2020.36, 8700], [2020.92, 29000],[2021.35, 59000],
  [2021.86, 67000],[2022.90, 16000],[2023.95, 42000],[2024.20, 73700],
  [2024.96, 108000],[2025.55, 105000],[2026.17, 84000],
];

function interpPrice(year) {
  if (year <= PRICE_WP[0][0]) return PRICE_WP[0][1];
  if (year >= PRICE_WP[PRICE_WP.length - 1][0]) return PRICE_WP[PRICE_WP.length - 1][1];
  let i = 0;
  while (i < PRICE_WP.length - 1 && PRICE_WP[i + 1][0] < year) i++;
  const [y0, p0] = PRICE_WP[i];
  const [y1, p1] = PRICE_WP[i + 1];
  const t = (year - y0) / (y1 - y0);
  return Math.pow(10, Math.log10(p0) + t * (Math.log10(p1) - Math.log10(p0)));
}

function makePricePath() {
  const pts = [];
  for (let mo = 0; mo <= (2026.2 - YEAR_MIN) * 12; mo++) {
    const year = YEAR_MIN + mo / 12;
    if (year < 2010.4 || year > 2026.25) continue;
    const p = interpPrice(year);
    const x = xScale(year);
    const y = yScale(p);
    if (y < MT - 5 || y > MT + CH + 5) continue;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return 'M ' + pts.join(' L ');
}

const CURRENT_YEAR = 2026.17;
const CURRENT_PRICE = 84000;
const FAIR_VALUE = modelPrice(CURRENT_YEAR, 0);
const DEV_PCT = FAIR_VALUE ? +((CURRENT_PRICE - FAIR_VALUE) / FAIR_VALUE * 100).toFixed(1) : null;

const bandPaths = BANDS.map((b) => ({ ...b, path: makePath(b.offset) }));
const pricePath = makePricePath();
const currentX = xScale(CURRENT_YEAR);
const currentY = yScale(CURRENT_PRICE);

const Y_TICKS = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000];
const Y_LABELS = ['$1', '$10', '$100', '$1K', '$10K', '$100K', '$1M', '$10M'];
const X_TICKS = [2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026, 2028];

export default function S19_PowerLawModel() {
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
          Power Law Model
        </span>
        {DEV_PCT !== null && (
          <span
            style={{
              color: DEV_PCT >= 0 ? '#00D897' : '#FF4757',
              fontFamily: 'monospace',
              fontSize: 'var(--fs-label)',
              fontWeight: 600,
            }}
          >
            {DEV_PCT >= 0 ? '+' : ''}{DEV_PCT}% vs fair value {DEV_PCT >= 0 ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1 px-2 pb-2">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid */}
          {Y_TICKS.map((p) => {
            const y = yScale(p);
            if (y < MT || y > MT + CH) return null;
            return <line key={p} x1={ML} y1={y} x2={ML + CW} y2={y} stroke="#1e1e1e" strokeWidth={1} />;
          })}
          {X_TICKS.map((yr) => {
            const x = xScale(yr);
            return <line key={yr} x1={x} y1={MT} x2={x} y2={MT + CH} stroke="#1e1e1e" strokeWidth={1} />;
          })}

          {/* Band fills */}
          {bandPaths.slice(0, bandPaths.length - 1).map((b, i) => {
            const topPts = b.path.replace('M ', '').split(' L ');
            const botPts = bandPaths[i + 1].path.replace('M ', '').split(' L ').reverse();
            return (
              <path
                key={i}
                d={`M ${topPts.join(' L ')} L ${botPts.join(' L ')} Z`}
                fill={b.color}
                opacity={0.09}
                stroke="none"
              />
            );
          })}

          {/* Band lines */}
          {bandPaths.map((b) => (
            <path
              key={b.offset}
              d={b.path}
              fill="none"
              stroke={b.color}
              strokeWidth={1.5}
              strokeDasharray={b.offset === 0 ? undefined : '5 3'}
              opacity={0.75}
            />
          ))}

          {/* BTC price line */}
          <path d={pricePath} fill="none" stroke="#F7931A" strokeWidth={2} opacity={0.95} />

          {/* Current dot */}
          <circle cx={currentX} cy={currentY} r={5} fill="#F7931A" />
          <circle cx={currentX} cy={currentY} r={9} fill="none" stroke="#F7931A" strokeWidth={1} opacity={0.5} />

          {/* Today line */}
          <line x1={currentX} y1={MT} x2={currentX} y2={MT + CH}
            stroke="#444" strokeWidth={1} strokeDasharray="3 3" />
          <text x={currentX + 4} y={MT + 14} fill="#666" fontSize={8} fontFamily="monospace">TODAY</text>

          {/* Y axis */}
          {Y_TICKS.map((p, i) => {
            const y = yScale(p);
            if (y < MT || y > MT + CH) return null;
            return (
              <g key={p}>
                <line x1={ML - 4} y1={y} x2={ML} y2={y} stroke="#444" strokeWidth={1} />
                <text x={ML - 7} y={y + 3.5} textAnchor="end" fill="#555" fontSize={9} fontFamily="monospace">
                  {Y_LABELS[i]}
                </text>
              </g>
            );
          })}

          {/* X axis */}
          {X_TICKS.map((yr) => {
            const x = xScale(yr);
            return (
              <g key={yr}>
                <line x1={x} y1={MT + CH} x2={x} y2={MT + CH + 4} stroke="#444" strokeWidth={1} />
                <text x={x} y={MT + CH + 16} textAnchor="middle" fill="#555" fontSize={9} fontFamily="monospace">
                  {yr}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={ML} y1={MT} x2={ML} y2={MT + CH} stroke="#2a2a2a" strokeWidth={1} />
          <line x1={ML} y1={MT + CH} x2={ML + CW} y2={MT + CH} stroke="#2a2a2a" strokeWidth={1} />

          {/* Legend */}
          {[...BANDS, { color: '#F7931A', label: 'BTC Price', offset: 99 }].map((b, i) => (
            <g key={i}>
              <line
                x1={VW - MR - 130} y1={MT + 16 + i * 16}
                x2={VW - MR - 108} y2={MT + 16 + i * 16}
                stroke={b.color} strokeWidth={2}
                strokeDasharray={b.offset !== 0 && b.offset !== 99 ? '5 3' : undefined}
              />
              <text
                x={VW - MR - 104} y={MT + 20 + i * 16}
                fill={b.offset === 99 ? '#F7931A' : '#666'}
                fontSize={8} fontFamily="monospace"
              >
                {b.label}
              </text>
            </g>
          ))}

          {/* Y label */}
          <text
            x={14} y={MT + CH / 2}
            textAnchor="middle" fill="#444" fontSize={9} fontFamily="monospace"
            transform={`rotate(-90, 14, ${MT + CH / 2})`}
          >
            Price (USD, log scale)
          </text>
        </svg>
      </div>
    </div>
  );
}
