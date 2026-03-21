import { useState } from 'react';
import { fetchBtcSpot } from '@/shared/services/priceApi.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { UI_COLORS } from '@/shared/constants/colors.js';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { ModuleShell } from '@/shared/components/module/index.js';

function SkeletonSatGrid() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-2 opacity-70">
      {Array.from({ length: 8 }).map((_, gi) => (
        <div key={gi} className="grid grid-cols-10" style={{ gap: '2px' }}>
          {Array.from({ length: 100 }, (_, si) => (
            <div
              key={si}
              className="skeleton"
              style={{
                width: 'clamp(5px, 0.9vw, 11px)',
                height: 'clamp(5px, 0.9vw, 11px)',
                borderRadius: '1px',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Each small square = 1 sat; groups of 100 (10×10) */
function SatGrid({ sats }) {
  const total = Math.min(Math.max(sats, 1), 2100); // cap at 2100 for display
  const fullGroups = Math.floor(total / 100);
  const remainder = total % 100;

  const groups = Array.from({ length: fullGroups }, () => 100);
  if (remainder > 0) groups.push(remainder);

  return (
    <div className="flex flex-wrap items-start justify-center gap-2">
      {groups.map((count, gi) => (
        <div
          key={gi}
          className="grid grid-cols-10"
          style={{ gap: '2px' }}
        >
          {Array.from({ length: 100 }, (_, si) => (
            <div
              key={si}
              style={{
                width: 'clamp(5px, 0.9vw, 11px)',
                height: 'clamp(5px, 0.9vw, 11px)',
                borderRadius: '1px',
                backgroundColor: si < count ? UI_COLORS.brand : '#222',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function S09_LightningNetwork() {
  const [data, setData] = useState({ price: null, change: null });

  useModuleData(fetchBtcSpot, {
    refreshMs: 15_000,
    transform: (spot) => {
      if (spot?.usd) {
        setData((prev) => ({
          price: spot.usd,
          change: Number.isFinite(spot.change24h) ? spot.change24h : prev.change,
        }));
      }
      return spot;
    },
  });

  const hasData = Number.isFinite(data.price) && data.price > 0;
  const sats = hasData ? Math.round(1e8 / data.price) : null;
  const isUp = Number.isFinite(data.change) ? data.change >= 0 : null;

  return (
    <ModuleShell className="items-center justify-center gap-3 px-3 py-4 sm:gap-5 sm:px-6 sm:py-6">
      {/* Header */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-center gap-2 sm:gap-4">
        {hasData ? (
          <>
            <div
              className="h-3 w-3 rounded-full sm:h-4 sm:w-4"
              style={{
                backgroundColor: isUp ? UI_COLORS.positive : UI_COLORS.negative,
                boxShadow: `0 0 10px ${isUp ? UI_COLORS.positive : UI_COLORS.negative}`,
              }}
            />
            <span
              className="inline-flex min-h-[1.2em] items-center font-mono font-bold text-white tabular-nums"
              style={{ fontSize: 'var(--fs-hero)' }}
            >
              <AnimatedMetric value={sats} variant="number" inline />
            </span>
            {Number.isFinite(data.change) ? (
              <span
                className="inline-flex min-h-[1.2em] items-center font-mono font-bold"
                style={{ fontSize: 'var(--fs-subtitle)', color: isUp ? UI_COLORS.positive : UI_COLORS.negative }}
              >
                <AnimatedMetric value={data.change} variant="percent" decimals={2} signed inline color={isUp ? UI_COLORS.positive : UI_COLORS.negative} />&nbsp;{isUp ? '▲' : '▼'}
              </span>
            ) : (
              <div className="skeleton" style={{ width: 96, height: '1em' }} />
            )}
          </>
        ) : (
          <>
            <div className="skeleton rounded-full" style={{ width: 16, height: 16 }} />
            <div className="skeleton" style={{ width: 170, height: '1.2em' }} />
            <div className="skeleton" style={{ width: 96, height: '1em' }} />
          </>
        )}
      </div>

      {/* Label */}
      <div
        className="flex-shrink-0 px-2 text-center uppercase tracking-[0.2em] text-white/50 sm:tracking-[0.25em]"
        style={{ fontSize: 'var(--fs-label)' }}
      >
        SATS PER DOLLAR
      </div>

      {/* Dot grid */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-visible px-1">
        {hasData ? <SatGrid sats={sats} /> : <SkeletonSatGrid />}
      </div>

      {/* Sub-info */}
      <div className="flex-shrink-0 max-w-full px-2 text-center font-mono text-white/25" style={{ fontSize: 'var(--fs-caption)' }}>
        {hasData ? (
          <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
            <span>1 BTC = 100,000,000 sats</span>
            <span aria-hidden="true">·</span>
            <span>1 USD = <AnimatedMetric value={sats} variant="number" inline /> sats</span>
          </span>
        ) : (
          <div className="skeleton" style={{ width: 260, height: '0.9em' }} />
        )}
      </div>
    </ModuleShell>
  );
}
