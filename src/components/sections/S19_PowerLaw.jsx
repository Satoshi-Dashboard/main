import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { BarChart2 } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockPowerLaw } from '../../data/mockData';

export default function S19_PowerLaw() {
  return (
    <DashboardCard id="s19" title="Bitcoin Power Law" subtitle="log(price) = a × log(days) + b" icon={BarChart2} exportData={mockPowerLaw}>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockPowerLaw} margin={{ top: 5, right: 10, bottom: 0, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="days" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
              label={{ value: 'Days since genesis', position: 'insideBottom', fill: 'var(--text-tertiary)', fontSize: 9 }} />
            <YAxis scale="log" domain={['auto', 'auto']} tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`} width={50} />
            <Tooltip content={({ active, payload }) => active && payload?.length
              ? <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}>
                  <div>Day {payload[0]?.payload?.days}</div>
                  <div style={{ color: 'var(--accent-green)' }}>Model: {fmt.usd(payload[0]?.payload?.modelPrice, 0)}</div>
                  <div style={{ color: 'var(--accent-bitcoin)' }}>Actual: {fmt.usd(payload[0]?.payload?.actualPrice, 0)}</div>
                </div> : null} />
            <Line type="monotone" dataKey="modelPrice" stroke="#00D897" strokeWidth={2} dot={false} name="Power Law Model" />
            <Line type="monotone" dataKey="actualPrice" stroke="#F7931A" strokeWidth={1.5} dot={false} name="Actual Price" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--fs-tag)' }}><div className="w-3 h-0.5 bg-[var(--accent-green)]" /><span className="text-[var(--text-secondary)]">Power Law Model</span></div>
        <div className="flex items-center gap-1.5" style={{ fontSize: 'var(--fs-tag)' }}><div className="w-3 h-0.5 bg-[var(--accent-bitcoin)]" /><span className="text-[var(--text-secondary)]">Actual Price</span></div>
      </div>
    </DashboardCard>
  );
}
