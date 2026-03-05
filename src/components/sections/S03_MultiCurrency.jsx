import { Globe } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { getChangeClass } from '../../utils/formatters';
import { mockMultiCurrency } from '../../data/mockData';

export default function S03_MultiCurrency() {
  const md = () => `## BTC Multi-Currency Board\n| Currency | Price | 24h Change |\n|----------|-------|------------|\n${
    mockMultiCurrency.map(c => `| ${c.flag} ${c.code} | ${c.code === 'SATS' ? '1 sat' : c.price.toLocaleString()} | ${c.change >= 0 ? '+' : ''}${c.change}% |`).join('\n')
  }\n\n*Satoshi Dashboard*`;

  return (
    <DashboardCard id="s03" title="Multi-Currency Board" subtitle="BTC price in 13 currencies" icon={Globe} markdownFn={md} exportData={mockMultiCurrency}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {mockMultiCurrency.map((c) => (
          <div key={c.code} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">{c.flag}</span>
              <div>
                <div className="text-[10px] font-bold text-[var(--text-secondary)]">{c.code}</div>
                <div className="text-[9px] text-[var(--text-tertiary)] hidden sm:block">{c.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold tabular-nums text-[var(--text-primary)]">
                {c.code === 'SATS' ? '1 sat' : c.price >= 1e6
                  ? `${(c.price / 1e6).toFixed(2)}M`
                  : c.price.toLocaleString()}
              </div>
              {c.change !== 0 && (
                <div className={`text-[9px] font-semibold ${getChangeClass(c.change)}`}>
                  {c.change >= 0 ? '+' : ''}{c.change}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
