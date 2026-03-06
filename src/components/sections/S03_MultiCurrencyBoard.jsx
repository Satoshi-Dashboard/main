// World Map Price Explorer — BTC price in all available Frankfurter fiat currencies
// Globe uses Natural Earth 110m GeoJSON for pixel-accurate land shapes
// Fallback to bounding-box mask if network unavailable

import { useEffect, useRef, useState } from 'react';
import { fetchMultiCurrencyBtc } from '../../services/priceApi';

// ─── Currency data ──────────────────────────────────────────────────────────────
const BASE_CURRENCY_META = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Renminbi Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'ILS', name: 'Israeli New Shekel' },
  { code: 'ISK', name: 'Icelandic Krona' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'ZAR', name: 'South African Rand' },
];

const EMPTY_CURRENCIES = BASE_CURRENCY_META.map(m => ({ ...m, price: null, change: null }));

const BAND_CODES = ['JPY', 'INR', 'KRW', 'CNY', 'EUR', 'GBP', 'USD', 'RUB'];
const REFRESH_MS = 60_000;

const UI_COLORS = {
  positive: 'var(--accent-green)',
  negative: 'var(--accent-red)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
};

const currencyDisplayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'currency' })
  : null;

function getCurrencyName(code) {
  if (BASE_CURRENCY_META.find((m) => m.code === code)?.name) {
    return BASE_CURRENCY_META.find((m) => m.code === code).name;
  }
  try {
    const pretty = currencyDisplayNames?.of(code);
    return pretty || code;
  } catch {
    return code;
  }
}

// ─── Land texture from GeoJSON ─────────────────────────────────────────────────
const TEX_W = 2048, TEX_H = 1024;

