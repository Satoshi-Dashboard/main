import { useState, useEffect } from 'react';

const HISTORY_LABELS = {
  '7d': '7 Days Ago',
  '30d': '30 Days Ago',
  '1y': '1 Year Ago',
  '3y': '3 Years Ago',
  '5y': '5 Years Ago',
  '10y': '10 Years Ago',
};

const HISTORY_ORDER = ['1y', '30d', '7d', '10y', '5y', '3y'];

function toSats(usd, btcPrice) {
  return Number.isFinite(usd) && Number.isFinite(btcPrice) && btcPrice > 0
    ? Math.round((usd / btcPrice) * 1e8)
    : null;
}

export default function S19_BigMacIndex() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/s21/big-mac-sats-data')
      .then((r) => r.json())
      .then((payload) => setData(payload?.data ?? payload))
      .catch(() => setError(true));
  }, []);

  const btcPrice = data?.spot_btc_usd ?? null;
  const bigMacUsd = data?.big_mac_usd ?? null;
  const currentSats = toSats(bigMacUsd, btcPrice);

  // Derive prior-day sats from the 24h BTC spot change (Big Mac price is ~fixed intraday).
  const changePct = data?.spot_change_24h_pct;
  const prevBtcPrice = Number.isFinite(btcPrice) && Number.isFinite(changePct)
    ? btcPrice / (1 + changePct / 100)
    : null;
  const prevSats = toSats(bigMacUsd, prevBtcPrice);
  const pct = currentSats && prevSats ? ((currentSats - prevSats) / prevSats * 100) : null;
  const up = pct !== null && pct >= 0;

  const history = HISTORY_ORDER
    .map((key) => {
      const histBtcPrice = data?.history_btc?.[key];
      const hSats = toSats(bigMacUsd, histBtcPrice);
      return hSats ? { key, label: HISTORY_LABELS[key], sats: hSats } : null;
    })
    .filter(Boolean);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#111111] py-6">
      {/* Item emoji + label */}
      <div style={{ fontSize: 'var(--fs-hero)', lineHeight: 1, marginBottom: '0.25rem' }}>
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
          {currentSats ? currentSats.toLocaleString() + ' sats' : (error ? '—' : '…')}
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
        {error && (
          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 'var(--fs-caption)', gridColumn: '1/-1' }}>
            Failed to load data
          </div>
        )}
        {!error && history.length === 0 && (
          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 'var(--fs-caption)', gridColumn: '1/-1' }}>
            Loading…
          </div>
        )}
        {history.map((h) => {
          if (!currentSats) return null;
          const diff = currentSats - h.sats;
          const diffPct = (diff / h.sats * 100);
          const improved = diff < 0; // fewer sats needed = cheaper in BTC terms = BTC appreciated

          return (
            <div key={h.key} style={{
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
                {h.sats.toLocaleString()} sats
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
    </div>
  );
}
