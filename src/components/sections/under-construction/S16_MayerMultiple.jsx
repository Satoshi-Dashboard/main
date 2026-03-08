import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

function mmColor(mm) {
  if (mm < 0.40) return '#1a00ff';
  if (mm < 0.60) return '#0055ee';
  if (mm < 0.80) return '#0099cc';
  if (mm < 1.00) return '#00bb88';
  if (mm < 1.20) return '#00cc44';
  if (mm < 1.50) return '#88cc00';
  if (mm < 2.00) return '#ccaa00';
  if (mm < 2.40) return '#f07800';
  return '#ff3030';
}

// Generate ~4 years of realistic mock data (Mar 2021 – Mar 2025)
function genData() {
  const rows = [];
  // Approximate BTC price path
  const prices = [];
  for (let i = 0; i < 365 * 4; i++) {
    let p;
    if (i < 60)  p = 55000 + Math.sin(i * 0.04) * 8000 + i * 100 + (Math.random() - 0.5) * 3000;  // bull top
    else if (i < 130) p = 65000 - (i - 60) * 200 + (Math.random() - 0.5) * 3000;                  // correction
    else if (i < 280) p = 52000 + Math.sin((i - 130) * 0.03) * 18000 + (Math.random() - 0.5) * 3000; // chop
    else if (i < 400) p = 68000 - (i - 280) * 250 + (Math.random() - 0.5) * 3000;                  // dump
    else if (i < 550) p = 36000 - (i - 400) * 80 + (Math.random() - 0.5) * 2000;                   // bear market
    else if (i < 700) p = 24000 + Math.sin((i - 550) * 0.025) * 4000 + (Math.random() - 0.5) * 2000; // accumulation
    else if (i < 800) p = 26000 + (i - 700) * 120 + (Math.random() - 0.5) * 2000;                   // recovery start
    else if (i < 950) p = 38000 + (i - 800) * 180 + (Math.random() - 0.5) * 3000;                   // 2024 bull run
    else              p = 65000 + Math.sin((i - 950) * 0.04) * 20000 + (Math.random() - 0.5) * 5000; // 2024–25 ATH
    prices.push(Math.max(15000, Math.min(110000, p)));
  }

  const start = new Date('2021-03-01');
  for (let i = 0; i < prices.length; i++) {
    const win = prices.slice(Math.max(0, i - 199), i + 1);
    const ma200 = win.reduce((a, b) => a + b, 0) / win.length;
    const mm = prices[i] / ma200;
    const dt = new Date(start.getTime() + i * 86400000);
    rows.push({
      date: dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      mm: +mm.toFixed(3),
      price: Math.round(prices[i]),
    });
  }
  return rows;
}

const ALL_DATA = genData();
// Sample every 3rd day for performance
const DATA = ALL_DATA.filter((_, i) => i % 3 === 0);
const CURRENT_MM = ALL_DATA[ALL_DATA.length - 1]?.mm ?? 1.13;
const PREV_MM = ALL_DATA[ALL_DATA.length - 8]?.mm ?? 1.09;
const PCT = +((CURRENT_MM - PREV_MM) / PREV_MM * 100).toFixed(2);
const UP = PCT >= 0;

export default function S16_MayerMultiple() {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Header */}
      <div className="flex-none flex items-baseline gap-3 px-8 pt-5 pb-2">
        <span className="inline-block h-3 w-3 flex-none rounded-full bg-green-400" style={{ marginBottom: 2 }} />
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 'var(--fs-subtitle)', fontWeight: 700 }}>
          Mayer Multiple: {CURRENT_MM.toFixed(2)}
        </span>
        <span style={{ color: UP ? '#00D897' : '#FF4757', fontFamily: 'monospace', fontSize: 'var(--fs-heading)', fontWeight: 600 }}>
          {UP ? '+' : ''}{PCT}% {UP ? '▲' : '▼'}
        </span>
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={DATA} margin={{ top: 10, right: 52, left: 10, bottom: 24 }}>
            <XAxis
              dataKey="date"
              stroke="#2a2a2a"
              tick={{ fill: '#555', fontSize: 11 }}
              interval={Math.floor(DATA.length / 10)}
              angle={-30}
              textAnchor="end"
              height={36}
            />
            {/* Left axis — Mayer Multiple */}
            <YAxis
              yAxisId="mm"
              stroke="#2a2a2a"
              tick={{ fill: '#555', fontSize: 11 }}
              domain={[0, 3]}
              ticks={[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]}
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: 'Mayer Multiple', angle: -90, position: 'insideLeft', fill: '#444', fontSize: 11, dx: -2 }}
            />
            {/* Right axis — BTC Price */}
            <YAxis
              yAxisId="price"
              orientation="right"
              stroke="#2a2a2a"
              tick={{ fill: '#555', fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={44}
            />
            {/* Fair-value reference line at MM = 1 */}
            <ReferenceLine yAxisId="mm" y={1.0} stroke="#00D897" strokeDasharray="4 4" strokeWidth={1} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', fontSize: 11 }}
              formatter={(v, name) => [
                name === 'mm' ? v.toFixed(3) : `$${Number(v).toLocaleString()}`,
                name === 'mm' ? 'MM' : 'Price',
              ]}
              labelStyle={{ color: '#888' }}
            />
            {/* Colored MM bars */}
            <Bar yAxisId="mm" dataKey="mm" maxBarSize={10} isAnimationActive={false}>
              {DATA.map((d, i) => <Cell key={i} fill={mmColor(d.mm)} />)}
            </Bar>
            {/* White BTC price line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="#ffffff"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Zone labels */}
      <div className="flex-none grid grid-cols-3 gap-2 px-6 pb-4">
        <div className="rounded border border-red-900/60 bg-red-950/30 px-3 py-2">
          <div style={{ color: '#ff4444', fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--fs-caption)' }}>Overvalued</div>
          <div style={{ color: '#cc3333', fontFamily: 'monospace', fontSize: 'var(--fs-micro)' }}>&gt; 2.4</div>
        </div>
        <div className="rounded border border-yellow-800/50 bg-yellow-950/30 px-3 py-2">
          <div style={{ color: '#ccaa00', fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--fs-caption)' }}>Neutral</div>
          <div style={{ color: '#997700', fontFamily: 'monospace', fontSize: 'var(--fs-micro)' }}>0.8 – 2.4</div>
        </div>
        <div className="rounded border border-green-900/60 bg-green-950/30 px-3 py-2">
          <div style={{ color: '#00cc44', fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--fs-caption)' }}>Undervalued</div>
          <div style={{ color: '#009933', fontFamily: 'monospace', fontSize: 'var(--fs-micro)' }}>&lt; 0.8</div>
        </div>
      </div>
    </div>
  );
}
