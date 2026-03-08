import { useEffect, useMemo, useState } from 'react';

const S21_DATA_URL = '/api/public/s21/big-mac-sats-data';
const S21_POLL_MS = 300_000;

const PERIODS = [
  { key: '1y', label: '1 Year Ago', subLabel: '1y', unit: 'years', value: 1 },
  { key: '30d', label: '30 Days Ago', subLabel: '30d', unit: 'days', value: 30 },
  { key: '7d', label: '7 Days Ago', subLabel: '7d', unit: 'days', value: 7 },
  { key: '10y', label: '10 Years Ago', subLabel: '10y', unit: 'years', value: 10 },
  { key: '5y', label: '5 Years Ago', subLabel: '5y', unit: 'years', value: 5 },
  { key: '3y', label: '3 Years Ago', subLabel: '3y', unit: 'years', value: 3 },
];

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeHistory(rawHistory) {
  if (!rawHistory || typeof rawHistory !== 'object') return {};

  const allowedKeys = new Set(PERIODS.map((period) => period.key));
  const entries = Object.entries(rawHistory).filter(([key]) => allowedKeys.has(key));

  return Object.fromEntries(
    entries
      .map(([key, value]) => [key, toPositiveNumber(value)])
      .filter(([, value]) => Number.isFinite(value)),
  );
}

async function fetchS21Payload() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(S21_DATA_URL, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    return (json?.data && typeof json.data === 'object') ? json.data : json;
  } finally {
    clearTimeout(timeout);
  }
}

function toSats(bigMacUsd, btcPrice) {
  if (!Number.isFinite(bigMacUsd) || !Number.isFinite(btcPrice) || btcPrice <= 0) return null;
  return Math.floor((bigMacUsd / btcPrice) * 100_000_000);
}

