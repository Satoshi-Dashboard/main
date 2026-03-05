import { ResponsiveContainer, Treemap } from 'recharts';

// Ordered largest→smallest so Recharts index matches this array
const ASSET_DATA = [
  { name: 'Real Estate',  size: 330,   color: '#c4a882', textColor: '#111' },
  { name: 'Bonds',        size: 300,   color: '#c8c8c0', textColor: '#111' },
  { name: 'Money',        size: 120,   color: '#7ec87e', textColor: '#111' },
  { name: 'Equities',     size: 115,   color: '#7ab8e8', textColor: '#111' },
  { name: 'Gold',         size: 23.08, color: '#f0c040', textColor: '#111' },
  { name: 'Art',          size: 18,    color: '#a0c8e8', textColor: '#111' },
  { name: 'Collectibles', size: 6,     color: '#b898e0', textColor: '#fff' },
  { name: '₿ Bitcoin',   size: 2.14,  color: '#F7931A', textColor: '#fff' },
];

// Only pass name + size to Recharts; look everything else up by name or index
const TREEMAP_DATA = ASSET_DATA.map(({ name, size }) => ({ name, size }));

function AssetCell(props) {
  const { x, y, width, height, index, name: propName } = props;
  if (!width || !height || width < 4 || height < 4) return null;

  // Look up by name first (Recharts does pass 'name'), then fall back to index
  const asset =
    ASSET_DATA.find((a) => a.name === propName) ?? ASSET_DATA[index] ?? ASSET_DATA[0];

  const { color, textColor, size } = asset;
  const displayName = asset.name;

  const fs = Math.min(width / 7, height / 4, 15);
  const show = width > 55 && height > 40;

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        fill={color}
      />
      {show && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - fs * 0.8}
            textAnchor="middle"
            fill={textColor}
            fontSize={Math.max(8, fs)}
            fontFamily="monospace"
            fontWeight="600"
          >
            {displayName}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + fs * 0.9}
            textAnchor="middle"
            fill={textColor}
            fontSize={Math.max(7, fs * 0.85)}
            fontFamily="monospace"
          >
            ${size.toFixed(2)}T
          </text>
        </>
      )}
    </g>
  );
}

export default function S13_GlobalAssetsTreemap() {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Title */}
      <div className="flex-none px-10 pt-6 pb-3">
        <h1
          style={{
            color: '#F7931A',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 700,
          }}
        >
          Total Global Assets
        </h1>
      </div>

      {/* Treemap */}
      <div className="min-h-0 flex-1 px-6 pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={TREEMAP_DATA}
            dataKey="size"
            content={<AssetCell />}
            isAnimationActive={false}
          />
        </ResponsiveContainer>
      </div>
    </div>
  );
}
