import { AlertTriangle } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { mockMVRV } from '../../data/mockData';

const latest = mockMVRV[mockMVRV.length - 1];

function zScoreColor(z) {
  if (z < 0) return '#00D897';
  if (z < 4) return '#D4A843';
  return '#FF4757';
}

export default function S26_MVRV() {
  return (
    <DashboardCard id="s26" title="MVRV Z-Score" subtitle="Market Value vs. Realized Value" icon={AlertTriangle} exportData={mockMVRV}>
      <div className="flex gap-3 mb-3">
        <div className="p-3 rounded-xl flex-1" style={{ background: 'var(--bg-elevated)' }}>
          <div className="tracking-widest uppercase text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-tag)' }}>MVRV Ratio</div>
          <div className="font-bold tabular-nums mt-0.5" style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-micro)' }}>{latest.mvrv}</div>
        </div>
        <div className="p-3 rounded-xl flex-1" style={{ background: 'var(--bg-elevated)' }}>
          <div className="tracking-widest uppercase text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-tag)' }}>Z-Score</div>
          <div className="font-bold tabular-nums mt-0.5" style={{ color: zScoreColor(latest.zScore), fontSize: 'var(--fs-micro)' }}>{latest.zScore}</div>
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockMVRV} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={29} />
            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
            <ReferenceLine y={0} stroke="rgba(0,216,151,0.3)" strokeDasharray="3 3" />
            <ReferenceLine y={7} stroke="rgba(255,71,87,0.3)" strokeDasharray="3 3" />
            <Tooltip content={({ active, payload }) => active && payload?.length
              ? <div className="px-2 py-1.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                  <div>MVRV: {payload[0]?.payload?.mvrv}</div>
                  <div style={{ color: zScoreColor(payload[0]?.payload?.zScore) }}>Z: {payload[0]?.payload?.zScore}</div>
                </div> : null} />
            <Line type="monotone" dataKey="mvrv" stroke="#F7931A" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="zScore" stroke="#D4A843" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
