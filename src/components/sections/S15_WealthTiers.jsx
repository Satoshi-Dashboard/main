import { Users2 } from 'lucide-react';
import DashboardCard from '../common/DashboardCard';
import { mockWealthTiers } from '../../data/mockData';

const TIER_COLORS = ['#88aaff', '#5577ff', '#3355dd', '#F7931A', '#D4A843', '#00D897', '#FF6B35', '#FF4757', '#FF0022'];

export default function S15_WealthTiers() {
  return (
    <DashboardCard id="s15" title="Bitcoin Wealth Tiers" subtitle="Hodler distribution by BTC amount" icon={Users2} exportData={mockWealthTiers}>
      <div className="flex flex-col gap-2">
        {mockWealthTiers.slice().reverse().map((tier, i) => {
          const color = TIER_COLORS[mockWealthTiers.length - 1 - i];
          return (
            <div key={tier.tier} className="flex items-center gap-3">
              <span className="text-base w-7 text-center">{tier.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-0.5">
                  <div>
                    <span className="font-bold" style={{ color, fontSize: 'var(--fs-tag)' }}>{tier.tier}</span>
                    <span className="text-[var(--text-tertiary)] ml-1.5" style={{ fontSize: 'var(--fs-tag)' }}>{tier.range}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold tabular-nums text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-tag)' }}>{tier.pct}%</span>
                    <span className="text-[var(--text-tertiary)] ml-1" style={{ fontSize: 'var(--fs-tag)' }}>supply</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full" style={{ width: `${tier.pct}%`, background: color }} />
                </div>
              </div>
              <div className="tabular-nums text-[var(--text-tertiary)] w-20 text-right" style={{ fontSize: 'var(--fs-tag)' }}>
                {tier.addresses.toLocaleString()} addr
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
