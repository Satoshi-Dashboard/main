import { useState } from 'react';
import { fetchAddressDistribution } from '@/shared/services/addressDistributionApi.js';
import { formatSourceUtcTimestamp } from '@/shared/utils/formatters.js';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { ModuleShell, ModuleTitle, ModuleSourceFooter } from '@/shared/components/module/index.js';

const MODULE_COLORS = {
  '--bg-main': '#111111',
  '--bg-table': '#161616',
  '--btc-orange': 'var(--accent-bitcoin)',
  '--tier-plankton': '#1A1A1A',
  '--tier-shrimp': '#1F1F1F',
  '--tier-crab': '#242424',
  '--tier-fish': '#2A2A2A',
  '--tier-shark': '#33210F',
  '--tier-whale': '#4A2C12',
  '--tier-humpback': '#6B3A10',
  '--tier-100k': '#8B4A0F',
  '--row-text': 'var(--text-primary)',
  '--row-muted': 'var(--text-secondary)',
  '--border-muted': '#2A2A2A',
};

const TIER_SPECS = [
  {
    name: 'PLANKTON',
    emoji: '🦠',
    range: '< 0.1 BTC',
    bg: 'var(--tier-plankton)',
    sourceRanges: ['0 - 0.00001', '0.00001 - 0.0001', '0.0001 - 0.001', '0.001 - 0.01', '0.01 - 0.1'],
  },
  { name: 'SHRIMP', emoji: '🦐', range: '0.1 – 1', bg: 'var(--tier-shrimp)', sourceRanges: ['0.1 - 1'] },
  { name: 'CRAB', emoji: '🦀', range: '1 – 10', bg: 'var(--tier-crab)', sourceRanges: ['1 - 10'] },
  { name: 'FISH', emoji: '🐟', range: '10 – 100', bg: 'var(--tier-fish)', sourceRanges: ['10 - 100'] },
  { name: 'SHARK', emoji: '🦈', range: '100 – 1,000', bg: 'var(--tier-shark)', sourceRanges: ['100 - 1000'] },
  { name: 'WHALE', emoji: '🐋', range: '1,000 – 10,000', bg: 'var(--tier-whale)', sourceRanges: ['1000 - 10000'] },
  { name: 'HUMPBACK', emoji: '🐋', range: '10,000 – 100,000', bg: 'var(--tier-humpback)', sourceRanges: ['10000 - 100000'] },
  { name: '100K+', emoji: '💰', range: '100,000+', bg: 'var(--tier-100k)', sourceRanges: ['100000 - 1000000'] },
];

const PLACEHOLDER_TIERS = TIER_SPECS.map((tier) => ({
  name: tier.name,
  emoji: tier.emoji,
  range: tier.range,
  bg: tier.bg,
  addresses: null,
  totalBtc: null,
  pct: null,
  cum: null,
}));

const REFRESH_MS = 1_800_000;
const PROVIDERS = [{ name: 'BitInfoCharts', url: 'https://bitinfocharts.com' }];

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function mapDistributionToTiers(distribution) {
  const byRange = new Map(
    distribution.map((row) => [
      String(row?.range || '').replace(/,/g, '').replace(/\s+/g, ' ').trim(),
      row,
    ]),
  );

  const rows = TIER_SPECS.map((tier) => {
    const matched = tier.sourceRanges
      .map((range) => byRange.get(range))
      .filter(Boolean);

    return {
      name: tier.name,
      emoji: tier.emoji,
      range: tier.range,
      bg: tier.bg,
      addresses: matched.reduce((sum, row) => sum + Number(row.addresses || 0), 0),
      totalBtc: round2(matched.reduce((sum, row) => sum + Number(row.totalBTC || 0), 0)),
      pct: round2(matched.reduce((sum, row) => sum + Number(row.btcPercent || 0), 0)),
      cum: 0,
    };
  });

  let running = 100;
  return rows.map((row) => {
    const next = {
      ...row,
      cum: round2(running),
    };
    running -= row.pct;
    return next;
  });
}

function SkeletonText({ width = 96, height = '1em', className = '' }) {
  return <div className={`skeleton inline-block max-w-full rounded ${className}`} style={{ width, height }} />;
}

function formatBtc(value) {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;
}

function UnavailablePanel() {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-lg border border-white/10 px-4 text-center font-mono text-white/60">
      Address distribution is temporarily unavailable.
    </div>
  );
}

