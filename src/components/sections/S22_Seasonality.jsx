import { Calendar } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { mockSeasonality } from '../../data/mockData';

function getHeatColor(val) {
  if (val > 40) return '#00D897';
  if (val > 20) return '#5BE8B7';
  if (val > 5) return '#A8F0D8';
  if (val > -5) return 'rgba(255,255,255,0.06)';
  if (val > -20) return '#FF9999';
  if (val > -40) return '#FF4757';
  return '#CC0014';
}

export default function S22_Seasonality() {
  const { years, months, data } = mockSeasonality;

  // Monthly averages
  const avgByMonth = months.map((_, mi) => {
    const vals = years.map(y => data[y][mi]);
    return parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1));
  });

  return (
    <DashboardCard id="s22" title="BTC Seasonality" subtitle="Monthly returns heatmap" icon={Calendar} exportData={data} className="col-span-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 600, fontSize: 'var(--fs-tag)' }}>
          <thead>
            <tr>
              <th className="py-1 px-2 text-left text-[var(--text-tertiary)] font-semibold w-12">Year</th>
              {months.map(m => (
                <th key={m} className="py-1 px-1 text-center text-[var(--text-tertiary)] font-semibold">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map(year => (
              <tr key={year}>
                <td className="py-0.5 px-2 font-bold text-[var(--text-secondary)]">{year}</td>
                {data[year].map((val, mi) => (
                  <td key={mi} className="py-0.5 px-0.5">
                    <div
                      className="rounded px-1 py-1 text-center font-bold tabular-nums transition-all hover:scale-110 cursor-default"
                      style={{
                        background: getHeatColor(val),
                        color: Math.abs(val) > 10 ? '#000' : 'var(--text-primary)',
                        fontSize: 9,
                        minWidth: 32,
                      }}
                      title={`${months[mi]} ${year}: ${val >= 0 ? '+' : ''}${val}%`}
                    >
                      {val >= 0 ? '+' : ''}{val}%
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {/* Averages row */}
            <tr className="border-t border-[var(--border-subtle)]">
              <td className="py-1 px-2 font-bold text-[var(--accent-bitcoin)]" style={{ fontSize: 'var(--fs-tag)' }}>Avg</td>
              {avgByMonth.map((avg, mi) => (
                <td key={mi} className="py-0.5 px-0.5">
                  <div className="rounded px-1 py-1 text-center font-bold tabular-nums"
                    style={{ background: getHeatColor(avg), color: Math.abs(avg) > 10 ? '#000' : 'var(--text-primary)', fontSize: 9 }}>
                    {avg >= 0 ? '+' : ''}{avg}%
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
