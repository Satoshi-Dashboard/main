import { useEffect, useMemo, useState } from 'react';

const ALT_BTC_URL = 'https://api.alternative.me/v2/ticker/bitcoin/';
const BINANCE_KLINES_URL = 'https://api.binance.com/api/v3/klines';
const BIG_MAC_CSV_URL = 'https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-adjusted-index.csv';
const DAY_MS = 86_400_000;

const PERIODS = [
  { key: '1y', label: '1 Year Ago', subLabel: '1y', unit: 'years', value: 1 },
  { key: '30d', label: '30 Days Ago', subLabel: '30d', unit: 'days', value: 30 },
  { key: '7d', label: '7 Days Ago', subLabel: '7d', unit: 'days', value: 7 },
  { key: '10y', label: '10 Years Ago', subLabel: '10y', unit: 'years', value: 10 },
  { key: '5y', label: '5 Years Ago', subLabel: '5y', unit: 'years', value: 5 },
  { key: '3y', label: '3 Years Ago', subLabel: '3y', unit: 'years', value: 3 },
];

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }

  out.push(current);
  return out;
}

function parseBigMacUsd(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV empty');

  const header = parseCsvLine(lines[0]);
  const isoIdx = header.indexOf('iso_a3');
  const dateIdx = header.indexOf('date');
  const priceIdx = header.indexOf('dollar_price');
  if (isoIdx < 0 || dateIdx < 0 || priceIdx < 0) throw new Error('CSV columns missing');

  let latest = null;
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    if (row[isoIdx] !== 'USA') continue;

    const price = Number(row[priceIdx]);
    const date = new Date(row[dateIdx]);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (!Number.isFinite(date.getTime())) continue;

    if (!latest || date > latest.date) latest = { price, date };
  }

  if (!latest) throw new Error('USA row missing');
  return latest;
}

function getUtcDayStartMs(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getPeriodStartMs(period) {
  const d = new Date();
  if (period.unit === 'days') d.setUTCDate(d.getUTCDate() - period.value);
  else d.setUTCFullYear(d.getUTCFullYear() - period.value);
  return getUtcDayStartMs(d);
}

async function fetchBinanceCloseAt(startTimeMs) {
  const exactParams = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1d',
    startTime: String(startTimeMs),
    endTime: String(startTimeMs + DAY_MS),
    limit: '1',
  });

  const exactResponse = await fetch(`${BINANCE_KLINES_URL}?${exactParams.toString()}`);
  if (!exactResponse.ok) throw new Error(`HTTP ${exactResponse.status}`);

  const exactPayload = await exactResponse.json();
  const exactClose = Number(exactPayload?.[0]?.[4]);
  if (Number.isFinite(exactClose) && exactClose > 0) return exactClose;

  const fallbackParams = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1d',
    startTime: String(startTimeMs),
    limit: '1',
  });

  const fallbackResponse = await fetch(`${BINANCE_KLINES_URL}?${fallbackParams.toString()}`);
  if (!fallbackResponse.ok) throw new Error(`HTTP ${fallbackResponse.status}`);

  const payload = await fallbackResponse.json();
  const close = Number(payload?.[0]?.[4]);
  if (!Number.isFinite(close) || close <= 0) throw new Error('Invalid close');
  return close;
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

    const loadSpot = async () => {
      try {
        const response = await fetch(ALT_BTC_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        const quote = json?.data?.['1']?.quotes?.USD;
        const price = Number(quote?.price);
        const change24h = Number(quote?.percentage_change_24h);

        if (!active) return;
        if (Number.isFinite(price) && price > 0) {
          setSpotBtcPrice(price);
          setBaseBtcPrice((prev) => (Number.isFinite(prev) ? prev : price));
        }
        if (Number.isFinite(change24h)) setSpotBtcChange24h(change24h);
      } catch {
        /* keep previous value */
      }
    };

    loadSpot();
    const timer = setInterval(loadSpot, 300_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadBigMac = async () => {
      try {
        const response = await fetch(BIG_MAC_CSV_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csv = await response.text();
        const latest = parseBigMacUsd(csv);
        if (!active) return;
        setBigMacUsd(latest.price);
      } catch {
        /* keep previous value */
      }
    };

    loadBigMac();
    const timer = setInterval(loadBigMac, DAY_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadHistorical = async () => {
      const jobs = PERIODS.map(async (period) => {
        const startTime = getPeriodStartMs(period);
        const close = await fetchBinanceCloseAt(startTime);
        return { key: period.key, close };
      });

      const settled = await Promise.allSettled(jobs);
      if (!active) return;

      setHistoryBtc((prev) => {
        const next = { ...prev };
        settled.forEach((result) => {
          if (result.status !== 'fulfilled') return;
          next[result.value.key] = result.value.close;
        });
        return next;
      });
      setHistoryReady(true);
    };

    loadHistorical().catch(() => {
      if (active) setHistoryReady(true);
    });

    const timer = setInterval(() => {
      loadHistorical().catch(() => {});
    }, DAY_MS);

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
            BTC/USD {Math.round(spotBtcPrice).toLocaleString('en-US')} (live 5m)
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
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '0.75rem',
            width: '100%',
            maxWidth: 1060,
            padding: '0 1.5rem',
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
          Big Mac BTC Index
        </div>

        <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 'var(--fs-tag)', color: '#5f5f5f' }}>
          datos CSV:{' '}
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