export default function S12_AddressDistribution() {
  const [tiers, setTiers] = useState(PLACEHOLDER_TIERS);
  const [meta, setMeta] = useState({ updatedAt: '', updatedAtLocal: '', fetchedAt: '', fetchedAtLocal: '' });

  const { loading, error } = useModuleData(fetchAddressDistribution, {
    refreshMs: REFRESH_MS,
    transform: (payload) => {
      if (!Array.isArray(payload?.distribution)) return null;
      const mapped = mapDistributionToTiers(payload.distribution);
      if (mapped.length) setTiers(mapped);
      if (typeof payload?.updatedAt === 'string' || typeof payload?.fetchedAt === 'string') {
        setMeta({
          updatedAt: payload?.updatedAt || '',
          updatedAtLocal: formatSourceUtcTimestamp(payload?.updatedAt),
          fetchedAt: payload?.fetchedAt || '',
          fetchedAtLocal: formatSourceUtcTimestamp(payload?.fetchedAt),
        });
      }
      return payload;
    },
  });

  const hasLiveTiers = tiers.some((tier) => Number.isFinite(tier.addresses));
  const showUnavailable = Boolean(!loading && !hasLiveTiers && error);

  const sourceFooter = (
    <ModuleSourceFooter
      providers={PROVIDERS}
      refreshLabel="30m"
      sourceSnapshot={meta.updatedAtLocal || undefined}
      sourceSnapshotLabel="Source snapshot"
      lastSync={meta.fetchedAtLocal || undefined}
      lastSyncLabel="Last checked"
    />
  );

  return (
    <ModuleShell bg="var(--bg-main)" style={MODULE_COLORS}>
      <div className="flex-none px-4 pb-3 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <ModuleTitle>Address Distribution</ModuleTitle>
      </div>

      <div className="min-h-0 flex-1 px-3 pb-4 sm:px-6 sm:pb-6">
        {showUnavailable ? (
          <UnavailablePanel />
        ) : (
          <>
            <div className="hidden h-full min-h-0 flex-col lg:flex">
              <div
                className="flex flex-none rounded-t-lg border px-4 py-2 font-bold uppercase tracking-widest"
                style={{
                  borderColor: 'var(--border-muted)',
                  backgroundColor: 'var(--bg-table)',
                  color: 'var(--btc-orange)',
                }}
              >
                <div className="w-12" />
                <div className="flex-1">Address Type</div>
                <div className="w-44 text-right pr-2">BTC Balance</div>
                <div className="w-40 text-right pr-2"># of Addresses</div>
                <div className="w-40 text-right pr-2">Total BTC</div>
                <div className="w-44 text-right pr-2">BTC %</div>
              </div>

              {tiers.map((tier, index) => (
                <div
                  key={tier.name}
                  className="flex flex-1 items-center border-x border-b border-black/20 px-4"
                  style={{
                    backgroundColor: tier.bg,
                    borderColor: 'var(--border-muted)',
                    borderBottomLeftRadius: index === tiers.length - 1 ? 8 : 0,
                    borderBottomRightRadius: index === tiers.length - 1 ? 8 : 0,
                    minHeight: 0,
                  }}
                >
                  <div className="w-12 leading-none">{tier.emoji}</div>
                  <div
                    className="flex-1 font-mono font-bold"
                    style={{ color: 'var(--row-text)', fontSize: 'var(--fs-label)' }}
                  >
                    {tier.name}
                  </div>
                  <div
                    className="w-44 text-right pr-2 font-mono"
                    style={{ color: 'var(--row-text)', fontSize: 'var(--fs-caption)' }}
                  >
                    {tier.range}
                  </div>
                  <div
                    className="w-40 text-right pr-2 font-mono font-bold"
                    style={{ color: 'var(--row-text)', fontSize: 'var(--fs-caption)' }}
                  >
                    {Number.isFinite(tier.addresses) ? tier.addresses.toLocaleString() : <SkeletonText width={104} />}
                  </div>
                  <div
                    className="w-40 text-right pr-2 font-mono"
                    style={{ color: 'var(--row-text)', fontSize: 'var(--fs-caption)' }}
                  >
                    {formatBtc(tier.totalBtc) || <SkeletonText width={96} />}
                  </div>
                  <div
                    className="w-44 text-right pr-2 font-mono font-bold"
                    style={{ color: 'var(--row-text)', fontSize: 'var(--fs-caption)' }}
                  >
                    {Number.isFinite(tier.pct) && Number.isFinite(tier.cum) ? (
                      <>
                        {tier.pct.toFixed(2)}% <span>({tier.cum.toFixed(2)}%)</span>
                      </>
                    ) : (
                      <SkeletonText width={112} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex h-full flex-col gap-2 overflow-y-auto lg:hidden">
              {tiers.map((tier) => (
                <article
                  key={tier.name}
                  className="rounded-lg border px-3 py-2"
                  style={{
                    backgroundColor: tier.bg,
                    borderColor: 'var(--border-muted)',
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{tier.emoji}</span>
                      <span className="font-mono font-bold" style={{ color: 'var(--row-text)', fontSize: 'var(--fs-label)' }}>
                        {tier.name}
                      </span>
                    </div>
                    <span className="font-mono" style={{ color: 'var(--btc-orange)', fontSize: 'var(--fs-caption)' }}>
                      {tier.range}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1 font-mono" style={{ fontSize: 'var(--fs-micro)' }}>
                    <span style={{ color: 'var(--row-muted)' }}>Addresses</span>
                    <span className="text-right" style={{ color: 'var(--row-text)' }}>
                      {Number.isFinite(tier.addresses) ? tier.addresses.toLocaleString() : <SkeletonText width={82} height="0.9em" />}
                    </span>
                    <span style={{ color: 'var(--row-muted)' }}>Total BTC</span>
                    <span className="text-right" style={{ color: 'var(--row-text)' }}>
                      {formatBtc(tier.totalBtc) || <SkeletonText width={74} height="0.9em" />}
                    </span>
                    <span style={{ color: 'var(--row-muted)' }}>Share</span>
                    <span className="text-right" style={{ color: 'var(--row-text)' }}>
                      {Number.isFinite(tier.pct) && Number.isFinite(tier.cum)
                        ? `${tier.pct.toFixed(2)}% (${tier.cum.toFixed(2)}%)`
                        : <SkeletonText width={96} height="0.9em" />}
                    </span>
                  </div>
                </article>
              ))}

              <div className="flex justify-end px-1 pb-4 pt-3">
                {sourceFooter}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="hidden lg:flex flex-none justify-end px-3 pb-6 pt-3 sm:px-4" style={{ paddingBottom: 'max(1.5rem, calc(var(--safe-bottom) + 0.75rem))' }}>
        {sourceFooter}
      </div>
    </ModuleShell>
  );
}
