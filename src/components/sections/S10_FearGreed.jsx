import { Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { mockFearGreed } from '../../data/mockData';

const ZONES = [
  { min: 0, max: 24, label: 'Extreme Fear', color: '#FF4757' },
  { min: 25, max: 44, label: 'Fear', color: '#F7931A' },
  { min: 45, max: 55, label: 'Neutral', color: '#8B8A88' },
  { min: 56, max: 74, label: 'Greed', color: '#D4A843' },
  { min: 75, max: 100, label: 'Extreme Greed', color: '#00D897' },
];

function getZone(v) {
  return ZONES.find(z => v >= z.min && v <= z.max) || ZONES[2];
}

function Gauge({ value }) {
  const zone = getZone(value);
  const angle = -135 + (value / 100) * 270;
  const r = 60;
  const cx = 80, cy = 80;

  const arc = (startAngle, endAngle) => {
    const toRad = a => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <svg viewBox="0 0 160 100" style={{ width: '100%', maxWidth: 200 }}>
      {ZONES.map((z, i) => {
        const startAngle = -135 + (z.min / 100) * 270;
        const endAngle = -135 + (z.max / 100) * 270;
        return (
          <path key={i} d={arc(startAngle, endAngle)} fill="none" stroke={z.color} strokeWidth={8} strokeLinecap="butt" opacity={0.3} />
        );
      })}
      {/* Active arc */}
      <path d={arc(-135, -135 + (value / 100) * 270)} fill="none" stroke={zone.color} strokeWidth={8} strokeLinecap="round" />
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + (r - 12) * Math.cos((angle * Math.PI) / 180)}
        y2={cy + (r - 12) * Math.sin((angle * Math.PI) / 180)}
        stroke="white" strokeWidth={2.5} strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={5} fill="var(--bg-elevated)" stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={zone.color} fontSize={20} fontWeight="bold" fontFamily="JetBrains Mono">{value}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill={zone.color} fontSize={8} fontFamily="JetBrains Mono">{zone.label}</text>
    </svg>
  );
}

export default function S10_FearGreed() {
  const d = mockFearGreed;
  return (
    <DashboardCard id="s10" title="Fear & Greed Index" subtitle="Market sentiment (0=Fear, 100=Greed)" icon={Heart} exportData={d}>
      <div className="flex flex-col items-center gap-4">
        <Gauge value={d.value} />
        <div style={{ height: 100, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.history} margin={{ top: 2, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} interval={9} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
              <ReferenceLine y={50} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <Tooltip content={({ active, payload }) => active && payload?.length
                ? <div className="px-2 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                    {payload[0].value} — {getZone(payload[0].value).label}
                  </div> : null} />
              <Line type="monotone" dataKey="value" stroke="#F7931A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardCard>
  );
}
