import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Layers } from 'lucide-react';
import { fmt } from '../../utils/formatters';

const ageData = [
  { range: '0–1d',   utxos: 12340000,  value: 5600000000  },
  { range: '1d–1w',  utxos: 23450000,  value: 8900000000  },
  { range: '1w–1m',  utxos: 34560000,  value: 12300000000 },
  { range: '1m–6m',  utxos: 45670000,  value: 18700000000 },
  { range: '6m–1y',  utxos: 23456000,  value: 14200000000 },
  { range: '1y–2y',  utxos: 19234000,  value: 12800000000 },
  { range: '2y–5y',  utxos: 18765000,  value: 14500000000 },
  { range: '5y+',    utxos: 7890000,   value: 8500000000  },
];

const totalUTXOs = ageData.reduce((sum, d) => sum + d.utxos, 0);
const totalValue = ageData.reduce((sum, d) => sum + d.value, 0);
const avgUTXOValue = totalValue / totalUTXOs;
const maxUTXOs = Math.max(...ageData.map((d) => d.utxos));

// Gradient from faint to full bitcoin orange based on UTXO count
function barColor(utxos) {
  const ratio = utxos / maxUTXOs;
  if (ratio > 0.8) return '#F7931A';
  if (ratio > 0.5) return '#E07A10';
  if (ratio > 0.25) return '#C86808';
  return '#A05000';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = ageData.find((r) => r.range === label);
  return (
    <div className="rounded border border-[#F7931A]/30 bg-[#12121A] px-3 py-2 font-mono text-[11px] shadow-xl">
      <div className="mb-1 font-semibold text-[#F7931A]">{label}</div>
      <div className="text-white/80">UTXOs: {fmt.compactNum(payload[0]?.value)}</div>
      {d && <div className="text-white/50">Value: {fmt.compact(d.value)}</div>}
    </div>
  );
};

export default function S29_UTXODistribution() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#111111]">

      {/* ── HEADER ── */}
      <div className="flex flex-none items-center gap-2 border-b border-white/[0.07] px-4 py-3 sm:px-6">
        <Layers size={15} className="flex-none text-[#F7931A]" />
        <span className="font-mono text-[13px] font-semibold tracking-wide text-white/90">
          UTXO Distribution
        </span>
        <span className="hidden font-mono text-[11px] text-white/35 sm:inline">
          — Unspent transaction output analysis
        </span>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid flex-none grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.07]">
        <div className="px-4 py-3 text-center sm:px-6">
          <div className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-white/35">
            Total UTXOs
          </div>
          <div className="font-mono text-[15px] font-bold text-white/90 sm:text-[17px]">
            {fmt.compactNum(totalUTXOs)}
          </div>
        </div>
        <div className="px-4 py-3 text-center sm:px-6">
          <div className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-white/35">
            Total Value
          </div>
          <div className="font-mono text-[15px] font-bold text-[#F7931A] sm:text-[17px]">
            {fmt.compact(totalValue)}
          </div>
        </div>
        <div className="px-4 py-3 text-center sm:px-6">
          <div className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-white/35">
            Avg Value
          </div>
          <div className="font-mono text-[15px] font-bold text-white/90 sm:text-[17px]">
            ${Math.round(avgUTXOValue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">

        {/* Chart panel */}
        <div className="flex min-h-0 flex-col border-b border-white/[0.07] lg:min-w-0 lg:flex-1 lg:border-b-0 lg:border-r">
          <div className="flex-none px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-white/35 sm:px-6">
            UTXOs by Age Band
          </div>
          {/* Fixed height on mobile/tablet; flex-1 on desktop */}
          <div className="h-52 flex-none px-2 pb-2 sm:h-64 lg:min-h-0 lg:h-auto lg:flex-1 lg:px-4 lg:pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageData}
                margin={{ top: 8, right: 16, left: 0, bottom: 28 }}
              >
                <XAxis
                  dataKey="range"
                  stroke="#444"
                  tick={{ fill: '#888', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#333' }}
                  angle={-35}
                  textAnchor="end"
                  height={48}
                />
                <YAxis
                  stroke="#444"
                  tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmt.compactNum(v)}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="utxos" radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={56}>
                  {ageData.map((entry) => (
                    <Cell key={entry.range} fill={barColor(entry.utxos)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown panel */}
        <div className="flex min-h-0 flex-col lg:w-[300px] lg:flex-none">
          <div className="flex-none border-b border-white/[0.07] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white/35 sm:px-5">
            Breakdown by Age
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-4">
            <div className="space-y-1.5">
              {ageData.map((d) => {
                const pct = (d.utxos / totalUTXOs) * 100;
                const color = barColor(d.utxos);
                return (
                  <div
                    key={d.range}
                    className="overflow-hidden rounded border border-white/[0.06] bg-white/[0.02]"
                  >
                    {/* Progress bar background */}
                    <div className="relative px-3 py-2">
                      <div
                        className="absolute inset-y-0 left-0 rounded-l opacity-10"
                        style={{ width: `${pct}%`, background: color }}
                      />
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 flex-none rounded-sm"
                            style={{ background: color }}
                          />
                          <span className="font-mono text-[12px] font-semibold text-white/80">
                            {d.range}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[12px] font-bold" style={{ color }}>
                            {fmt.compactNum(d.utxos)}
                          </div>
                          <div className="font-mono text-[10px] text-white/35">
                            {fmt.compact(d.value)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer totals */}
          <div className="flex-none border-t border-white/[0.07] px-4 py-2">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-white/35">8 age bands</span>
              <span className="text-white/55">
                {fmt.compactNum(totalUTXOs)} UTXOs total
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
