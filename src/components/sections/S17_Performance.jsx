import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockPerformance } from '../../data/mockData';

export default function S17_Performance() {
  return (
    <DashboardCard id="s17" title="Price Performance" subtitle="ROI by time period" icon={TrendingUp} exportData={mockPerformance}>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockPerformance} layout="vertical" margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v >= 0 ? '+' : ''}${v}%`} />
            <YAxis type="category" dataKey="period" tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={({ active, payload }) => active && payload?.length
              ? <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}>
                  <div className="font-bold">{payload[0].payload.period}</div>
                  <div style={{ color: payload[0].value >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {fmt.pct(payload[0].value)}
                  </div>
                </div> : null} />
            <Bar dataKey="roi" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'var(--text-secondary)', fontSize: 9, formatter: v => `${v >= 0 ? '+' : ''}${v}%` }}>
              {mockPerformance.map((entry, i) => (
                <Cell key={i} fill={entry.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
