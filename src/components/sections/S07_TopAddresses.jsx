import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';

/* Historical data: days BTC has spent in each price range */
const PRICE_RANGES = [
  { range: '$1m – $10m', days: 0,    color: '#F7931A' },
  { range: '$100k – $1m', days: 28,  color: '#F7931A' },
  { range: '$10k – $100k', days: 1340, color: '#F7931A' },
  { range: '$1k – $10k', days: 820,  color: '#F7931A' },
  { range: '$100 – $1k',  days: 981,  color: '#F7931A' },
  { range: '$10 – $100',  days: 352,  color: '#F7931A' },
  { range: '$1 – $10',    days: 374,  color: '#F7931A' },
];

/* Custom tooltip */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-[#F7931A]/40 bg-[#111]/95 px-3 py-2 font-monos">
      <div className="text-white/50">{payload[0]?.payload?.range}</div>
      <div className="text-[#F7931A] font-bold">{payload[0].value} days</div>
    </div>
  );
}

/* Custom bar with orange border + dark fill */
function CustomBar(props) {
  const { x, y, width, height } = props;
  if (!width || !height) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="#2a2a2a" stroke="#F7931A" strokeWidth="1.5" />
    </g>
  );
}

export default function S07_TopAddresses() {
  const maxDays = Math.max(...PRICE_RANGES.map((r) => r.days));

  return (
    <div className="flex h-full w-full flex-col bg-[#111111] px-6 py-5">
      {/* Title */}
      <div
        className="mb-4 flex-none text-center font-mono font-bold text-[#F7931A]"
        style={{ fontSize: 'var(--fs-section)' }}
      >
        Days Bitcoin Has Spent in Price Ranges
      </div>

      {/* Chart */}
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={PRICE_RANGES}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
            barCategoryGap="18%"
          >
            <XAxis
              type="number"
              domain={[0, Math.ceil(maxDays / 200) * 200]}
              tickCount={11}
              tick={{ fill: '#555', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="range"
              width={120}
              tick={{ fill: '#888', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Bar
              dataKey="days"
              shape={<CustomBar />}
              isAnimationActive={false}
              label={{
                position: 'right',
                formatter: (v) => (v === 0 ? '' : `${v}`),
                fill: '#666',
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {PRICE_RANGES.map((_, i) => (
                <Cell key={i} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer note */}
      <div className="mt-2 flex-none text-center font-mono text-white/20 tracking-widest" style={{ fontSize: 'var(--fs-tag)' }}>
        HISTORICAL DATA — SINCE GENESIS BLOCK 2009
      </div>
    </div>
  );
}
