import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchJson } from '../../lib/api.js';

function parseThreshold(label) {
  const match = String(label || '').match(/[\d,]+/);
  if (!match) return 0;
  return Number(match[0].replace(/,/g, ''));
}

function toChartData(payload) {
  if (!Array.isArray(payload?.richerThan)) return [];

  return payload.richerThan
    .map((row) => {
      const usdThreshold = Number(row?.usdThreshold || parseThreshold(row?.label));
      const addresses = Number(row?.addresses || 0);
      if (!Number.isFinite(usdThreshold) || !Number.isFinite(addresses)) return null;

      return {
        label: row?.label || `$${usdThreshold.toLocaleString('en-US')}`,
        usdThreshold,
        addresses,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.usdThreshold - b.usdThreshold);
}

function formatYAxis(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(Math.round(value));
}

export default function S14_TransactionCount() {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [share10m, setShare10m] = useState(null);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const payload = await fetchJson('/api/s14/addresses-richer', { timeout: 8000 });
        const rows = toChartData(payload);
        if (!active || !rows.length) return;

        setData(rows);
        setLatest(rows[0].addresses);

        const richest = rows[rows.length - 1]?.addresses || 0;
        const broad = rows[0]?.addresses || 0;
        setShare10m(broad > 0 ? (richest / broad) * 100 : null);

        if (typeof payload?.updatedAt === 'string') {
          setUpdatedAt(payload.updatedAt);
        }
      } catch {
        /* keep previous values */
      } finally {
        if (active) setLoading(false);
      }

    };

    load();
    const timer = setInterval(load, 3_600_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Sample to max ~400 points for render performance
  const displayData = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 400)) === 0);

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Header */}
      <div className="flex-none flex items-baseline gap-3 px-10 pt-6 pb-1">
        {loading ? (
          <>
            <div className="skeleton rounded-full" style={{ width: 12, height: 12, marginBottom: 2 }} />
            <div className="skeleton" style={{ width: 220, height: '1.25em' }} />
            <div className="skeleton" style={{ width: 140, height: '1em' }} />
          </>
        ) : (
          <>
            <span className="inline-block h-3 w-3 rounded-full bg-green-400" style={{ marginBottom: 2 }} />
            <span
              style={{
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: 'var(--fs-title)',
                fontWeight: 700,
              }}
            >
              {latest ? latest.toLocaleString() : '—'} Addresses
            </span>
            {share10m !== null && (
              <span
                style={{
                  color: '#F7931A',
                  fontFamily: 'monospace',
                  fontSize: 'var(--fs-section)',
                  fontWeight: 600,
                }}
              >
                {share10m.toFixed(3)}% are $10M+
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex-none px-10 pb-1 text-[11px] font-mono tracking-wider text-[#5c5c5c]">
        {updatedAt ? `Source updated: ${updatedAt} · ` : ''}On-chain data · daily update · bitinfocharts.com
      </div>

      {/* Chart */}
      <div className="relative min-h-0 flex-1 pb-1">
        {loading ? (
          <div className="absolute inset-0 flex items-end px-3 pb-8 gap-[3px]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="skeleton flex-1"
                style={{ height: `${25 + Math.sin(i * 0.35) * 18 + Math.sin(i * 0.12) * 25}%`, borderRadius: 2 }}
              />
            ))}
          </div>
        ) : displayData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 24, left: 10, bottom: 30 }}>
              <defs>
                <linearGradient id="txGrad14" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#363636" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1a1a1a" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                stroke="#2a2a2a"
                tick={{ fill: '#555', fontSize: 11 }}
                interval={Math.max(1, Math.floor(displayData.length / 14))}
                angle={-30}
                textAnchor="end"
                height={44}
              />
              <YAxis
                stroke="#2a2a2a"
                tick={{ fill: '#555', fontSize: 11 }}
                tickFormatter={formatYAxis}
                label={{
                  value: 'Bitcoin addresses richer than each USD threshold',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#444',
                  fontSize: 11,
                  dx: 14,
                }}
                width={68}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', borderRadius: 4, fontSize: 11 }}
                formatter={(v) => [v.toLocaleString(), 'Addresses']}
                labelStyle={{ color: '#888' }}
              />
              <Area
                type="monotone"
                dataKey="addresses"
                stroke="#F7931A"
                fill="url(#txGrad14)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-gray-600" style={{ fontSize: 'var(--fs-micro)' }}>
            Data unavailable
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-none pb-4 text-center">
        <span
          style={{
            color: '#3a3a3a',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-micro)',
            letterSpacing: '0.12em',
          }}
        >
          ADDRESSES RICHER THAN USD THRESHOLDS
        </span>
      </div>
    </div>
  );
}
