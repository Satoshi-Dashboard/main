import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Static market cap data (approximations in trillions)
const BTC_CAP_T   = 2.14;
const TOTAL_CAP_T = 3.47;
const BTC_DOM_PCT = (BTC_CAP_T / TOTAL_CAP_T * 100);

// 90-day BTC dominance history (mock, matches btcframe shape)
function genDomData() {
  const start = new Date('2025-12-04');
  // Key waypoints: [day, dom%]
  const wp = [
    [0,  59.7],[7,  59.4],[14, 59.5],[21, 60.2],[28, 61.0],
    [35, 61.0],[42, 60.6],[49, 60.4],[56, 61.0],[63, 60.3],
    [70, 58.9],[77, 59.3],[84, 59.2],[88, 61.5],[90, BTC_DOM_PCT],
  ];
  const rows = [];
  for (let d = 0; d <= 90; d++) {
    const dt = new Date(start.getTime() + d * 86400000);
    const label = dt.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    // Linear interpolate
    let i = 0;
    while (i < wp.length - 1 && wp[i + 1][0] < d) i++;
    const [d0, v0] = wp[i];
    const [d1, v1] = wp[Math.min(i + 1, wp.length - 1)];
    const t = d1 === d0 ? 0 : (d - d0) / (d1 - d0);
    const dom = +(v0 + t * (v1 - v0) + (Math.random() - 0.5) * 0.15).toFixed(2);
    rows.push({ label, dom });
  }
  return rows;
}

const DOM_DATA = genDomData().filter((_, i) => i % 2 === 0);

// Sparkline data for stat cards
function spark(base, volatility = 0.02) {
  return Array.from({ length: 30 }, (_, i) => ({
    v: base + Math.sin(i * 0.35) * base * volatility + (Math.random() - 0.5) * base * 0.01,
  }));
}

const CARDS = [
  {
    title: 'BITCOIN MARKET CAP',
    value: `$${BTC_CAP_T.toFixed(2)}T`,
    change: '2.85% (24h)',
    changeUp: true,
    spark: spark(2.14, 0.03),
    strokeColor: '#F7931A',
    fillColor: '#4a2800',
  },
  {
    title: 'TOTAL CRYPTO MARKET CAP',
    value: `$${TOTAL_CAP_T.toFixed(2)}T`,
    change: '-0.99% (24h)',
    changeUp: false,
    spark: spark(3.47, 0.025),
    strokeColor: '#4488ff',
    fillColor: '#001830',
  },
  {
    title: 'BITCOIN DOMINANCE',
    value: `${BTC_DOM_PCT.toFixed(2)}%`,
    change: '3.87% (24h)',
    changeUp: true,
    spark: spark(61.7, 0.015),
    strokeColor: '#00cc88',
    fillColor: '#002018',
  },
];

export default function S24_NetworkActivity() {
  const [data] = useState(DOM_DATA);

  // BTC dominance bar width
  const barPct = BTC_DOM_PCT;

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* 3 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '16px 16px 10px' }}>
        {CARDS.map((c) => (
          <div key={c.title} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: c.strokeColor + '33', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.strokeColor }} />
              </div>
              <span style={{
                color: '#888', fontFamily: 'monospace',
                fontSize: 'var(--fs-micro)', letterSpacing: '0.06em',
              }}>
                {c.title}
              </span>
            </div>
            <div style={{
              color: c.strokeColor, fontFamily: 'monospace',
              fontSize: 'var(--fs-subtitle)', fontWeight: 700, lineHeight: 1,
            }}>
              {c.value}
            </div>
            <div style={{
              color: c.changeUp ? '#00D897' : '#FF4757', fontFamily: 'monospace',
              fontSize: 'var(--fs-micro)', marginTop: 4,
            }}>
              {c.changeUp ? '+' : ''}{c.change}
            </div>
            {/* Mini sparkline */}
            <div style={{ height: 36, marginTop: 6 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={c.spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`sg-${c.title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.strokeColor} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={c.strokeColor} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={c.strokeColor} strokeWidth={1.5}
                    fill={`url(#sg-${c.title})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Market Cap Comparison bar */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 'var(--fs-micro)', marginBottom: 6, textAlign: 'center' }}>
          Market Cap Comparison
        </div>
        <div style={{ background: '#2a2a2a', borderRadius: 4, height: 24, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: `${barPct}%`, height: '100%',
            background: '#F7931A', borderRadius: '4px 0 0 4px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 6 }}>
          <span style={{ color: '#888', fontFamily: 'monospace', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#F7931A' }} />
            Bitcoin ({BTC_DOM_PCT.toFixed(2)}%)
          </span>
          <span style={{ color: '#888', fontFamily: 'monospace', fontSize: 'var(--fs-micro)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#555' }} />
            Other Cryptocurrencies
          </span>
        </div>
      </div>

      {/* Dominance history chart */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 8px 8px' }}>
        <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 'var(--fs-micro)', textAlign: 'center', marginBottom: 4 }}>
          Bitcoin Dominance History (90 Days)
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 20, left: 8, bottom: 20 }}>
            <defs>
              <linearGradient id="domGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F7931A" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#3a2000" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="#2a2a2a"
              tick={{ fill: '#555', fontSize: 11 }}
              interval={Math.floor(data.length / 10)}
              angle={-20}
              textAnchor="end"
              height={32}
            />
            <YAxis
              stroke="#2a2a2a"
              tick={{ fill: '#555', fontSize: 11 }}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              tickFormatter={(v) => v.toFixed(1) + '%'}
              width={44}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', fontSize: 11 }}
              formatter={(v) => [v.toFixed(2) + '%', 'BTC Dominance']}
              labelStyle={{ color: '#888' }}
            />
            <Area
              type="monotone"
              dataKey="dom"
              stroke="#F7931A"
              fill="url(#domGrad)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
