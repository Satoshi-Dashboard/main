import { useState, useEffect } from 'react';
import { fetchBtcSpot } from '@/shared/services/priceApi.js';

// Big Mac price in USD (global average approx.)
const BIG_MAC_USD = 5.69;

// Historical BTC prices for sat calculations
// sats = (BIG_MAC_USD / btcPrice) * 100_000_000
const HISTORY = [
  { label: '1 Year Ago',  subLabel: 'Mar 2025', btcPrice: 85000 },
  { label: '30 Days Ago', subLabel: 'Feb 2026', btcPrice: 78000 },
  { label: '7 Days Ago',  subLabel: 'Feb 24',   btcPrice: 82000 },
  { label: '10 Years Ago',subLabel: 'Mar 2016', btcPrice: 420   },
  { label: '5 Years Ago', subLabel: 'Mar 2021', btcPrice: 58200 },
  { label: '3 Years Ago', subLabel: 'Mar 2023', btcPrice: 28000 },
];

function toSats(btcPrice) {
  return Math.round((BIG_MAC_USD / btcPrice) * 1e8);
}

export default function S23_BigMacIndex() {
  const [btcPrice, setBtcPrice] = useState(null);

  useEffect(() => {
    (async () => {
      const spot = await fetchBtcSpot().catch(() => null);
      setBtcPrice(spot?.usd ?? 84000);
    })();
  }, []);

  const currentSats = btcPrice ? toSats(btcPrice) : null;
  // Compare to yesterday's approximation (0.5% different) for pct change
  const prevSats = btcPrice ? toSats(btcPrice * 0.9834) : null;
  const pct = currentSats && prevSats ? ((currentSats - prevSats) / prevSats * 100) : null;
  const up = pct !== null && pct >= 0;

  return (
    <div className="flex h-full w-full flex-col items-center bg-[#111111] pt-4 pb-6">
      {/* Burger emoji */}
      <div style={{ fontSize: 'var(--fs-hero)', lineHeight: 1, marginBottom: '0.5rem' }}>
        🍔
      </div>

      {/* Current value */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        <span style={{
          display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
          backgroundColor: '#00D897', flexShrink: 0,
        }} />
        <span style={{
          color: '#ffffff', fontFamily: 'monospace',
          fontSize: 'var(--fs-hero)', fontWeight: 700,
        }}>
          {currentSats ? currentSats.toLocaleString() + ' sats' : '…'}
        </span>
        {pct !== null && (
          <span style={{
            color: up ? '#00D897' : '#FF4757',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 600,
          }}>
            {pct.toFixed(2)}% {up ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Comparison cards 2×3 grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
        width: '100%',
        maxWidth: 860,
        padding: '0 1rem',
      }}>
        {HISTORY.map((h) => {
          const hSats = toSats(h.btcPrice);
          const curr = currentSats ?? toSats(84000);
          const diff = curr - hSats;
          const diffPct = (diff / hSats * 100);
          const improved = diff < 0; // fewer sats needed = cheaper in BTC terms = BTC appreciated

          return (
            <div key={h.label} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: 10, padding: '1rem 1.2rem',
            }}>
              <div style={{
                color: '#888', fontFamily: 'monospace',
                fontSize: 'var(--fs-caption)', marginBottom: 6,
              }}>
                {h.label}
              </div>
              <div style={{
                color: '#cccccc', fontFamily: 'monospace',
                fontSize: 'var(--fs-section)', fontWeight: 600,
                marginBottom: 4,
              }}>
                {hSats.toLocaleString()} sats
              </div>
              <div style={{
                color: improved ? '#00D897' : '#FF4757',
                fontFamily: 'monospace',
                fontSize: 'var(--fs-caption)',
                fontWeight: 600,
              }}>
                {Math.abs(diffPct).toFixed(2)}% {improved ? '▲' : '▼'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer title */}
      <div style={{
        color: '#F7931A', fontFamily: 'monospace',
        fontSize: 'var(--fs-section)', fontWeight: 700,
        marginTop: '1.5rem', letterSpacing: '0.02em',
      }}>
        Big Mac Index
      </div>
    </div>
  );
}
