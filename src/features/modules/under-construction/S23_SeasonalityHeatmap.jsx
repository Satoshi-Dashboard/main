// Bitcoin Seasonality — Monthly Returns Heatmap
// Green = positive, Red = negative, darker = larger magnitude

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Monthly % returns by year (null = future/unknown)
const DATA = {
  2025: [11.8, -21.4, -3.9, 14.0,  8.9,  3.2,  null, null, null, null,  null,  null],
  2024: [ 0.6,  43.5, 16.8,-14.8, 11.1, -7.0,   3.0, -8.6,  7.3, 10.8,  37.3,  -2.9],
  2023: [39.6,   0.0, 23.0,  2.8, -7.0, 12.0,  -4.0,-11.3,  3.9, 28.5,   8.8,  12.2],
  2022: [-16.7, 12.2,  5.4,-17.3,-15.6,-37.3,  16.8,-13.9, -3.1,  5.6, -16.2,  -3.6],
  2021: [14.5,  36.8, 29.8, -2.0,-35.3, -6.0,  18.2, 13.8, -7.0, 39.9,  -7.1, -18.9],
  2020: [29.9,  -8.6,-24.9, 34.3,  9.5, -3.2,  24.0,  2.8, -7.5, 27.7,  43.0,  46.9],
  2019: [-8.6,  11.1,  7.0, 34.4, 52.4, 26.7,  -6.6, -4.6,-13.4, 10.2, -17.3,  -5.2],
  2018: [-25.4,  0.5,-32.9, 33.4,-19.0,-14.6,  21.0, -9.3, -5.6, -3.8, -36.6,  -5.2],
  2017: [ -0.0, 23.1, -9.1, 32.7, 52.7, 10.4,  17.9, 65.3, -7.4, 47.8,  53.5,  38.9],
  2016: [-14.8, 20.1, -5.3,  7.3, 18.8, 27.1,  -7.7, -7.5,  6.0, 14.7,   5.4,  30.8],
  2015: [-33.0, 18.4, -4.4, -3.5, -3.2, 15.2,   8.2,-18.7,  2.4, 33.5,  19.3,  13.8],
  2014: [ 10.0,-31.0,-17.3, -1.6, 39.5,  2.2,  -9.7,-17.6,-19.0,-12.9,  12.8, -15.1],
  2013: [ 44.0, 61.8,172.8, 50.0, -8.6,-29.9,   9.6, 30.4, 26.7, 84.9, 449.4, -34.8],
};

const YEARS = Object.keys(DATA).map(Number).sort((a, b) => b - a);

// Compute monthly averages and medians
function colStats(monthIdx) {
  const vals = YEARS.map(y => DATA[y][monthIdx]).filter(v => v !== null);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sorted = [...vals].sort((a, b) => a - b);
  const med = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  return { avg: +avg.toFixed(1), med: +med.toFixed(1) };
}

const COL_STATS = MONTHS.map((_, i) => colStats(i));

function cellBg(v) {
  if (v === null) return '#1c1c1c';
  const mag = Math.min(Math.abs(v) / 60, 1); // cap at 60% for full saturation
  if (v >= 0) {
    // green: #1a3d1a (dim) → #22aa44 (bright)
    const g = Math.round(40 + mag * 130);
    const r = Math.round(10 + mag * 10);
    return `rgb(${r},${g},${Math.round(r * 0.8)})`;
  } else {
    // red: #3d1a1a (dim) → #cc2222 (bright)
    const r = Math.round(60 + mag * 140);
    const g = Math.round(10 + mag * 10);
    return `rgb(${r},${g},${g})`;
  }
}

function cellText(v) {
  if (v === null) return '';
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
}

export default function S22_SeasonalityHeatmap() {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Title */}
      <div className="flex-none pt-5 pb-3 text-center">
        <h1 style={{
          color: '#F7931A', fontFamily: 'monospace',
          fontSize: 'var(--fs-subtitle)', fontWeight: 700,
        }}>
          Seasonality (Monthly Returns)
        </h1>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 px-4 pb-4 overflow-auto">
        <table style={{
          width: '100%', borderCollapse: 'separate', borderSpacing: 2,
          fontFamily: 'monospace', fontSize: 'var(--fs-micro)',
          tableLayout: 'fixed',
        }}>
          {/* Header row */}
          <thead>
            <tr>
              <th style={{ color: '#555', fontWeight: 400, padding: '4px 0', width: '5%' }} />
              {MONTHS.map((m) => (
                <th key={m} style={{
                  color: '#aaaaaa', fontWeight: 600, textAlign: 'center',
                  padding: '4px 2px', letterSpacing: '0.02em',
                }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YEARS.map((yr) => (
              <tr key={yr}>
                <td style={{
                  color: '#888', fontWeight: 600, textAlign: 'right',
                  paddingRight: 8, whiteSpace: 'nowrap',
                }}>{yr}</td>
                {DATA[yr].map((v, mi) => (
                  <td key={mi} style={{
                    backgroundColor: cellBg(v),
                    color: v === null ? 'transparent' : '#ffffff',
                    textAlign: 'center',
                    padding: '5px 2px',
                    borderRadius: 3,
                    fontWeight: v !== null && Math.abs(v) > 30 ? 700 : 400,
                  }}>
                    {cellText(v)}
                  </td>
                ))}
              </tr>
            ))}

            {/* Spacer */}
            <tr><td colSpan={13} style={{ height: 8 }} /></tr>

            {/* Average row */}
            <tr>
              <td style={{ color: '#666', fontWeight: 600, textAlign: 'right', paddingRight: 8 }}>Average</td>
              {COL_STATS.map((s, i) => (
                <td key={i} style={{
                  backgroundColor: '#1e1e1e',
                  color: s.avg >= 0 ? '#5aaa70' : '#cc5555',
                  textAlign: 'center', padding: '5px 2px', borderRadius: 3,
                }}>
                  {s.avg >= 0 ? '+' : ''}{s.avg}%
                </td>
              ))}
            </tr>

            {/* Median row */}
            <tr>
              <td style={{ color: '#666', fontWeight: 600, textAlign: 'right', paddingRight: 8 }}>Median</td>
              {COL_STATS.map((s, i) => (
                <td key={i} style={{
                  backgroundColor: '#1e1e1e',
                  color: s.med >= 0 ? '#5aaa70' : '#cc5555',
                  textAlign: 'center', padding: '5px 2px', borderRadius: 3,
                }}>
                  {s.med >= 0 ? '+' : ''}{s.med}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
