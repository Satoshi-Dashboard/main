import { useEffect, useState } from 'react';
import { fetchJson } from '../../lib/api.js';

const MODULE_COLORS = {
  '--bg-main': '#0B0B0B',
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

const FALLBACK_TIERS = [
  { name: 'PLANKTON', emoji: '🦠', range: '< 0.1 BTC', bg: 'var(--tier-plankton)', addresses: 50680627, totalBtc: 315444.78, pct: 1.59, cum: 100.00 },
  { name: 'SHRIMP', emoji: '🦐', range: '0.1 – 1', bg: 'var(--tier-shrimp)', addresses: 3479084, totalBtc: 1072660.00, pct: 5.40, cum: 98.41 },
  { name: 'CRAB', emoji: '🦀', range: '1 – 10', bg: 'var(--tier-crab)', addresses: 836399, totalBtc: 2073749.00, pct: 10.43, cum: 93.02 },
  { name: 'FISH', emoji: '🐟', range: '10 – 100', bg: 'var(--tier-fish)', addresses: 133242, totalBtc: 4296739.00, pct: 21.62, cum: 82.58 },
  { name: 'SHARK', emoji: '🦈', range: '100 – 1,000', bg: 'var(--tier-shark)', addresses: 16294, totalBtc: 4720464.00, pct: 23.75, cum: 60.96 },
  { name: 'WHALE', emoji: '🐋', range: '1,000 – 10,000', bg: 'var(--tier-whale)', addresses: 2006, totalBtc: 4514961.00, pct: 22.72, cum: 37.21 },
  { name: 'HUMPBACK', emoji: '🐋', range: '10,000 – 100,000', bg: 'var(--tier-humpback)', addresses: 90, totalBtc: 2226328.00, pct: 11.20, cum: 14.49 },
  { name: '100K+', emoji: '💰', range: '100,000+', bg: 'var(--tier-100k)', addresses: 4, totalBtc: 653463.00, pct: 3.29, cum: 3.29 },
];

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

const REFRESH_MS = 1_800_000;

function formatTopClockTime(utcTimestamp) {
  if (!utcTimestamp) return '';
  const date = new Date(String(utcTimestamp).replace(' UTC', 'Z').replace(' ', 'T'));
  if (!Number.isFinite(date.getTime())) return '';

  const dateStr = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${dateStr}, ${timeStr}`;
}

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

export default function S11_AddressDistribution() {
  const [tiers, setTiers] = useState(FALLBACK_TIERS);
  const [meta, setMeta] = useState({ updatedAt: '', updatedAtLocal: '' });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const payload = await fetchJson('/api/s10/btc-distribution', { timeout: 8000 });
        if (!active || !Array.isArray(payload?.distribution)) return;
        const mapped = mapDistributionToTiers(payload.distribution);
        if (mapped.length) setTiers(mapped);
        if (typeof payload?.updatedAt === 'string') {
          setMeta({
            updatedAt: payload.updatedAt,
            updatedAtLocal: formatTopClockTime(payload.updatedAt),
          });
        }
      } catch {
        /* keep previous values */
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col" style={{ ...MODULE_COLORS, backgroundColor: 'var(--bg-main)' }}>
      <div className="flex-none px-4 pb-3 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <div className="flex items-end justify-between gap-4">
          <h1
            style={{
              color: 'var(--btc-orange)',
              fontFamily: 'monospace',
              fontSize: 'var(--fs-subtitle)',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            Address Distribution
          </h1>
          <div className="text-right font-mono text-[11px] tracking-wide text-[#7c7c7c]">
            <div>
              src:{' '}
              <a href="https://bitinfocharts.com" target="_blank" rel="noreferrer" style={{ color: 'var(--btc-orange)', textDecoration: 'none' }}>
                BitInfoCharts
              </a>
            </div>
            <div>Auto update: 30m</div>
            {meta.updatedAtLocal ? <div>Last: {meta.updatedAtLocal}</div> : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-3 pb-4 sm:px-6 sm:pb-6">
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
                {tier.addresses.toLocaleString()}
              </div>
              <div
                className="w-40 text-right pr-2 font-mono"
                style={{ color: 'var(--row-text)', fontSize: 'var(--fs-caption)' }}
              >
                {tier.totalBtc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div
                className="w-44 text-right pr-2 font-mono font-bold"
                style={{ color: 'var(--row-text)', fontSize: 'var(--fs-caption)' }}
              >
                {tier.pct.toFixed(2)}%{' '}
                <span>({tier.cum.toFixed(2)}%)</span>
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
                <span className="text-right" style={{ color: 'var(--row-text)' }}>{tier.addresses.toLocaleString()}</span>
                <span style={{ color: 'var(--row-muted)' }}>Total BTC</span>
                <span className="text-right" style={{ color: 'var(--row-text)' }}>
                  {tier.totalBtc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ color: 'var(--row-muted)' }}>Share</span>
                <span className="text-right" style={{ color: 'var(--row-text)' }}>
                  {tier.pct.toFixed(2)}% ({tier.cum.toFixed(2)}%)
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
