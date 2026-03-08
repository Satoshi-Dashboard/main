import { useEffect, useState } from 'react';
import { fetchJson } from '../../../lib/api.js';

const REFRESH_MS = 1_800_000;

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  textPrimary: 'var(--text-primary)',
};

// Tiers ordered top (richest/fewest) to bottom (most/poorest)
const TIER_TEMPLATE = [
  { threshold: '> $10M', key: 10000000, color: '#c25200' },
  { threshold: '> $1M', key: 1000000, color: '#cd6618' },
  { threshold: '> $100K', key: 100000, color: '#da7e30' },
  { threshold: '> $10K', key: 10000, color: '#e49448' },
  { threshold: '> $1K', key: 1000, color: '#ecaa62' },
  { threshold: '> $100', key: 100, color: '#f3c280' },
  { threshold: '> $1', key: 1, color: '#f9d8a4' },
];

function buildTiers(payload, prevTiers) {
  const map = new Map(
    (Array.isArray(payload?.richerThan) ? payload.richerThan : [])
      .map((row) => [Number(row?.usdThreshold || 0), Number(row?.addresses || 0)]),
  );

  return TIER_TEMPLATE.map((tier, index) => {
    const fromApi = map.get(tier.key);
    const prev = prevTiers?.[index]?.addresses;

    return {
      ...tier,
      addresses: Number.isFinite(fromApi) ? fromApi : (Number.isFinite(prev) ? prev : null),
    };
  });
}

// SVG layout constants
const VW = 1000;
const VH = 700;
const CX = 500;
const PY_TOP = 40;
const PY_BOT = 590;
const MIN_HW = 55;  // half-width at top
const MAX_HW = 330; // half-width at bottom
const N = TIER_TEMPLATE.length;
const TIER_H = (PY_BOT - PY_TOP) / N;

function hw(y) {
  return MIN_HW + (MAX_HW - MIN_HW) * (y - PY_TOP) / (PY_BOT - PY_TOP);
}

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

export default function S13_WealthPyramid() {
  const [tiers, setTiers] = useState(() => TIER_TEMPLATE.map((tier) => ({ ...tier, addresses: null })));
  const [meta, setMeta] = useState({ updatedAt: '', updatedAtLocal: '' });
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const payload = await fetchJson('/api/s13/addresses-richer', { timeout: 8000 });
        if (!active) return;

        setTiers((prev) => buildTiers(payload, prev));
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

  const isCompact = viewportWidth < 768;
  const maxAddresses = Math.max(...tiers.map((tier) => (Number.isFinite(tier.addresses) ? tier.addresses : 0)), 1);

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* Title */}
      <div className="flex-none px-4 pb-1 pt-4 sm:px-8 sm:pt-6 lg:px-10">
        <div className="flex items-end justify-between gap-4">
          <h1
            style={{
              color: UI_COLORS.brand,
              fontFamily: 'monospace',
              fontSize: 'var(--fs-subtitle)',
              fontWeight: 700,
            }}
          >
            Bitcoin Wealth Distribution
          </h1>
          <div className="text-right font-mono text-[11px] tracking-wide" style={{ color: UI_COLORS.textSecondary }}>
            <div>
              src:{' '}
              <a href="https://bitinfocharts.com" target="_blank" rel="noreferrer" style={{ color: UI_COLORS.brand, textDecoration: 'none' }}>
                BitInfoCharts
              </a>
            </div>
            <div>Auto update: 30m</div>
            {meta.updatedAtLocal ? <div>Last: {meta.updatedAtLocal}</div> : null}
          </div>
        </div>
      </div>

      {isCompact ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3 sm:px-4">
          {tiers.map((tier) => {
            const ratio = Number.isFinite(tier.addresses) ? Math.max(0.06, tier.addresses / maxAddresses) : 0.06;
            return (
              <article key={tier.key} className="rounded border border-white/10 bg-[#151515] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono font-bold" style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}>{tier.threshold}</span>
                  <span className="font-mono text-white/75" style={{ fontSize: 'var(--fs-caption)' }}>
                    {Number.isFinite(tier.addresses) ? tier.addresses.toLocaleString() : '—'} addresses
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded bg-white/10">
                  <div className="h-full rounded" style={{ width: `${Math.min(100, ratio * 100)}%`, background: tier.color }} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="min-h-0 flex-1 items-center justify-center px-4 pb-4 md:flex">
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            style={{ width: '100%', height: '100%', maxHeight: '100%' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {tiers.map((tier, i) => {
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
                  <polygon
                    points={`${xlTop},${yTop} ${xrTop},${yTop} ${xrBot},${yBot} ${xlBot},${yBot}`}
                    fill={tier.color}
                    stroke="#111111"
                    strokeWidth="2"
                  />

                  <line x1={xLC - 2} y1={yCen} x2={xLC - 20} y2={yCen} stroke={UI_COLORS.textTertiary} strokeWidth="1" />
                  <text
                    x={xLC - 26}
                    y={yCen}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill={UI_COLORS.textPrimary}
                    fontSize="13"
                    fontFamily="monospace"
                  >
                    {Number.isFinite(tier.addresses) ? tier.addresses.toLocaleString() : '—'}
                  </text>

                  <line x1={xRC + 2} y1={yCen} x2={xRC + 20} y2={yCen} stroke={UI_COLORS.textTertiary} strokeWidth="1" />
                  <text
                    x={xRC + 26}
                    y={yCen}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fill={UI_COLORS.brand}
                    fontSize="13"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {tier.threshold}
                  </text>
                </g>
              );
            })}

            <text
              x={CX - MAX_HW - 26}
              y={PY_BOT + 36}
              textAnchor="middle"
              fill={UI_COLORS.textTertiary}
              fontSize="11"
              fontFamily="monospace"
            >
              Total number of addresses
            </text>
            <text
              x={CX}
              y={PY_BOT + 36}
              textAnchor="middle"
              fill={UI_COLORS.textSecondary}
              fontSize="11"
              fontFamily="monospace"
            >
              Distribution of Bitcoin addresses by value held
            </text>
            <text
              x={CX + MAX_HW + 26}
              y={PY_BOT + 36}
              textAnchor="middle"
              fill={UI_COLORS.textTertiary}
              fontSize="11"
              fontFamily="monospace"
            >
              USD Value
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
