import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatBox({ label, value, change, subtext, className = '' }) {
  const isPositive = change >= 0;

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-lg p-4 hover:border-yellow-500/30 transition ${className}`}>
      <div className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-2">{label}</div>
      <div className="text-2xl font-mono font-bold text-yellow-50 mb-1">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
        </div>
      )}
      {subtext && <div className="text-xs text-gray-500 mt-2">{subtext}</div>}
    </div>
  );
}
