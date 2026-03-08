import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchJson } from '../../lib/api.js';

/* ─── Whitelist: 6 most recognized USD stablecoins ─────────── */
const WHITELIST = ['USDT', 'USDC', 'DAI', 'FDUSD', 'PYUSD', 'USDS'];

/* ─── Peg thresholds & status ──────────────────────────────── */
function getStatus(price) {
  const d = Math.abs((price ?? 1) - 1);
  if (d <= 0.001) return 'on_peg';
  if (d <= 0.005) return 'warning';
  return 'off_peg';
}

const STATUS = {
  on_peg: { label: 'ON PEG', color: 'var(--accent-green)', bg: 'rgba(0,216,151,0.12)', border: 'rgba(0,216,151,0.25)' },
  warning: { label: 'WARNING', color: 'var(--accent-warning)', bg: 'rgba(255,215,0,0.12)', border: 'rgba(255,215,0,0.25)' },
  off_peg: { label: 'OFF PEG', color: 'var(--accent-red)', bg: 'rgba(255,71,87,0.12)', border: 'rgba(255,71,87,0.25)' },
};

/* ─── Formatters ────────────────────────────────────────────── */
function fmtUsd(v, digits = 4) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `$${n.toFixed(digits)}`;
}

function fmtUsdCompact(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtSupply(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return Math.round(n).toLocaleString();
}

function fmtPct(v, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`;
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateTime(value) {
  if (!value) return '—';
  const dt = new Date(value);
  if (!Number.isFinite(dt.getTime())) return '—';
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pctColor(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return 'rgba(255,255,255,0.62)';
  return n > 0 ? 'var(--accent-green)' : 'var(--accent-red)';
}

function supplyProgress(coin) {
  const circ = Number(coin.circulating_supply);
  const max = Number(coin.total_supply || coin.max_supply);
  if (!Number.isFinite(circ) || !Number.isFinite(max) || max <= 0) {
    return null;
  }
  return Math.max(0, Math.min(1, circ / max));
}

function supplyDeltaColor(delta) {
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return 'rgba(255,255,255,0.5)';
  return n > 0 ? 'var(--accent-green)' : 'var(--accent-red)';
}

function marketCapDeltaUsd(coin) {
  const mcap = Number(coin.market_cap);
  const prev = Number(coin.circulatingPrevDay?.peggedUSD);
  if (!Number.isFinite(mcap) || !Number.isFinite(prev)) return null;
  return mcap - prev;
}

function fmtRange(low, high) {
  const l = Number(low);
  const h = Number(high);
  if (!Number.isFinite(l) || !Number.isFinite(h)) return '—';
  return `${fmtUsd(l, 4)} - ${fmtUsd(h, 4)}`;
}

function deviationPct(price) {
  const p = Number(price);
  if (!Number.isFinite(p)) return Number.POSITIVE_INFINITY;
  return Math.abs(p - 1) * 100;
}

function coinMcap(coin) {
  const mcap = Number(coin.market_cap);
  if (Number.isFinite(mcap) && mcap > 0) return mcap;
  const fallback = Number(coin.circulating?.peggedUSD);
  return Number.isFinite(fallback) ? fallback : 0;
}

function coinRank(coin) {
  const rank = Number(coin.market_cap_rank);
  return Number.isFinite(rank) ? rank : Number.MAX_SAFE_INTEGER;
}

function sortCoins(items, sortBy) {
  const list = [...items];

  if (sortBy === 'rank') {
    list.sort((a, b) => coinRank(a) - coinRank(b));
    return list;
  }

  if (sortBy === 'peg') {
    list.sort((a, b) => deviationPct(b.live_price ?? b.price) - deviationPct(a.live_price ?? a.price));
    return list;
  }

  if (sortBy === 'change24h') {
    list.sort((a, b) => Math.abs(Number(b.price_change_percentage_24h) || 0) - Math.abs(Number(a.price_change_percentage_24h) || 0));
    return list;
  }

  list.sort((a, b) => coinMcap(b) - coinMcap(a));
  return list;
}

/* ─── Interactive SVG Sparkline ─────────────────────────────── */
// data: { date: number (unix), value: number }[]
// Strategy: SVG only renders area fill + line + crosshair (scales fine with
// preserveAspectRatio="none"). Dot + tooltip are HTML overlays so they're
// always crisp — never distorted by the SVG coordinate transform.
function MiniSparkline({ data, color, id }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null); // { pct, dotY, date, value }

  if (!data) return <div className="skeleton rounded" style={{ height: 58 }} />;
  if (data.length < 2) return <div style={{ height: 58 }} />;

  const W = 200, H = 44;
  const values = data.map(d => d.value);
  const dates  = data.map(d => d.date);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const range  = max - min || 0.00001;

  // pts: SVG coordinate space [0–200] × [0–44]
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - ((v - min) / range) * (H - 10) - 5,
  ]);

  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${W} ${H} L0 ${H}Z`;
  const gid = `sg${id}`;

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // mouseX in SVG coordinate space
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round((mouseX / W) * (data.length - 1))));
    const [px, py] = pts[idx] ?? [];
    if (!Number.isFinite(px) || !Number.isFinite(py)) return;
    // pct: left position as CSS % (accounts for SVG stretching)
    // dotY: top position in px (SVG height === container height, so 1:1)
    setHover({ pct: (px / W) * 100, dotY: py, date: dates[idx], value: values[idx], svgX: px });
  };

  // Tooltip flips side when near the right edge
  const nearRight = hover?.pct > 58;

  return (
    <div style={{ position: 'relative' }}>

      {/* ── SVG: only geometric shapes (not distorted by preserveAspectRatio) ── */}
      <svg
        ref={svgRef}
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ cursor: 'crosshair', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gid})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
        {/* Crosshair stays in SVG — vertical line is not distorted by x-stretch */}
        {hover && (
          <line
            x1={hover.svgX} y1={0} x2={hover.svgX} y2={H}
            stroke={color} strokeWidth="1" strokeOpacity="0.4"
            strokeDasharray="2 2"
          />
        )}
      </svg>

      {/* ── HTML overlay: dot + tooltip — always pixel-perfect ── */}
      {hover && Number.isFinite(hover.dotY) && (
        <>
          {/* Dot positioned by % (X) and px (Y) */}
          <div
            style={{
              position: 'absolute',
              left: `${hover.pct}%`,
              top: hover.dotY,
              transform: 'translate(-50%, -50%)',
              width: 8, height: 8,
              borderRadius: '50%',
              background: color,
              border: '2px solid #0d0d0d',
              boxShadow: `0 0 5px ${color}99`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          {/* Tooltip */}
          <div
            style={{
              position: 'absolute',
              top: 2,
              ...(nearRight
                ? { right: `${100 - hover.pct}%` }
                : { left: `${hover.pct}%` }),
              transform: nearRight ? 'translateX(4px)' : 'translateX(6px)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#191919',
              border: `1px solid ${color}33`,
              borderRadius: 3,
              padding: '2px 6px',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 3,
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color, lineHeight: 1 }}>
              {fmtSupply(hover.value)}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
              {fmtDate(hover.date)}
            </span>
          </div>
        </>
      )}

      {/* ── Temporal range labels ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, paddingLeft: 2, paddingRight: 2 }}>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>
          {fmtDate(dates[0])}
        </span>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>
          14d supply
        </span>
        <span style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>
          {fmtDate(dates[dates.length - 1])}
        </span>
      </div>
    </div>
  );
}

/* ─── Coin logo — SVG → high-res PNG → text initials ────────── */
// Source priority:
//   1. CoinGecko image URL (when available)
//   2. jsDelivr CDN (spothq/cryptocurrency-icons) — vector SVG
//   3. llamao.fi — PNG at 4× (crisp on retina)
//   4. Text initials fallback
function CoinLogo({ coinName, symbol, apiImage, size = 36 }) {
  const [srcIdx, setSrcIdx] = useState(0);
  const sym  = symbol?.toLowerCase() ?? '';
  const slug = coinName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ?? '';

  const sources = [
    apiImage || null,
    sym  ? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${sym}.svg` : null,
    slug ? `https://icons.llamao.fi/icons/pegged/${slug}?w=${size * 4}&h=${size * 4}` : null,
  ].filter(Boolean);

  // Text-initials fallback
  if (srcIdx >= sources.length) {
    return (
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center font-mono font-bold"
        style={{ width: size, height: size, background: '#1e1e1e', color: 'var(--accent-bitcoin)', fontSize: size * 0.33 }}
      >
        {symbol?.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      key={srcIdx}
      src={sources[srcIdx]}
      alt={symbol}
      loading="lazy"
      className="flex-shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, background: '#1e1e1e' }}
      onError={() => setSrcIdx(i => i + 1)}
    />
  );
}

/* ─── Coin card (large, 6-coin layout) ─────────────────────── */
function CoinCard({ coin, idx, sparkCache, onVisible }) {
  const ref = useRef(null);
  const [spark, setSpark] = useState(sparkCache.current[coin.id] ?? null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const currentPrice = Number.isFinite(Number(coin.live_price))
    ? Number(coin.live_price)
    : Number(coin.price ?? 1);

  const status = getStatus(currentPrice);
  const cfg    = STATUS[status];
  const devPct = deviationPct(currentPrice);
  const change24h = Number(coin.price_change_percentage_24h);
  const marketCapDelta = marketCapDeltaUsd(coin);
  const supplyRatio = supplyProgress(coin);

  /* Lazy-load sparkline */
  useEffect(() => {
    if (spark || !ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      onVisible(coin.id, (d) => d && setSpark(d));
    }, { rootMargin: '100px' });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [coin.id, spark, onVisible]);

  return (
    <div
      ref={ref}
      className="flex flex-col bg-[#111111] border border-[#1c1c1c] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors"
      style={{
        animation: 'fadeUp 0.4s ease forwards',
        animationDelay: `${idx * 0.07}s`,
        opacity: 0,
      }}
    >
      {/* Status stripe */}
      <div style={{ height: 3, background: cfg.color, opacity: 0.7 }} />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Row 1: logo + identity + status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CoinLogo coinName={coin.name} symbol={coin.symbol} apiImage={coin.image} size={36} />
            <div className="min-w-0">
              <div className="font-mono font-bold text-white leading-tight" style={{ fontSize: 'var(--fs-heading)' }}>
                {coin.symbol}
              </div>
              <div className="font-mono text-white/40 truncate leading-tight mt-0.5" style={{ fontSize: 'var(--fs-micro)' }}>
                {coin.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="font-mono font-bold tabular-nums"
              style={{ fontSize: 'var(--fs-caption)', color: cfg.color }}
              title="Peg deviation"
            >
              ±{Number.isFinite(devPct) ? devPct.toFixed(3) : '—'}%
            </span>
            <span
              className="rounded px-2 py-1 font-mono"
              style={{
                fontSize: 'var(--fs-micro)',
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
                background: cfg.bg,
              }}
            >
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Row 2: price + 24h change + rank */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div
              className="font-mono font-bold text-white tabular-nums leading-none"
              style={{ fontSize: 'var(--fs-section)' }}
            >
              {fmtUsd(currentPrice, 4)}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 'var(--fs-caption)', color: pctColor(change24h) }}
              >
                24h {fmtPct(change24h, 2)}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.42)' }}
              >
                rank #{Number.isFinite(Number(coin.market_cap_rank)) ? Number(coin.market_cap_rank) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: metric grid — collapsible */}
        <button
          type="button"
          className="w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-left transition-colors hover:border-white/20"
          onClick={() => setMetricsOpen((v) => !v)}
          aria-expanded={metricsOpen}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono uppercase" style={{ fontSize: 'var(--fs-caption)', color: 'rgba(255,255,255,0.74)' }}>
              {metricsOpen ? 'Hide metrics' : 'Show metrics'}
            </span>
            <span className="font-mono" style={{ fontSize: 'var(--fs-caption)', color: 'rgba(255,255,255,0.54)' }}>
              {metricsOpen ? '−' : '+'}
            </span>
          </div>
        </button>

        {metricsOpen && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#141414] p-2">
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>MCap</div>
              <div className="font-mono tabular-nums text-white" style={{ fontSize: 'var(--fs-caption)' }}>{fmtUsdCompact(coin.market_cap)}</div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>Volume 24h</div>
              <div className="font-mono tabular-nums text-white" style={{ fontSize: 'var(--fs-caption)' }}>{fmtUsdCompact(coin.total_volume)}</div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>FDV</div>
              <div className="font-mono tabular-nums text-white" style={{ fontSize: 'var(--fs-caption)' }}>{fmtUsdCompact(coin.fully_diluted_valuation)}</div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>MCap Δ</div>
              <div className="font-mono tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: supplyDeltaColor(marketCapDelta) }}>
                {marketCapDelta === null ? '—' : `${marketCapDelta > 0 ? '+' : ''}${fmtUsdCompact(Math.abs(marketCapDelta))}`}
              </div>
            </div>
          </div>
        )}

        {/* Row 4: circulating/total supply progress */}
        <div className="rounded-lg border border-white/10 bg-[#121212] p-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>
              Circulating / Total
            </span>
            <span className="font-mono tabular-nums text-white/75" style={{ fontSize: 'var(--fs-caption)' }}>
              {fmtSupply(coin.circulating_supply)} / {fmtSupply(coin.total_supply || coin.max_supply)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(((supplyRatio ?? 0) * 100))}%`,
                background: 'var(--accent-bitcoin)',
                opacity: supplyRatio === null ? 0.25 : 0.85,
              }}
            />
          </div>
        </div>

        {/* Row 5: interactive sparkline */}
        <div style={{ marginLeft: -4, marginRight: -4, flex: 1 }}>
          <MiniSparkline data={spark} color={cfg.color} id={coin.id} />
        </div>

        {/* Row 6: interactive advanced details */}
        <button
          type="button"
          className="mt-auto w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-left transition-colors hover:border-white/20"
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono uppercase" style={{ fontSize: 'var(--fs-caption)', color: 'rgba(255,255,255,0.74)' }}>
              {detailsOpen ? 'Hide advanced metrics' : 'Show advanced metrics'}
            </span>
            <span className="font-mono" style={{ fontSize: 'var(--fs-caption)', color: 'rgba(255,255,255,0.54)' }}>
              {detailsOpen ? '-' : '+'}
            </span>
          </div>
        </button>

        {detailsOpen && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-[#101010] p-2">
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>24h Range</div>
              <div className="font-mono tabular-nums text-white/80" style={{ fontSize: 'var(--fs-caption)' }}>{fmtRange(coin.low_24h, coin.high_24h)}</div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>Price Δ 24h</div>
              <div className="font-mono tabular-nums" style={{ fontSize: 'var(--fs-caption)', color: pctColor(coin.price_change_24h) }}>
                {Number.isFinite(Number(coin.price_change_24h)) ? `${Number(coin.price_change_24h) > 0 ? '+' : ''}${fmtUsd(Number(coin.price_change_24h), 4)}` : '—'}
              </div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>ATH</div>
              <div className="font-mono tabular-nums text-white/80" style={{ fontSize: 'var(--fs-caption)' }}>
                {fmtUsd(coin.ath, 4)} ({fmtPct(coin.ath_change_percentage, 1)})
              </div>
              <div className="font-mono text-white/40" style={{ fontSize: 'var(--fs-micro)' }}>{fmtDateTime(coin.ath_date)}</div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>ATL</div>
              <div className="font-mono tabular-nums text-white/80" style={{ fontSize: 'var(--fs-caption)' }}>
                {fmtUsd(coin.atl, 4)} ({fmtPct(coin.atl_change_percentage, 1)})
              </div>
              <div className="font-mono text-white/40" style={{ fontSize: 'var(--fs-micro)' }}>{fmtDateTime(coin.atl_date)}</div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>Gecko ID</div>
              <div className="font-mono text-white/80 truncate" style={{ fontSize: 'var(--fs-caption)' }} title={coin.gecko_id || '—'}>{coin.gecko_id || '—'}</div>
            </div>
            <div>
              <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.34)' }}>Updated</div>
              <div className="font-mono text-white/80" style={{ fontSize: 'var(--fs-caption)' }}>{fmtDateTime(coin.last_updated || coin.live_updated_at)}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────── */
const LIST_REFRESH_MS = 120_000;
const LIVE_PEG_REFRESH_MS = 120_000;

export default function S09b_StablecoinPegHealth() {
  const [coins,   setCoins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [nextUpdateAt, setNextUpdateAt] = useState(null);
  const [listSource, setListSource] = useState('coingecko');
  const [livePricesBySymbol, setLivePricesBySymbol] = useState({});
  const [liveUpdatedAt, setLiveUpdatedAt] = useState(null);
  const sparkCache = useRef({});

  /* ── Fetch + filter to whitelist ── */
  const load = useCallback(async () => {
    try {
      const payload = await fetchJson('/api/s08/stablecoins');
      const d = payload?.data && Array.isArray(payload.data.peggedAssets)
        ? payload.data
        : payload;

      // Keep only the largest-mcap coin per whitelisted symbol
      const bySymbol = {};
      for (const c of (d.peggedAssets ?? [])) {
        if (!WHITELIST.includes(c.symbol) || c.price == null || c.price <= 0) continue;
        const mcap = c.circulating?.peggedUSD ?? Object.values(c.circulating ?? {})[0] ?? 0;
        const normalizedCoin = {
          ...c,
          source_provider: c.source_provider || payload?.source_provider || 'coingecko',
        };
        if (!bySymbol[c.symbol] || mcap > (bySymbol[c.symbol]._mcap ?? 0)) {
          bySymbol[c.symbol] = { ...normalizedCoin, _mcap: mcap };
        }
      }
      const filtered = WHITELIST.map(sym => bySymbol[sym]).filter(Boolean);
      setCoins(filtered);
      setLastUpdatedAt(payload?.updated_at || new Date().toISOString());
      setNextUpdateAt(payload?.next_update_at || null);
      setListSource(payload?.source_provider || 'coingecko');
      setError(filtered.length ? null : 'Stablecoin data is temporarily unavailable.');
    } catch {
      setError('Could not load stablecoin data endpoint.');
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, LIST_REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const loadLivePegPrices = useCallback(async () => {
    try {
      const payload = await fetchJson('/api/s08/stablecoins/live-prices');
      const prices = payload?.prices_by_symbol && typeof payload.prices_by_symbol === 'object'
        ? payload.prices_by_symbol
        : {};
      setLivePricesBySymbol(prices);
      setLiveUpdatedAt(payload?.updated_at || new Date().toISOString());
    } catch {
      /* keep previous live prices */
    }
  }, []);

  useEffect(() => {
    loadLivePegPrices();
    const t = setInterval(loadLivePegPrices, LIVE_PEG_REFRESH_MS);
    return () => clearInterval(t);
  }, [loadLivePegPrices]);

  const coinsWithLivePeg = useMemo(
    () => {
      const merged = coins.map((coin) => {
        const livePrice = Number(livePricesBySymbol?.[coin.symbol]);
        return {
          ...coin,
          live_price: Number.isFinite(livePrice) ? livePrice : null,
          live_updated_at: liveUpdatedAt,
        };
      });

      return sortCoins(merged, 'mcap');
    },
    [coins, livePricesBySymbol, liveUpdatedAt],
  );

  const summary = useMemo(() => {
    const totalMcap = coinsWithLivePeg.reduce((acc, coin) => acc + coinMcap(coin), 0);
    const warningCount = coinsWithLivePeg.filter((coin) => getStatus(coin.live_price ?? coin.price) === 'warning').length;
    const offPegCount = coinsWithLivePeg.filter((coin) => getStatus(coin.live_price ?? coin.price) === 'off_peg').length;
    const avgDev = coinsWithLivePeg.length
      ? coinsWithLivePeg.reduce((acc, coin) => acc + deviationPct(coin.live_price ?? coin.price), 0) / coinsWithLivePeg.length
      : 0;

    return { totalMcap, warningCount, offPegCount, avgDev };
  }, [coinsWithLivePeg]);

  /* ── Lazy sparkline fetch — stores { date, value }[] ── */
  const onVisible = useCallback(async (id, cb) => {
    if (sparkCache.current[id]) { cb(sparkCache.current[id]); return; }
    try {
      const payload = await fetchJson(`/api/s08/stablecoin/${id}`);
      const d = payload?.data && typeof payload.data === 'object'
        ? payload.data
        : payload;
      // tokens[].circulating.peggedUSD = normalized 14d historical series from backend
      const data = (d.tokens ?? []).slice(-14)
        .map(t => {
          const value = t.circulating?.peggedUSD ?? Object.values(t.circulating ?? {})[0] ?? null;
          return (value !== null && value > 0) ? { date: t.date, value } : null;
        })
        .filter(Boolean);
      sparkCache.current[id] = data.length ? data : null;
      cb(sparkCache.current[id]);
    } catch { cb(null); }
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-[#0d0d0d] overflow-hidden select-none font-mono">

      {/* ── Cards grid ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-2 pt-3 sm:px-5 sm:pt-4">
        {loading ? (
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" />
            ))}
          </div>
        ) : (
          <>
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-[#121212] px-3 py-2">
                  <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)' }}>Total Stablecoin MCap</div>
                  <div className="font-mono text-white tabular-nums" style={{ fontSize: 'var(--fs-heading)' }}>{fmtUsdCompact(summary.totalMcap)}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#121212] px-3 py-2">
                  <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)' }}>Warning Count</div>
                  <div className="font-mono tabular-nums" style={{ fontSize: 'var(--fs-heading)', color: summary.warningCount > 0 ? 'var(--accent-warning)' : 'var(--text-secondary)' }}>
                    {summary.warningCount}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#121212] px-3 py-2">
                  <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)' }}>Off Peg Count</div>
                  <div className="font-mono tabular-nums" style={{ fontSize: 'var(--fs-heading)', color: summary.offPegCount > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                    {summary.offPegCount}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#121212] px-3 py-2">
                  <div className="font-mono uppercase" style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)' }}>Avg Peg Deviation</div>
                  <div className="font-mono tabular-nums text-white" style={{ fontSize: 'var(--fs-heading)' }}>
                    ±{Number.isFinite(summary.avgDev) ? summary.avgDev.toFixed(3) : '—'}%
                  </div>
              </div>
            </div>

            {coinsWithLivePeg.length > 0 ? (
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {coinsWithLivePeg.map((coin, i) => (
                  <CoinCard
                    key={coin.id}
                    coin={coin}
                    idx={i}
                    sparkCache={sparkCache}
                    onVisible={onVisible}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="rounded border border-white/10 bg-[#121212] px-4 py-3 text-center font-mono text-[12px] text-white/60">
                  {error || 'No stablecoin data available.'}
                </div>
              </div>
            )}
            {/* Refresh cadence hint — intentionally very dim */}
            <div style={{ textAlign: 'right', paddingTop: 4, paddingRight: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                src {listSource} · ↻ list 2min · peg 2min
                {liveUpdatedAt
                  ? ` · live ${new Date(liveUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : (lastUpdatedAt
                    ? ` · last ${new Date(lastUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                    : '')}
                {nextUpdateAt
                  ? ` · next ${new Date(nextUpdateAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : ''}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
