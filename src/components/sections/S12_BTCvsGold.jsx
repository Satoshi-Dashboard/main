import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

// Approximate gold market cap historical (monthly, Jun 2024 – Mar 2026)
const GOLD_MAP = {
  '2024-06': 15.8, '2024-07': 16.1, '2024-08': 16.6,
  '2024-09': 17.6, '2024-10': 18.6, '2024-11': 19.4,
  '2024-12': 20.2, '2025-01': 20.5, '2025-02': 21.0,
  '2025-03': 21.8, '2025-04': 22.4, '2025-05': 23.0,
  '2025-06': 23.8, '2025-07': 24.2, '2025-08': 24.5,
  '2025-09': 24.0, '2025-10': 24.3, '2025-11': 24.6,
  '2025-12': 25.0, '2026-01': 25.4, '2026-02': 25.8,
  '2026-03': 26.2,
};

function goldFor(ts) {
  const d = new Date(ts);
  const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return GOLD_MAP[k] ?? 18;
}

export default function S12_BTCvsGold() {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/public/coingecko/bitcoin-market-chart?days=365', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const payload = await r.json();
        const json = payload?.data || payload;
        const caps = json.market_caps;
        const merged = caps
          .filter((_, i) => i % 3 === 0)
          .map(([ts, cap]) => ({
            date: new Date(ts).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            bitcoin: +(cap / 1e12).toFixed(2),
            gold: goldFor(ts),
          }));
        setData(merged);
      } catch {
        // Static fallback
        const fallback = Object.entries(GOLD_MAP).slice(0, 13).map(([k, gold], i) => ({
          date: k,
          bitcoin: +(1.1 + i * 0.09).toFixed(2),
          gold,
        }));
        setData(fallback);
      }
    })();
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-[#111111] px-6 pb-6">
      {/* Title */}
      <div className="flex-none pt-6 pb-4">
        <h1
          style={{
            color: '#F7931A',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 700,
          }}
        >
          Bitcoin vs. Gold Market Cap
        </h1>
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 30, bottom: 10 }}>
              <defs>
                <linearGradient id="goldFill12" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#888" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#444" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="btcFill12" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7931A" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#c05800" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#333"
                tick={{ fill: '#666', fontSize: 11 }}
                interval={Math.max(1, Math.floor(data.length / 12))}
              />
              <YAxis
                stroke="#333"
                tick={{ fill: '#666', fontSize: 11 }}
                tickFormatter={(v) => `${v}T`}
                domain={[0, 'dataMax + 2']}
                label={{
                  value: 'Market Capitalization (in Trillions)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#555',
                  fontSize: 11,
                  dx: -14,
                }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: 4, fontSize: 12 }}
                formatter={(v, name) => [`$${v}T`, name === 'gold' ? 'Gold' : 'Bitcoin']}
                labelStyle={{ color: '#aaa' }}
              />
              <Legend
                formatter={(v) => (
                  <span style={{ color: v === 'gold' ? '#999' : '#F7931A', fontSize: 12, fontFamily: 'monospace' }}>
                    {v === 'gold' ? 'Gold' : 'Bitcoin'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="gold"
                stroke="#888"
                fill="url(#goldFill12)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="gold"
              />
              <Area
                type="monotone"
                dataKey="bitcoin"
                stroke="#F7931A"
                fill="url(#btcFill12)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="bitcoin"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-gray-600" style={{ fontSize: 'var(--fs-micro)' }}>
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
