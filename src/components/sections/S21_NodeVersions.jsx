import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Top reachable node versions (bitnodes.io snapshot)
const VERSIONS = [
  { version: 'Core:28.1.0',                  count: 4275 },
  { version: 'Core:29.0.0',                  count: 2651 },
  { version: 'Core:26.0.0',                  count: 2479 },
  { version: 'Knots:20250305',               count: 2265 },
  { version: 'Core:27.1.0',                  count: 1831 },
  { version: 'Core:28.0.0',                  count: 1550 },
  { version: 'Core:27.0.0',                  count: 1309 },
  { version: 'Core:25.0.0',                  count: 1075 },
  { version: 'Core:25.1.0(FutureBit Apollo)', count: 674 },
  { version: 'Core:24.0.1',                  count: 432 },
  { version: 'Core:23.0.0',                  count: 397 },
  { version: 'Core:22.0.0',                  count: 385 },
  { version: 'Core:27.2.0',                  count: 256 },
  { version: 'Core:0.21.1',                  count: 228 },
  { version: 'Core:22.0.0(FutureBit Apollo)', count: 211 },
];

const TOTAL = VERSIONS.reduce((s, v) => s + v.count, 0);

// Donut: Core vs Knots
const coreCount = VERSIONS.filter(v => !v.version.startsWith('Knots')).reduce((s, v) => s + v.count, 0);
const knotsCount = VERSIONS.filter(v => v.version.startsWith('Knots')).reduce((s, v) => s + v.count, 0);
const DONUT = [
  { name: 'Core',  value: coreCount,  color: '#F7931A' },
  { name: 'Knots', value: knotsCount, color: '#2e8b57' },
];

export default function S21_NodeVersions() {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Title */}
      <div className="flex-none px-10 pt-6 pb-4">
        <h1 style={{
          color: '#F7931A', fontFamily: 'monospace',
          fontSize: 'var(--fs-subtitle)', fontWeight: 700,
        }}>
          Top Reachable Node Versions
        </h1>
      </div>

      {/* Body: table left, donut right */}
      <div className="min-h-0 flex-1 flex gap-6 px-10 pb-6">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 'var(--fs-caption)' }}>
            <thead>
              <tr>
                {['VERSION', 'COUNT', '% OF TOTAL'].map((h) => (
                  <th key={h} style={{
                    color: '#F7931A', fontWeight: 700, textAlign: 'left',
                    padding: '6px 12px 10px', letterSpacing: '0.06em', fontSize: 'var(--fs-micro)',
                    borderBottom: '1px solid #2a2a2a',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VERSIONS.map((v, i) => {
                const pct = (v.count / TOTAL * 100).toFixed(2);
                const isKnots = v.version.startsWith('Knots');
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '7px 12px', color: isKnots ? '#2e8b57' : '#cccccc' }}>{v.version}</td>
                    <td style={{ padding: '7px 12px', color: '#aaaaaa' }}>{v.count.toLocaleString()}</td>
                    <td style={{ padding: '7px 12px', color: '#888888' }}>{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Donut chart */}
        <div className="flex-none flex flex-col items-center justify-center" style={{ width: '42%' }}>
          <div style={{ width: '100%', height: 280, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DONUT}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                  isAnimationActive={false}
                >
                  {DONUT.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', fontSize: 11 }}
                  formatter={(v, name) => [`${(v / TOTAL * 100).toFixed(1)}% (${v.toLocaleString()})`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', textAlign: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{ color: '#ffffff', fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--fs-section)' }}>
                {TOTAL.toLocaleString()}
              </div>
              <div style={{ color: '#666', fontFamily: 'monospace', fontSize: 'var(--fs-micro)' }}>Nodes</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: 8 }}>
            {DONUT.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: d.color }} />
                <span style={{ color: '#888', fontFamily: 'monospace', fontSize: 'var(--fs-micro)' }}>
                  {d.name}
                </span>
                <span style={{ color: '#555', fontFamily: 'monospace', fontSize: 'var(--fs-micro)' }}>
                  {(d.value / TOTAL * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
