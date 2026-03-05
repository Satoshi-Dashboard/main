// Tiers ordered top (richest/fewest) to bottom (most/poorest)
const TIERS = [
  { threshold: '> $10M',  addresses: 20130,      color: '#c25200' },
  { threshold: '> $1M',   addresses: 160613,     color: '#cd6618' },
  { threshold: '> $100K', addresses: 1079860,    color: '#da7e30' },
  { threshold: '> $10K',  addresses: 4702685,    color: '#e49448' },
  { threshold: '> $1K',   addresses: 12808796,   color: '#ecaa62' },
  { threshold: '> $100',  addresses: 24276731,   color: '#f3c280' },
  { threshold: '> $1',    addresses: 48817371,   color: '#f9d8a4' },
];

// SVG layout constants
const VW = 1000;
const VH = 700;
const CX = 500;
const PY_TOP = 40;
const PY_BOT = 590;
const MIN_HW = 55;  // half-width at top
const MAX_HW = 330; // half-width at bottom
const N = TIERS.length;
const TIER_H = (PY_BOT - PY_TOP) / N;

function hw(y) {
  return MIN_HW + (MAX_HW - MIN_HW) * (y - PY_TOP) / (PY_BOT - PY_TOP);
}

export default function S15_WealthPyramid() {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Title */}
      <div className="flex-none px-10 pt-6 pb-1">
        <h1
          style={{
            color: '#F7931A',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 700,
          }}
        >
          Bitcoin Wealth Distribution
        </h1>
      </div>

      {/* SVG */}
      <div className="min-h-0 flex-1 flex items-center justify-center px-4 pb-4">
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          style={{ width: '100%', height: '100%', maxHeight: '100%' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {TIERS.map((tier, i) => {
            const yTop = PY_TOP + i * TIER_H;
            const yBot = PY_TOP + (i + 1) * TIER_H;
            const yCen = (yTop + yBot) / 2;

            // Pyramid edges at mid-height of this tier
            const xLC = CX - hw(yCen);
            const xRC = CX + hw(yCen);

            // Trapezoid corners
            const xlTop = CX - hw(yTop);
            const xrTop = CX + hw(yTop);
            const xlBot = CX - hw(yBot);
            const xrBot = CX + hw(yBot);

            return (
              <g key={i}>
                {/* Trapezoid slice */}
                <polygon
                  points={`${xlTop},${yTop} ${xrTop},${yTop} ${xrBot},${yBot} ${xlBot},${yBot}`}
                  fill={tier.color}
                  stroke="#111111"
                  strokeWidth="2"
                />

                {/* Left tick → annotation */}
                <line x1={xLC - 2} y1={yCen} x2={xLC - 20} y2={yCen} stroke="#444" strokeWidth="1" />
                <text
                  x={xLC - 26}
                  y={yCen}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#cccccc"
                  fontSize="13"
                  fontFamily="monospace"
                >
                  {tier.addresses.toLocaleString()}
                </text>

                {/* Right tick → annotation */}
                <line x1={xRC + 2} y1={yCen} x2={xRC + 20} y2={yCen} stroke="#444" strokeWidth="1" />
                <text
                  x={xRC + 26}
                  y={yCen}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fill="#F7931A"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {tier.threshold}
                </text>
              </g>
            );
          })}

          {/* Bottom column headers */}
          <text
            x={CX - MAX_HW - 26}
            y={PY_BOT + 36}
            textAnchor="middle"
            fill="#555"
            fontSize="11"
            fontFamily="monospace"
          >
            Total number of addresses
          </text>
          <text
            x={CX}
            y={PY_BOT + 36}
            textAnchor="middle"
            fill="#444"
            fontSize="11"
            fontFamily="monospace"
          >
            Distribution of Bitcoin addresses by value held
          </text>
          <text
            x={CX + MAX_HW + 26}
            y={PY_BOT + 36}
            textAnchor="middle"
            fill="#555"
            fontSize="11"
            fontFamily="monospace"
          >
            USD Value
          </text>
        </svg>
      </div>
    </div>
  );
}
