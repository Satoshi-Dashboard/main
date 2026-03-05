import { Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockUTXO } from '../../data/mockData';

const AGE_COLORS = ['#FF4757', '#FF6B35', '#F7931A', '#D4A843', '#A0A030', '#4CAF80', '#00D897', '#00BBAA'];

export default function S29_UTXO() {
  const d = mockUTXO;
  return (
    <DashboardCard id="s29" title="UTXO Distribution" subtitle="Unspent outputs by age" icon={Database} exportData={d}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total UTXOs', value: fmt.number(d.total) },
            { label: 'Avg Value', value: `${d.avgValue} BTC` },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
              <div className="tracking-widest uppercase text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-tag)' }}>{s.label}</div>
              <div className="font-bold tabular-nums mt-0.5 text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-micro)' }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 220 }}>
          <div className="tracking-widest uppercase text-[var(--text-tertiary)] mb-2" style={{ fontSize: 'var(--fs-tag)' }}>UTXO Count by Age</div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.byAge} margin={{ top: 0, right: 10, bottom: 40, left: 0 }}>
              <XAxis dataKey="age" tick={{ fill: 'var(--text-tertiary)', fontSize: 9, angle: -35, textAnchor: 'end' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} width={35} />
              <Tooltip content={({ active, payload }) => active && payload?.length
                ? <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}>
                    <div className="font-bold">{payload[0].payload.age}</div>
                    <div>{payload[0].value.toLocaleString()} UTXOs</div>
                    <div style={{ color: 'var(--text-tertiary)' }}>{payload[0].payload.btc.toLocaleString()} BTC</div>
                  </div> : null} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {d.byAge.map((_, i) => (
                  <Cell key={i} fill={AGE_COLORS[i]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
