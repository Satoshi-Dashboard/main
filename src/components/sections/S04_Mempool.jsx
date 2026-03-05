import { BarChart2, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockMempool } from '../../data/mockData';

const FEE_LEVELS = [
  { label: 'Next Block', key: 'fastest', color: '#FF4757' },
  { label: '~30 min', key: 'halfHour', color: '#F7931A' },
  { label: '~1 hour', key: 'hour', color: '#D4A843' },
  { label: 'Economy', key: 'economy', color: '#00D897' },
  { label: 'Minimum', key: 'minimum', color: '#8B8A88' },
];

export default function S04_Mempool() {
  const d = mockMempool;
  const pctFull = Math.min((d.vsize / 300) * 100, 100);

  return (
    <DashboardCard id="s04" title="Mempool" subtitle="Pending transactions & fee rates" icon={BarChart2} exportData={d}>
      <div className="flex flex-col gap-4">
        {/* Main stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending TXs', value: fmt.number(d.count) },
            { label: 'Mempool Size', value: `${d.vsize.toFixed(1)} vMB` },
            { label: 'Total Fees', value: `${d.total_fee} BTC` },
          ].map(s => (
            <div key={s.label} className="p-2.5 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] tracking-widest uppercase text-[var(--text-tertiary)]">{s.label}</div>
              <div className="text-sm font-bold tabular-nums text-[var(--text-primary)] mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Gauge */}
        <div>
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
            <span>Mempool Fullness</span>
            <span>{pctFull.toFixed(0)}% of 300 vMB</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pctFull}%`,
                background: pctFull > 75 ? '#FF4757' : pctFull > 40 ? '#F7931A' : '#00D897',
              }}
            />
          </div>
        </div>

        {/* Fee tiers */}
        <div>
          <div className="text-[10px] tracking-widest uppercase text-[var(--text-tertiary)] mb-2">Fee Rates (sat/vByte)</div>
          <div className="flex flex-col gap-1.5">
            {FEE_LEVELS.map(f => (
              <div key={f.key} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-secondary)] w-20 flex-shrink-0">{f.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(d.fees[f.key] / d.fees.fastest) * 100}%`, background: f.color }} />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-12 text-right" style={{ color: f.color }}>
                  {d.fees[f.key]} sat
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 24h mempool history */}
        <div style={{ height: 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.history} barSize={6} margin={{ top: 0, bottom: 0 }}>
              <Bar dataKey="size" fill="var(--accent-bitcoin)" opacity={0.7} radius={[2,2,0,0]} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={5} />
              <Tooltip
                content={({ active, payload }) => active && payload?.length
                  ? <div className="px-2 py-1 rounded text-[10px]" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                      {payload[0].value.toFixed(1)} vMB
                    </div>
                  : null
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
