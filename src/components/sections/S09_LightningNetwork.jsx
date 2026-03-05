import { useEffect, useState } from 'react';
import { fmt } from '../../utils/formatters';

const FALLBACK = { price: 107640, change: 1.66 };

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
                backgroundColor: si < count ? '#F7931A' : '#222',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function S09_LightningNetwork() {
  const [data, setData] = useState(FALLBACK);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        );
        const json = await res.json();
        if (!active || !json?.bitcoin) return;
        setData({ price: json.bitcoin.usd, change: json.bitcoin.usd_24h_change ?? 0 });
      } catch { /* keep fallback */ }
    })();
    return () => { active = false; };
  }, []);

  const sats = data.price ? Math.round(1e8 / data.price) : FALLBACK.price;
  const isUp = data.change >= 0;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[#111111] px-6 py-6">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-4">
        <div
          className="h-4 w-4 rounded-full"
          style={{
            backgroundColor: isUp ? '#00D897' : '#FF4757',
            boxShadow: isUp ? '0 0 10px #00D897' : '0 0 10px #FF4757',
          }}
        />
        <span
          className="font-mono font-bold text-white tabular-nums"
          style={{ fontSize: 'var(--fs-hero)' }}
        >
          {fmt.num(sats)}
        </span>
        <span
          className={`font-mono font-bold ${isUp ? 'text-[#00D897]' : 'text-red-400'}`}
          style={{ fontSize: 'var(--fs-subtitle)' }}
        >
          {isUp ? '+' : ''}{(data.change ?? 0).toFixed(2)}%&nbsp;{isUp ? '▲' : '▼'}
        </span>
      </div>

      {/* Label */}
      <div
        className="flex-shrink-0 text-center uppercase tracking-[0.25em] text-white/50"
        style={{ fontSize: 'var(--fs-label)' }}
      >
        SATS PER DOLLAR
      </div>

      {/* Dot grid */}
      <div className="min-h-0 flex-1 flex items-center justify-center overflow-hidden">
        <SatGrid sats={sats} />
      </div>

      {/* Sub-info */}
      <div className="flex-shrink-0 font-monos text-white/25">
        1 BTC = 100,000,000 sats &nbsp;·&nbsp; 1 USD = {fmt.num(sats)} sats
      </div>
    </div>
  );
}
