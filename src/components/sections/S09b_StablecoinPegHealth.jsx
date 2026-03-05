import { useCallback, useEffect, useRef, useState } from 'react';

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
  on_peg:  { label: 'ON PEG',  color: '#00D897', bg: 'rgba(0,216,151,0.12)',  border: 'rgba(0,216,151,0.25)'  },
  warning: { label: 'WARNING', color: '#FFD700', bg: 'rgba(255,215,0,0.12)',   border: 'rgba(255,215,0,0.25)'   },
  off_peg: { label: 'OFF PEG', color: '#FF4757', bg: 'rgba(255,71,87,0.12)',   border: 'rgba(255,71,87,0.25)'   },
};

/* ─── Formatters ────────────────────────────────────────────── */
function fmtBig(n) {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtSupply(v) {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString()}`;
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function circUSD(coin) {
  return coin.circulating?.peggedUSD ?? Object.values(coin.circulating ?? {})[0] ?? 0;
}

function prevCircUSD(coin) {
  return coin.circulatingPrevDay?.peggedUSD
    ?? Object.values(coin.circulatingPrevDay ?? {})[0]
    ?? null;
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
            <span style={{ fontFamily: 'monospace', fontSize: 9, fontWeight: 700, color, lineHeight: 1 }}>
              {fmtSupply(hover.value)}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
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
//   1. jsDelivr CDN (spothq/cryptocurrency-icons) — vector SVG, infinite resolution
//   2. llamao.fi — PNG at 4× (crisp on retina)
//   3. Text initials fallback
function CoinLogo({ coinName, symbol, size = 36 }) {
  const [srcIdx, setSrcIdx] = useState(0);
  const sym  = symbol?.toLowerCase() ?? '';
  const slug = coinName?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') ?? '';

  const sources = [
    sym  ? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${sym}.svg` : null,
    slug ? `https://icons.llamao.fi/icons/pegged/${slug}?w=${size * 4}&h=${size * 4}` : null,
  ].filter(Boolean);

  // Text-initials fallback
  if (srcIdx >= sources.length) {
    return (
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center font-mono font-bold"
        style={{ width: size, height: size, background: '#1e1e1e', color: '#F7931A', fontSize: size * 0.33 }}
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

  const status = getStatus(coin.price);
  const cfg    = STATUS[status];
  const dev    = Math.abs((coin.price ?? 1) - 1);
  const mcap   = circUSD(coin);
  const prev   = prevCircUSD(coin);
  const delta  = prev !== null ? mcap - prev : null;

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
        {/* Row 1: logo + name + deviation % */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CoinLogo coinName={coin.name} symbol={coin.symbol} size={36} />
            <div className="min-w-0">
              <div className="font-mono font-bold text-white leading-tight" style={{ fontSize: 'var(--fs-heading)' }}>
                {coin.symbol}
              </div>
              <div className="font-mono text-white/40 truncate leading-tight mt-0.5" style={{ fontSize: 'var(--fs-micro)' }}>
                {coin.name}
              </div>
            </div>
          </div>
          <span
            className="flex-shrink-0 font-mono font-bold tabular-nums"
            style={{ fontSize: 'var(--fs-caption)', color: cfg.color }}
          >
            ±{dev < 1e-6 ? '0.000' : (dev * 100).toFixed(3)}%
          </span>
        </div>

        {/* Row 2: price — prominent, like main stat value in other modules */}
        <div>
          <span
            className="font-mono font-bold text-white tabular-nums leading-none"
            style={{ fontSize: 'var(--fs-section)' }}
          >
            ${(coin.price ?? 1).toFixed(4)}
          </span>
        </div>

        {/* Row 3: interactive sparkline */}
        <div style={{ marginLeft: -4, marginRight: -4, flex: 1 }}>
          <MiniSparkline data={spark} color={cfg.color} id={coin.id} />
        </div>

        {/* Row 4: MCap + 24h delta */}
        <div
          className="flex justify-between items-end pt-2 mt-auto"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div>
            <div className="font-mono text-white/25 uppercase tracking-widest mb-1" style={{ fontSize: 'var(--fs-micro)' }}>
              Market Cap
            </div>
            <div className="font-mono font-bold text-white/70 tabular-nums" style={{ fontSize: 'var(--fs-caption)' }}>
              {fmtBig(mcap)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-white/25 uppercase tracking-widest mb-1" style={{ fontSize: 'var(--fs-micro)' }}>
              24h Supply Δ
            </div>
            <div
              className="font-mono font-bold tabular-nums"
              style={{
                fontSize: 'var(--fs-caption)',
                color: delta === null || delta === 0
                  ? 'rgba(255,255,255,0.3)'
                  : delta > 0 ? '#00D897' : '#FF4757',
              }}
            >
              {delta === null
                ? '—'
                : delta === 0
                  ? '±$0'
                  : `${delta > 0 ? '+' : ''}${fmtBig(Math.abs(delta))}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────── */
const REFRESH_MS = 60_000;

export default function S09b_StablecoinPegHealth() {
  const [coins,   setCoins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const sparkCache = useRef({});

  /* ── Fetch + filter to whitelist ── */
  const load = useCallback(async () => {
    try {
      const r = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true');
      const d = await r.json();
      // Keep only the largest-mcap coin per whitelisted symbol
      const bySymbol = {};
      for (const c of (d.peggedAssets ?? [])) {
        if (!WHITELIST.includes(c.symbol) || c.price == null || c.price <= 0) continue;
        const mcap = c.circulating?.peggedUSD ?? Object.values(c.circulating ?? {})[0] ?? 0;
        if (!bySymbol[c.symbol] || mcap > (bySymbol[c.symbol]._mcap ?? 0)) {
          bySymbol[c.symbol] = { ...c, _mcap: mcap };
        }
      }
      const filtered = WHITELIST.map(sym => bySymbol[sym]).filter(Boolean);
      setCoins(filtered);
    } catch { /* keep previous */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  /* ── Lazy sparkline fetch — stores { date, value }[] ── */
  const onVisible = useCallback(async (id, cb) => {
    if (sparkCache.current[id]) { cb(sparkCache.current[id]); return; }
    try {
      const r = await fetch(`https://stablecoins.llama.fi/stablecoin/${id}`);
      const d = await r.json();
      // tokens[].circulating.peggedUSD = historical circulating supply (real on-chain data)
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
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 pb-2 flex flex-col">
        {loading ? (
          <div className="grid gap-4 flex-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div
              className="grid gap-4 flex-1"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' }}
            >
              {coins.map((coin, i) => (
                <CoinCard
                  key={coin.id}
                  coin={coin}
                  idx={i}
                  sparkCache={sparkCache}
                  onVisible={onVisible}
                />
              ))}
            </div>
            {/* Refresh cadence hint — intentionally very dim */}
            <div style={{ textAlign: 'right', paddingTop: 4, paddingRight: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.1)', fontFamily: 'monospace' }}>
                ↻ 60s
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
