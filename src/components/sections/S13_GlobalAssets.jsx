import { Globe2 } from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
import { mockGlobalAssets } from '../../data/mockData';

function CustomContent({ x, y, width, height, name, value, color }) {
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={color} fillOpacity={name === 'Bitcoin' ? 0.85 : 0.4} rx={4} />
      {name === 'Bitcoin' && (
        <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill="none" stroke="#F7931A" strokeWidth={1.5} rx={4} opacity={0.6} />
      )}
      {width > 50 && height > 28 && (
        <>
          <text x={x + 8} y={y + 17} fill="#E8E6E3" fontSize={Math.min(12, width / 8)} fontFamily="JetBrains Mono" fontWeight="bold">{name}</text>
          {height > 40 && (
            <text x={x + 8} y={y + 30} fill="rgba(232,230,227,0.6)" fontSize={Math.min(10, width / 10)} fontFamily="JetBrains Mono">
              {fmt.usdCompact(value)}
            </text>
          )}
        </>
      )}
    </g>
  );
}

export default function S13_GlobalAssets() {
  const total = mockGlobalAssets.reduce((s, a) => s + a.value, 0);

  return (
    <DashboardCard id="s13" title="Global Asset Treemap" subtitle="BTC vs world assets" icon={Globe2} exportData={mockGlobalAssets}>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={mockGlobalAssets}
            dataKey="value"
            content={<CustomContent />}
            isAnimationActive={false}
          >
            <Tooltip
              content={({ active, payload }) => active && payload?.length
                ? <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}>
                    <div className="font-bold">{payload[0].payload.name}</div>
                    <div>{fmt.usdCompact(payload[0].payload.value)}</div>
                    <div style={{ color: 'var(--text-tertiary)' }}>{((payload[0].payload.value / total) * 100).toFixed(1)}% of tracked assets</div>
                  </div>
                : null
              }
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {mockGlobalAssets.map(a => (
          <div key={a.name} className="flex items-center gap-1.5" style={{ fontSize: 'var(--fs-tag)' }}>
            <div className="w-2 h-2 rounded-sm" style={{ background: a.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{a.name}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