export default function S21_NodeVersions() {
  const [spotBtcPrice, setSpotBtcPrice] = useState(null);
  const [spotBtcChange24h, setSpotBtcChange24h] = useState(null);
  const [baseBtcPrice, setBaseBtcPrice] = useState(null);
  const [bigMacUsd, setBigMacUsd] = useState(null);
  const [historyBtc, setHistoryBtc] = useState({});
  const [historyReady, setHistoryReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const payload = await fetchS21Payload();
        const price = toPositiveNumber(payload?.spot_btc_usd);
        const change24h = toFiniteNumber(payload?.spot_change_24h_pct);
        const bigMacUsdValue = toPositiveNumber(payload?.big_mac_usd);
        const history = sanitizeHistory(payload?.history_btc);

        if (!active) return;

        if (Number.isFinite(price)) {
          setSpotBtcPrice(price);
          setBaseBtcPrice((prev) => (Number.isFinite(prev) ? prev : price));
        }
        if (Number.isFinite(change24h)) {
          setSpotBtcChange24h(change24h);
        }
        if (Number.isFinite(bigMacUsdValue)) {
          setBigMacUsd(bigMacUsdValue);
        }
        if (Object.keys(history).length > 0) {
          setHistoryBtc(history);
        }
        setHistoryReady(true);
      } catch {
        if (active) setHistoryReady(true);
      }
    };

    loadData();
    const timer = setInterval(() => {
      loadData().catch(() => {});
    }, S21_POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const currentSats = useMemo(() => toSats(bigMacUsd, baseBtcPrice), [bigMacUsd, baseBtcPrice]);

  const headerPct = useMemo(() => {
    if (!Number.isFinite(currentSats) || !Number.isFinite(baseBtcPrice) || !Number.isFinite(spotBtcChange24h)) return null;
    const previousBtc = baseBtcPrice / (1 + spotBtcChange24h / 100);
    const prevSats = toSats(bigMacUsd, previousBtc);
    if (!Number.isFinite(prevSats) || prevSats <= 0) return null;
    return ((currentSats - prevSats) / prevSats) * 100;
  }, [baseBtcPrice, spotBtcChange24h, bigMacUsd, currentSats]);

  const cards = useMemo(() => {
    return PERIODS.map((period) => {
      const histBtc = historyBtc[period.key];
      const histSats = toSats(bigMacUsd, histBtc);

      if (!Number.isFinite(currentSats) || !Number.isFinite(histSats) || histSats <= 0) {
        return { ...period, sats: null, pct: null, improved: null };
      }

      const pct = ((currentSats - histSats) / histSats) * 100;
      return {
        ...period,
        sats: histSats,
        pct,
        improved: pct < 0,
      };
    });
  }, [historyBtc, bigMacUsd, currentSats]);

  const topReady = Number.isFinite(currentSats);
  const cardsLoading = !historyReady || !Number.isFinite(currentSats) || !Number.isFinite(bigMacUsd);
  const headerUp = Number.isFinite(headerPct) ? headerPct >= 0 : null;

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#111111] px-4 py-4">
      <div className="w-full max-w-[1120px] flex flex-col items-center">
        <div style={{ fontSize: 'var(--fs-hero)', lineHeight: 1, marginBottom: '0.35rem' }}>🍔</div>

        {Number.isFinite(spotBtcPrice) ? (
          <div
            style={{
              color: '#8a8a8a',
              fontFamily: 'monospace',
              fontSize: 'var(--fs-caption)',
              marginBottom: '0.8rem',
            }}
          >
            BTC/USD {Math.round(spotBtcPrice).toLocaleString('en-US')}
          </div>
        ) : (
          <div className="skeleton" style={{ width: 220, height: '0.9em', marginBottom: '0.8rem' }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {topReady ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#00D897',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: 'var(--fs-hero)',
                  fontWeight: 700,
                }}
              >
                {currentSats.toLocaleString('en-US')} sats
              </span>
              <span
                style={{
                  color: headerUp == null ? '#888' : (headerUp ? '#00D897' : '#FF4757'),
                  fontFamily: 'monospace',
                  fontSize: 'var(--fs-subtitle)',
                  fontWeight: 600,
                }}
              >
                {headerPct != null ? `${headerPct.toFixed(2)}% ${headerUp ? '▲' : '▼'}` : 'N/A'}
              </span>
            </>
          ) : (
            <>
              <div className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 280, height: '1.2em' }} />
              <div className="skeleton" style={{ width: 120, height: '1em' }} />
            </>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            width: '100%',
            maxWidth: 1060,
            padding: '0 1rem',
          }}
        >
          {(cardsLoading ? PERIODS.map((p) => ({ ...p, loading: true })) : cards).map((card) => {
            if (card.loading) {
              return (
                <div
                  key={card.key}
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    padding: '1rem 1.2rem',
                    minHeight: 118,
                  }}
                >
                  <div className="skeleton" style={{ width: 100, height: '0.9em', marginBottom: 12 }} />
                  <div className="skeleton" style={{ width: 180, height: '1.2em', marginBottom: 10 }} />
                  <div className="skeleton" style={{ width: 90, height: '0.9em' }} />
                </div>
              );
            }

            return (
              <div
                key={card.key}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 10,
                  padding: '1rem 1.2rem',
                  minHeight: 118,
                }}
              >
                <div
                  style={{
                    color: '#888',
                    fontFamily: 'monospace',
                    fontSize: 'var(--fs-caption)',
                    marginBottom: 6,
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    color: '#cccccc',
                    fontFamily: 'monospace',
                    fontSize: 'var(--fs-section)',
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {card.sats != null ? `${card.sats.toLocaleString('en-US')} sats` : 'N/A'}
                </div>
                <div
                  style={{
                    color: card.improved == null ? '#888' : (card.improved ? '#00D897' : '#FF4757'),
                    fontFamily: 'monospace',
                    fontSize: 'var(--fs-caption)',
                    fontWeight: 600,
                  }}
                >
                  {card.pct != null ? `${Math.abs(card.pct).toFixed(2)}% ${card.improved ? '▲' : '▼'}` : 'N/A'}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            color: '#F7931A',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-section)',
            fontWeight: 700,
            marginTop: '1.5rem',
            letterSpacing: '0.02em',
          }}
        >
          Big Mac Sats Tracker
        </div>

        <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 'var(--fs-tag)', color: '#5f5f5f' }}>
          <span style={{ color: '#4a4a4a', marginRight: '0.6rem' }}>Annual index</span>
          CSV source:{' '}
          <a
            href="https://github.com/TheEconomist/big-mac-data"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#6f6f6f', textDecoration: 'underline', textDecorationColor: '#444' }}
          >
            The Economist
          </a>
        </div>
      </div>
    </div>
  );
}
