import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockDominance } from '../../data/mockData';

export default function S28_Dominance() {
  const d = mockDominance;

  return (
    <DashboardCard id="s28" title="BTC Dominance" subtitle="Bitcoin share of total crypto market" icon={BarChart3} exportData={d}>
      <div className="flex flex-col gap-4">
        {/* Donut + stats */}
        <div className="flex items-center gap-4">
          <div style={{ width: 120, height: 120, flex: '0 0 120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.breakdown} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} startAngle={90} endAngle={-270} strokeWidth={0}>
                  {d.breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={i === 0 ? 1 : 0.6} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length
                  ? <div className="px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                      {payload[0].payload.name}: {payload[0].value}%
                    </div> : null} />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center -mt-2" style={{ fontSize: 'var(--fs-tag)' }}>
              <span className="font-bold" style={{ color: 'var(--accent-bitcoin)' }}>{d.btcDominance}%</span>
              <br/><span style={{ color: 'var(--text-tertiary)' }}>BTC Dom.</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-2">
            {[
              { label: 'Total Market Cap', value: fmt.usdCompact(d.totalMarketCap) },
              { label: '24h Volume', value: fmt.usdCompact(d.totalVolume24h) },
              { label: 'Active Cryptos', value: d.activeCryptos.toLocaleString() },
            ].map(s => (
              <div key={s.label} className="px-2.5 py-1.5 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <div className="text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-tag)' }}>{s.label}</div>
                <div className="font-bold text-[var(--text-primary)] tabular-nums" style={{ fontSize: 'var(--fs-tag)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {d.breakdown.map(e => (
            <div key={e.name} className="flex items-center gap-1.5" style={{ fontSize: 'var(--fs-tag)' }}>
              <div className="w-2 h-2 rounded-sm" style={{ background: e.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{e.name}: {e.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
