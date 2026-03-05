import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { mockAddressDistribution } from '../../data/mockData';

const COLORS = ['#F7931A', '#D4A843', '#E8A020', '#C89030', '#A87028', '#886028', '#685030', '#484028', '#283820'];

export default function S11_AddressDist() {
  return (
    <DashboardCard id="s11" title="Address Distribution" subtitle="Addresses grouped by BTC balance" icon={PieChart} exportData={mockAddressDistribution}>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockAddressDistribution} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : v} />
            <YAxis type="category" dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={({ active, payload }) => active && payload?.length
              ? <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}>
                  <div className="font-bold">{payload[0].payload.range}</div>
                  <div>{payload[0].value.toLocaleString()} addresses</div>
                  <div style={{ color: 'var(--text-tertiary)' }}>{payload[0].payload.pct}%</div>
                </div> : null} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {mockAddressDistribution.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