// Draw GeoJSON land polygons onto an offscreen canvas → ImageData for fast lookup
async function buildLandTexture() {
  // Natural Earth 110m land polygons (public domain, ~60 KB)
  const resp = await fetch(
    'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson'
  );
  if (!resp.ok) throw new Error('fetch failed');
  const geojson = await resp.json();

  const oc = document.createElement('canvas');
  oc.width  = TEX_W;
  oc.height = TEX_H;
  const ctx = oc.getContext('2d');

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = '#fff';

  // Equirectangular projection helpers
  const lx = lon => ((lon + 180) / 360) * TEX_W;
  const ly = lat => ((90  - lat)  / 180) * TEX_H;

  for (const feature of geojson.features) {
    const { type, coordinates } = feature.geometry;
    // Support both Polygon and MultiPolygon
    const polys = type === 'Polygon' ? [coordinates] : coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        ctx.beginPath();
        ring.forEach(([lo, la], i) => {
          i === 0 ? ctx.moveTo(lx(lo), ly(la)) : ctx.lineTo(lx(lo), ly(la));
        });
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  return ctx.getImageData(0, 0, TEX_W, TEX_H);
}

// Fallback bounding-box land mask (used while loading or on network error)
function isLandFallback(la, lo) {
  let lon = ((lo % 360) + 540) % 360 - 180;
  if (la > 10  && la < 72  && lon > -168 && lon < -52)  return true;
  if (la > -56 && la < 13  && lon > -82  && lon < -34)  return true;
  if (la > 36  && la < 71  && lon > -10  && lon < 35)   return true;
  if (la > -35 && la < 38  && lon > -18  && lon < 52)   return true;
  if (la > 10  && la < 75  && lon > 25   && lon < 140)  return true;
  if (la > -11 && la < 28  && lon > 96   && lon < 141)  return true;
  if (la > -44 && la < -10 && lon > 113  && lon < 154)  return true;
  if (la > 60  && la < 84  && lon > -55  && lon < -16)  return true;
  if (la > 30  && la < 46  && lon > 129  && lon < 146)  return true;
  return false;
}

// Sample ImageData to check land (returns true if pixel is land/white)
function sampleLand(imageData, latRad, lonRad) {
  const lon = lonRad * 180 / Math.PI;
  const lat = latRad * 180 / Math.PI;
  const tx  = Math.round(((lon + 180) / 360) * (TEX_W - 1));
  const ty  = Math.round(((90 - lat)  / 180) * (TEX_H - 1));
  const cx  = Math.max(0, Math.min(TEX_W - 1, tx));
  const cy  = Math.max(0, Math.min(TEX_H - 1, ty));
  return imageData.data[(cy * TEX_W + cx) * 4] > 128;
}

// Build Fibonacci-distributed globe dots using a land-check function
function buildDots(isLandFn, n = 4000) {
  const PHI    = Math.PI * (3 - Math.sqrt(5));
  const TWO_PI = 2 * Math.PI;
  const dots   = [];
  for (let i = 0; i < n; i++) {
    const y     = 1 - (i / (n - 1)) * 2;
    const theta = (PHI * i) % TWO_PI;
    const lat   = Math.asin(Math.max(-1, Math.min(1, y)));
    const lon   = theta > Math.PI ? theta - TWO_PI : theta;
    if (isLandFn(lat, lon)) dots.push([lat, lon]);
  }
  return dots;
}

// Pre-build fallback dots synchronously (shown immediately on first paint)
const FALLBACK_DOTS = buildDots(
  (lat, lon) => isLandFallback(lat * 180 / Math.PI, lon * 180 / Math.PI)
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(price) {
  if (!Number.isFinite(price)) return '--';
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(2) + 'M';
  if (price >= 1_000)     return Math.round(price).toLocaleString('en-US');
  return price.toFixed(2);
}
function fmtChange(ch) {
  if (!Number.isFinite(ch)) return '--';
  return (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%';
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────
const VIEW_TILT = 0.30;

function renderGlobe(canvas, elapsed, dots, bandData) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const H   = canvas.height;

  ctx.clearRect(0, 0, W, H);

  const cx       = W * 0.44;
  const cy       = H * 0.50;
  const R        = Math.min(W * 0.33, H * 0.43);
  const globeRot = elapsed * 0.00035;
  const bandRot  = elapsed * 0.00055;

  // ── Atmosphere ─────────────────────────────────────────────────────────
  const atmGrd = ctx.createRadialGradient(cx, cy, R * 0.75, cx, cy, R * 1.38);
  atmGrd.addColorStop(0, 'rgba(120,160,230,0.09)');
  atmGrd.addColorStop(0.7, 'rgba(60,100,180,0.03)');
  atmGrd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = atmGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.38, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = 'rgba(180,205,255,0.15)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.016, 0, Math.PI * 2);
  ctx.stroke();

  // ── Sphere background ──────────────────────────────────────────────────
  const sphGrd = ctx.createRadialGradient(
    cx - R * 0.22, cy - R * 0.22, R * 0.04, cx, cy, R
  );
  sphGrd.addColorStop(0,    'rgba(40,53,73,1)');
  sphGrd.addColorStop(0.45, 'rgba(14,18,27,1)');
  sphGrd.addColorStop(1,    'rgba(2,4,8,1)');
  ctx.fillStyle = sphGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();

  // ── Grid lines (clipped to sphere) ─────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.998, 0, Math.PI * 2);
  ctx.clip();

  for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
    const latR   = latDeg * Math.PI / 180;
    const screenY = cy - Math.sin(latR) * R * Math.cos(VIEW_TILT);
    const xR     = Math.cos(latR) * R;
    const yR     = xR * Math.sin(VIEW_TILT);
    ctx.beginPath();
    ctx.ellipse(cx, screenY, xR, Math.max(yR, 0.5), 0, 0, Math.PI * 2);
    ctx.strokeStyle = latDeg === 0
      ? 'rgba(160,185,255,0.13)'
      : 'rgba(130,160,220,0.055)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  for (let lonDeg = 0; lonDeg < 360; lonDeg += 30) {
    const lonR  = lonDeg * Math.PI / 180 + globeRot;
    const cosLon = Math.cos(lonR);
    if (cosLon < 0) continue;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(Math.sin(lonR)) * R, R * Math.cos(VIEW_TILT), 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(130,160,220,${cosLon * 0.065})`;
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }

  ctx.restore();

  // ── Continent dots ─────────────────────────────────────────────────────
  for (const [latR, lonR] of dots) {
    const rLon = lonR + globeRot;
    const x3   = Math.cos(latR) * Math.sin(rLon);
    const y3   = Math.sin(latR);
    const z3   = Math.cos(latR) * Math.cos(rLon);
    if (z3 < -0.05) continue;

    const y3v  = y3 * Math.cos(VIEW_TILT) - z3 * Math.sin(VIEW_TILT);
    const z3v  = y3 * Math.sin(VIEW_TILT) + z3 * Math.cos(VIEW_TILT);
    const alpha = Math.max(0, z3v) * 0.88 + 0.04;

    ctx.beginPath();
    ctx.arc(cx + x3 * R * 0.97, cy - y3v * R * 0.97, 1.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(215,228,255,${alpha})`;
    ctx.fill();
  }

  // ── Orbital currency band ──────────────────────────────────────────────
  const orbitR  = R * 1.27;
  const orbitTY = 0.24;

  const panels = bandData.map((cur, i) => {
    const angle = (i / bandData.length) * Math.PI * 2 + bandRot;
    const x3    = Math.sin(angle) * orbitR;
    const z3    = Math.cos(angle) * orbitR;
    return {
      cur, angle,
      px: cx + x3,
      py: cy + z3 * orbitTY,
      depth: (z3 / orbitR + 1) / 2,
    };
  });

  panels.sort((a, b) => a.depth - b.depth);

  const PW = 92, PH = 30;
  for (const { cur, angle, px, py, depth } of panels) {
    const a = Math.max(0.12, depth);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.cos(angle) * 0.10);

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 5;
    ctx.fillStyle   = `rgba(4,4,7,${a * 0.90})`;
    ctx.strokeStyle = `rgba(200,215,240,${a * 0.28})`;
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-PW / 2, -PH / 2, PW, PH, 5);
    else ctx.rect(-PW / 2, -PH / 2, PW, PH);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle    = `rgba(255,255,255,${a})`;
    ctx.font         = `bold 15px monospace`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(cur.code, -PW / 2 + 7, 0);

    ctx.fillStyle = `rgba(195,215,255,${a * 0.85})`;
    ctx.font      = `12px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(fmtPrice(cur.price), PW / 2 - 6, 0);

    ctx.restore();
  }
}

// ─── Ticker item ──────────────────────────────────────────────────────────────
function TickerItem({ code, change }) {
  const hasChange = Number.isFinite(change);
  const up = hasChange ? change >= 0 : null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '0 12px',
      fontFamily: 'monospace', fontSize: 'var(--fs-caption)',
      color: UI_COLORS.textSecondary, whiteSpace: 'nowrap',
    }}>
      <span style={{ color: up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative), fontSize: '0.55rem' }}>
        {up == null ? '•' : (up ? '▲' : '▼')}
      </span>
      <span style={{ color: '#bbb', fontWeight: 700 }}>{code}</span>
      <span style={{ color: up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative) }}>{fmtChange(change)}</span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function S03_MultiCurrencyBoard() {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const rafRef       = useRef(null);
  const startRef     = useRef(null);
  const dotsRef      = useRef(FALLBACK_DOTS);     // start with fallback immediately
  const bandDataRef  = useRef(EMPTY_CURRENCIES.filter(c => BAND_CODES.includes(c.code)));
  const [search, setSearch]     = useState('');
  const [currencies, setCurrencies] = useState(EMPTY_CURRENCIES);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [dataSource, setDataSource] = useState(null);

  // Multi-currency fetch via internal backend cache (Binance+Frankfurter),
  // falling back to direct Binance pairs when needed.
  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const btc = await fetchMultiCurrencyBtc([]);
        if (!active || !btc) return;

        const availableCodes = Object.keys(btc)
          .filter((k) => /^[a-z]{3}$/.test(k))
          .map((k) => k.toUpperCase());

        const selectedCodes = availableCodes.length > 0
          ? availableCodes
          : BASE_CURRENCY_META.map((m) => m.code);

        selectedCodes.sort((a, b) => {
          if (a === 'USD') return -1;
          if (b === 'USD') return 1;
          return a.localeCompare(b);
        });

        const updated = selectedCodes.map((code) => {
          const key = code.toLowerCase();
          const price = Number(btc[key]);
          const change = Number(btc[`${key}_24h_change`]);
          return {
            code,
            name: getCurrencyName(code),
            price: Number.isFinite(price) ? price : null,
            change: Number.isFinite(change) ? change : null,
          };
        });

        setCurrencies(updated);
        bandDataRef.current = updated.filter(c => BAND_CODES.includes(c.code));

        const src = String(btc.__source || '').toLowerCase();
        if (src.includes('binance') && src.includes('frankfurter')) setDataSource('BINANCE + FRANKFURTER');
        else if (src.includes('binance')) setDataSource('BINANCE');
        else if (src.includes('coingecko')) setDataSource('COINGECKO');
        else if (src) setDataSource(src.toUpperCase());
      } finally {
        if (active) setIsPriceLoading(false);
      }
    };

    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { active = false; clearInterval(t); };
  }, []);

  // Load accurate GeoJSON land texture asynchronously
  useEffect(() => {
    buildLandTexture()
      .then(imageData => {
        dotsRef.current = buildDots(
          (lat, lon) => sampleLand(imageData, lat, lon),
          5000
        );
      })
      .catch(() => {
        // Keep fallback dots — already set
      });
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const r        = container.getBoundingClientRect();
      canvas.width   = Math.floor(r.width);
      canvas.height  = Math.floor(r.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const loop = (ts) => {
      if (!startRef.current) startRef.current = ts;
      renderGlobe(canvas, ts - startRef.current, dotsRef.current, bandDataRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  const filtered = currencies.filter(
    c =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      String(c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const tickerItems = [...currencies, ...currencies];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#111111]">

      {/* ── Ticker ─────────────────────────────────────────────────────── */}
      <div className="flex-none overflow-hidden" style={{
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        background: '#111111', padding: '2px 0',
      }}>
        {isPriceLoading ? (
          <div className="flex items-center gap-3 px-4 py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ width: 110, height: '1em' }} />
            ))}
          </div>
        ) : (
          <>
            <style>{`
              @keyframes s03-ticker {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
            <div style={{
              display: 'inline-flex',
              animation: 's03-ticker 30s linear infinite',
              whiteSpace: 'nowrap',
            }}>
              {tickerItems.map((c, i) => (
                <TickerItem key={i} code={c.code} change={c.change} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Globe + Right panel ────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 flex flex-col lg:flex-row">

        {/* Globe canvas */}
        <div ref={containerRef} className="relative min-h-[250px] flex-1 min-w-0 sm:min-h-[320px] lg:min-h-0">
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        </div>

        {/* Right panel */}
        <div className="h-[clamp(220px,42%,360px)] flex flex-none flex-col border-t border-[#1a1a1a] bg-[#111111] lg:h-auto lg:w-[clamp(180px,22vw,260px)] lg:border-l lg:border-t-0">
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#141418', border: '1px solid #252530',
              borderRadius: 5, padding: '4px 8px',
            }}>
              <span style={{ color: '#444', fontSize: 10 }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search currency..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#aaa', fontFamily: 'monospace',
                  fontSize: 'var(--fs-micro)',
                  width: '100%',
                }}
                />
              </div>
            {dataSource && (
              <div style={{
                marginTop: 6,
                color: '#5d5d5d',
                fontFamily: 'monospace',
                fontSize: 'var(--fs-tag)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                src: {dataSource}
              </div>
            )}
            <div style={{
              marginTop: 4,
              color: '#4d4d4d',
              fontFamily: 'monospace',
              fontSize: 'var(--fs-tag)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              update: {Math.round(REFRESH_MS / 1000)}s
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{
            scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent',
          }}>
            {filtered.map((c) => {
              const hasChange = Number.isFinite(c.change);
              const up = hasChange ? c.change >= 0 : null;
              return (
                <div key={c.code} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px', borderBottom: '1px solid #141418',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isPriceLoading ? (
                      <div className="skeleton" style={{ width: 6, height: 6, borderRadius: '50%' }} />
                    ) : (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative), flexShrink: 0,
                      }} />
                    )}
                    <span style={{
                      color: '#bbb', fontFamily: 'monospace',
                      fontSize: 'var(--fs-micro)', fontWeight: 700,
                    }}>{c.code}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isPriceLoading ? (
                      <>
                        <div className="skeleton" style={{ width: 64, height: '0.9em', marginBottom: 4 }} />
                        <div className="skeleton" style={{ width: 48, height: '0.8em' }} />
                      </>
                    ) : (
                      <>
                        <div style={{
                          color: '#eee', fontFamily: 'monospace',
                          fontSize: 'var(--fs-micro)', fontWeight: 600,
                        }}>{fmtPrice(c.price)}</div>
                        <div style={{
                          color: up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative),
                          fontFamily: 'monospace',
                          fontSize: 'var(--fs-tag)',
                        }}>{fmtChange(c.change)}</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
