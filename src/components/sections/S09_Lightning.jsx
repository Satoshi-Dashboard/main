import { Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { mockLightning } from '../../data/mockData';

export default function S09_Lightning() {
  const d = mockLightning;
  return (
    <DashboardCard id="s09" title="Lightning Network" subtitle="Payment channel stats" icon={Zap} exportData={d}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Capacity', value: `${d.capacity.toFixed(2)} BTC` },
            { label: 'Active Nodes', value: d.nodes.toLocaleString() },
            { label: 'Channels', value: d.channels.toLocaleString() },
            { label: 'Avg Cap/Node', value: `${d.avgCapacityPerNode} BTC` },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <div className="tracking-widest uppercase text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-tag)' }}>{s.label}</div>
              <div className="font-bold tabular-nums mt-0.5" style={{ color: s.label === 'Total Capacity' ? 'var(--accent-bitcoin)' : 'var(--text-primary)', fontSize: 'var(--fs-micro)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 140 }}>
          <div className="tracking-widest uppercase text-[var(--text-tertiary)] mb-1" style={{ fontSize: 'var(--fs-tag)' }}>30-Day Capacity (BTC)</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.history} margin={{ top: 2, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={9} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={({ active, payload }) => active && payload?.length
                ? <div className="px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                    {payload[0].value.toFixed(1)} BTC
                  </div> : null} />
              <Line type="monotone" dataKey="capacity" stroke="#F7931A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
