import { ShoppingBag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockBigMac } from '../../data/mockData';

export default function S23_BigMac() {
  const d = mockBigMac;
  return (
    <DashboardCard id="s23" title="Big Mac Index" subtitle="Bitcoin purchasing power in Big Macs" icon={ShoppingBag} exportData={d}>
      <div className="flex flex-col items-center gap-4">
        {/* Giant number */}
        <div className="text-center py-4">
          <div className="tracking-widest uppercase text-[var(--text-tertiary)] mb-2" style={{ fontSize: 'var(--fs-tag)' }}>1 BTC buys</div>
          <div className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-hero)', color: 'var(--accent-bitcoin)', lineHeight: 1 }}>
            {d.bigMacsPerBtc.toLocaleString()}
          </div>
          <div className="text-base mt-1" style={{ color: 'var(--text-secondary)' }}>🍔 Big Macs</div>
          <div className="text-[var(--text-tertiary)] mt-1" style={{ fontSize: 'var(--fs-tag)' }}>
            @ {fmt.usd(d.bigMacPrice)} per Big Mac · BTC = {fmt.usd(d.btcPrice, 0)}
          </div>
        </div>

        {/* History chart */}
        <div style={{ height: 120, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.history} margin={{ top: 2, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} width={50}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={({ active, payload }) => active && payload?.length
                ? <div className="px-2 py-1.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                    <div className="font-bold">{payload[0].value.toLocaleString()} 🍔</div>
                    <div style={{ color: 'var(--text-tertiary)' }}>{payload[0].payload.month}</div>
                  </div> : null} />
              <Line type="monotone" dataKey="bigMacs" stroke="#F7931A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
