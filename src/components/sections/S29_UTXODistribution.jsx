import DashboardCard from '../common/DashboardCard';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';
import { fmt } from '../../utils/formatters';
import UniqueVisitorsCounter from '../common/UniqueVisitorsCounter';

const ageData = [
  { range: '0-1d', utxos: 12340000, value: 5600000000 },
  { range: '1d-1w', utxos: 23450000, value: 8900000000 },
  { range: '1w-1m', utxos: 34560000, value: 12300000000 },
  { range: '1m-6m', utxos: 45670000, value: 18700000000 },
  { range: '6m-1y', utxos: 23456000, value: 14200000000 },
  { range: '1y-2y', utxos: 19234000, value: 12800000000 },
  { range: '2y-5y', utxos: 18765000, value: 14500000000 },
  { range: '5y+', utxos: 7890000, value: 8500000000 }
];

const totalUTXOs = ageData.reduce((sum, d) => sum + d.utxos, 0);
const totalValue = ageData.reduce((sum, d) => sum + d.value, 0);
const avgUTXOValue = totalValue / totalUTXOs;

export default function S29_UTXODistribution() {
  return (
    <div id="section-28">
      <DashboardCard
        id="s29"
        title="UTXO Distribution"
        subtitle="Unspent transaction output analysis"
        icon={Layers}
      >
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="bg-gray-800/40 rounded p-3 border border-gray-700/30 text-center">
              <div className="text-gray-500s uppercase tracking-widest mb-1">Total UTXOs</div>
              <div className="font-mono font-bold text-yellow-50" style={{ fontSize: 'var(--fs-body)' }}>{fmt.compactNum(totalUTXOs)}</div>
            </div>
            <div className="bg-gray-800/40 rounded p-3 border border-gray-700/30 text-center">
              <div className="text-gray-500s uppercase tracking-widest mb-1">Total Value</div>
              <div className="font-mono font-bold text-yellow-50" style={{ fontSize: 'var(--fs-body)' }}>{fmt.compact(totalValue)}</div>
            </div>
            <div className="bg-gray-800/40 rounded p-3 border border-gray-700/30 text-center">
              <div className="text-gray-500s uppercase tracking-widest mb-1">Avg Value</div>
              <div className="font-mono font-bold text-yellow-50" style={{ fontSize: 'var(--fs-body)' }}>${Math.round(avgUTXOValue)}</div>
            </div>
            <UniqueVisitorsCounter compact />
          </div>

          {/* Age Distribution Chart */}
          <div className="space-y-2">
            <div className="text-gray-500s uppercase tracking-widest">Age Distribution</div>
            <div className="h-40 bg-gray-800/20 rounded-lg p-4 border border-gray-700/30">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                  <XAxis
                    dataKey="range"
                    stroke="#555555"
                    style={{ fontSize: '10px' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#555555" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#12121A', border: '1px solid #F7931A' }}
                    formatter={(v) => fmt.compactNum(v)}
                  />
                  <Bar dataKey="utxos" fill="#F7931A" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details */}
          <div className="border-t border-gray-700/30 pt-3">
            <div className="text-gray-500s uppercase tracking-widest mb-2">Breakdown by Age</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {ageData.map((d, i) => (
                <div key={i} className="flex items-center justify-betweens font-mono p-2 bg-gray-800/30 rounded border border-gray-700/20">
                  <div>
                    <span className="text-yellow-400 font-semibold">{d.range}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-50">{fmt.compactNum(d.utxos)}</div>
                    <div className="text-gray-600">{fmt.compact(d.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
