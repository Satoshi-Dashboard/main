import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Repeat } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { priceSeriesMax, HALVING_DATES, CYCLE_COLORS } from '../../data/mockData';

// Build cycle-normalized data
function buildCycleData() {
  const halvingTs = HALVING_DATES.map(h => new Date(h.date).getTime());
  const cycles = [];

  for (let c = 0; c < halvingTs.length; c++) {
    const start = halvingTs[c];
    const end = halvingTs[c + 1] ?? (start + 4 * 365 * 86400000);
    const segment = priceSeriesMax.filter(d => d.timestamp >= start && d.timestamp < end);
    if (segment.length === 0) continue;
    const basePrice = segment[0].price;
    cycles.push(segment.map(d => ({
      day: Math.round((d.timestamp - start) / 86400000),
      [`cycle${c + 1}`]: parseFloat((d.price / basePrice).toFixed(3)),
    })));
  }

  // Merge by day
  const maxLen = Math.max(...cycles.map(c => c.length));
  const merged = Array.from({ length: Math.min(maxLen, 1400) }, (_, i) => {
    const row = { day: i };
    cycles.forEach((c, ci) => { if (c[i]) row[`cycle${ci + 1}`] = c[i][`cycle${ci + 1}`]; });
    return row;
  }).filter((_, i) => i % 7 === 0);

  return merged;
}

const data = buildCycleData();
const CYCLE_LABELS = HALVING_DATES.map((h, i) => `Cycle ${i + 1} (${h.date.slice(0, 4)})`);

export default function S18_HalvingCycles() {
  return (
    <DashboardCard id="s18" title="Halving Cycle Overlay" subtitle="Price normalized to halving date (log scale)" icon={Repeat} exportData={data} className="col-span-full">
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
              label={{ value: 'Days since halving', position: 'insideBottom', fill: 'var(--text-tertiary)', fontSize: 9 }} />
            <YAxis scale="log" domain={['auto', 'auto']} tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}×`} width={35} />
            <Tooltip content={({ active, payload }) => active && payload?.length
              ? <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}>
                  <div style={{ color: 'var(--text-tertiary)' }}>Day {payload[0]?.payload?.day}</div>
                  {payload.map((p, i) => p.value && (
                    <div key={i} style={{ color: p.stroke }}>{CYCLE_LABELS[i]}: {p.value}×</div>
                  ))}
                </div> : null} />
            <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-secondary)' }} />
            {[1, 2, 3, 4].map((c, i) => (
              <Line key={c} type="monotone" dataKey={`cycle${c}`} stroke={CYCLE_COLORS[i]} strokeWidth={2} dot={false}
                name={CYCLE_LABELS[i]} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
