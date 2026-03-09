import { useState, useEffect } from 'react';
import { fetchJson } from '@/shared/lib/api.js';

// US Median Home Price (Census / NAR approximate) — roughly $420,000
const HOME_USD = 420000;

// Historical BTC prices (approximate close) for comparison
const HISTORY = [
  { label: '10 Years Ago', subLabel: 'Mar 2016', btcPrice: 420 },
  { label: '5 Years Ago',  subLabel: 'Mar 2021', btcPrice: 58200 },
  { label: '3 Years Ago',  subLabel: 'Mar 2023', btcPrice: 28000 },
  { label: '1 Year Ago',   subLabel: 'Mar 2025', btcPrice: 85000 },
  { label: '30 Days Ago',  subLabel: 'Feb 2026', btcPrice: 78000 },
  { label: '7 Days Ago',   subLabel: 'Feb 24',   btcPrice: 82000 },
];

function btcStr(btc) {
  if (btc >= 100)  return btc.toFixed(0);
  if (btc >= 10)   return btc.toFixed(2);
  return btc.toFixed(3);
}

export default function S17_PricePerformance() {
  const [btcPrice, setBtcPrice] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const j = await fetchJson('/api/btc/rates', { timeout: 8000, cache: 'no-store' });
        setBtcPrice(Number(j?.btc_usd));
      } catch {
        setBtcPrice(84000);
      }
    })();
  }, []);

  const currentBtc = btcPrice ? HOME_USD / btcPrice : null;

  return (
    <div className="flex h-full w-full flex-col bg-[#111111] overflow-hidden">
      {/* Title */}
      <div className="flex-none px-8 pt-6 pb-2">
        <h1
          style={{
            color: '#F7931A',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-section)',
            fontWeight: 700,
          }}
        >
          US Median House Price in ₿ BTC
        </h1>
      </div>

      {/* Hero — current BTC cost */}
      <div className="flex-none relative flex items-center justify-center py-4 px-6">
        {/* House silhouette background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: 'polygon(50% 0%, 95% 22%, 95% 100%, 5% 100%, 5% 22%)',
            background: 'linear-gradient(180deg, #1e1200 0%, #1a0e00 100%)',
            opacity: 0.9,
          }}
        />
        {/* Roof ridge line */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '44vw solid transparent',
            borderRight: '44vw solid transparent',
            borderBottom: '6vw solid #2a1800',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 text-center py-6">
          <div
            style={{
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: 'var(--fs-hero)',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {currentBtc !== null ? `₿ ${btcStr(currentBtc)}` : '…'}
          </div>
          <div
            style={{
              color: '#888',
              fontFamily: 'monospace',
              fontSize: 'var(--fs-label)',
              marginTop: '0.4rem',
            }}
          >
            ≈ ${HOME_USD.toLocaleString()} USD
            {btcPrice && (
              <span style={{ color: '#555', marginLeft: '0.6rem' }}>
                @ ${btcPrice.toLocaleString()} / BTC
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Comparison cards */}
      <div className="min-h-0 flex-1 px-6 pb-6">
        <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HISTORY.map((h) => {
            const hBtc = HOME_USD / h.btcPrice;
            const currentVal = currentBtc ?? (HOME_USD / 84000);
            const diff = hBtc - currentVal;
            const diffPct = (diff / hBtc) * 100;
            const cheaper = diff > 0; // BTC amount was higher then = cheaper now

            return (
              <div
                key={h.label}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      color: '#555',
                      fontFamily: 'monospace',
                      fontSize: 'var(--fs-micro)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {h.label}
                  </div>
                  <div
                    style={{
                      color: '#888',
                      fontFamily: 'monospace',
                      fontSize: 'var(--fs-micro)',
                    }}
                  >
                    {h.subLabel}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: 'var(--fs-section)',
                      fontWeight: 700,
                    }}
                  >
                    ₿ {btcStr(hBtc)}
                  </div>
                  <div
                    style={{
                      color: cheaper ? '#00D897' : '#FF4757',
                      fontFamily: 'monospace',
                      fontSize: 'var(--fs-caption)',
                      fontWeight: 600,
                    }}
                  >
                    {cheaper ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}%{' '}
                    <span style={{ color: '#555', fontWeight: 400 }}>
                      {cheaper ? 'more BTC then' : 'less BTC then'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
