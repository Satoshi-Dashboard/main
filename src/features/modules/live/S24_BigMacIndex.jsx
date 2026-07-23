import { useState, useEffect } from 'react';

export default function S24_BigMacIndex() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/s24/big-mac-sats')
      .then((r) => r.json())
      .then((payload) => payload?.data ? setData(payload.data) : setData(payload))
      .catch(() => setError(true));
  }, []);

  const current = data?.current;
  const comparisons = Array.isArray(data?.comparisons) ? data.comparisons : [];
  const change = current?.change24hPct;
  const up = change !== null && change >= 0;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#111111] py-6">
      <div style={{ fontSize: 'var(--fs-hero)', lineHeight: 1, marginBottom: '0.5rem' }}>
        🍔
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span style={{
          display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
          backgroundColor: '#00D897', flexShrink: 0,
        }} />
        <span style={{
          color: '#ffffff', fontFamily: 'monospace',
          fontSize: 'var(--fs-hero)', fontWeight: 700,
        }}>
          {current?.sats ? current.sats.toLocaleString() + ' sats' : '…'}
        </span>
        {change !== null && change !== undefined && (
          <span style={{
            color: up ? '#00D897' : '#FF4757',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 600,
          }}>
            {Math.abs(change).toFixed(2)}% {up ? '▲' : '▼'}
          </span>
        )}
      </div>

      {current?.bigMacUsd && (
        <div style={{
          color: '#888', fontFamily: 'monospace',
          fontSize: 'var(--fs-caption)', marginBottom: '1rem',
        }}>
          Big Mac USA: ${current.bigMacUsd.toFixed(2)} · as of {current.date}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        width: '100%',
        maxWidth: 900,
        padding: '0 1rem',
      }}>
        {error && (
          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 'var(--fs-caption)', gridColumn: '1/-1' }}>
            Failed to load data
          </div>
        )}
        {!error && comparisons.length === 0 && (
          <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 'var(--fs-caption)', gridColumn: '1/-1' }}>
            Loading…
          </div>
        )}
        {comparisons.map((c) => {
          const currSats = current?.sats ?? 0;
          const diffPct = c.sats ? ((currSats - c.sats) / c.sats) * 100 : null;
          const btcUp = diffPct !== null && diffPct < 0;

          return (
            <div key={c.label} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: 10, padding: '1rem 1.2rem',
            }}>
              <div style={{
                color: '#888', fontFamily: 'monospace',
                fontSize: 'var(--fs-caption)', marginBottom: 6,
              }}>
                {c.label}
              </div>
              <div style={{
                color: '#cccccc', fontFamily: 'monospace',
                fontSize: 'var(--fs-section)', fontWeight: 600,
                marginBottom: 4,
              }}>
                {c.sats != null ? c.sats.toLocaleString() + ' sats' : '—'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                {diffPct !== null && (
                  <div style={{
                    color: btcUp ? '#00D897' : '#FF4757',
                    fontFamily: 'monospace',
                    fontSize: 'var(--fs-caption)',
                    fontWeight: 600,
                  }}>
                    {Math.abs(diffPct).toFixed(2)}% {btcUp ? '▲' : '▼'}
                  </div>
                )}
                {c.btcUsd != null && (
                  <div style={{ color: '#555', fontFamily: 'monospace', fontSize: 'var(--fs-caption)' }}>
                    ${c.btcUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
