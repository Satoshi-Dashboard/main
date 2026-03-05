import { Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockTxCount } from '../../data/mockData';

// Sample every 7 days
const data = mockTxCount.filter((_, i) => i % 7 === 0);
const avg = data.reduce((s, d) => s + d.count, 0) / data.length;

export default function S14_TxCount() {
  return (
    <DashboardCard id="s14" title="Transaction Count" subtitle="Daily confirmed transactions (2 years)" icon={Activity} exportData={data}>
      <div className="flex items-center gap-4 mb-3">
        <div>
          <div className="tracking-widest uppercase text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-tag)' }}>Latest</div>
          <div className="font-bold tabular-nums text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-micro)' }}>{fmt.number(data[data.length - 1].count)}</div>
        </div>
        <div>
          <div className="tracking-widest uppercase text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-tag)' }}>2Y Average</div>
          <div className="font-bold tabular-nums text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-micro)' }}>{fmt.number(Math.round(avg))}</div>
        </div>
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D897" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#00D897" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 6)} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={40} />
            <ReferenceLine y={avg} stroke="rgba(247,147,26,0.4)" strokeDasharray="4 4" label={{ value: 'Avg', fill: 'var(--accent-bitcoin)', fontSize: 9, position: 'right' }} />
            <Tooltip content={({ active, payload }) => active && payload?.length
              ? <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}>
                  <div className="font-bold">{fmt.number(payload[0].value)}</div>
                  <div style={{ color: 'var(--text-tertiary)' }}>{payload[0].payload.date}</div>
                </div> : null} />
            <Area type="monotone" dataKey="count" stroke="#00D897" strokeWidth={2} fill="url(#txGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
