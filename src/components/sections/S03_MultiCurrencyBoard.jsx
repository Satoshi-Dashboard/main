// World Map Price Explorer — BTC price in 20 global currencies
// Globe uses Natural Earth 110m GeoJSON for pixel-accurate land shapes
// Fallback to bounding-box mask if network unavailable

import { useEffect, useRef, useState } from 'react';
import { fetchMultiCurrencyBtc } from '../../services/priceApi';

// ─── Currency data (defaults shown until API responds) ─────────────────────────
const CURRENCY_META = [
  { code: 'USD', name: 'US Dollar'         },
  { code: 'EUR', name: 'Euro'              },
  { code: 'GBP', name: 'British Pound'     },
  { code: 'JPY', name: 'Japanese Yen'      },
  { code: 'CNY', name: 'Chinese Yuan'      },
  { code: 'INR', name: 'Indian Rupee'      },
  { code: 'KRW', name: 'Korean Won'        },
  { code: 'CAD', name: 'Canadian Dollar'   },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc'       },
  { code: 'RUB', name: 'Russian Ruble'     },
  { code: 'BRL', name: 'Brazilian Real'    },
  { code: 'MXN', name: 'Mexican Peso'      },
  { code: 'SGD', name: 'Singapore Dollar'  },
  { code: 'HKD', name: 'Hong Kong Dollar'  },
  { code: 'TRY', name: 'Turkish Lira'      },
  { code: 'SEK', name: 'Swedish Krona'     },
  { code: 'NOK', name: 'Norwegian Krone'   },
  { code: 'DKK', name: 'Danish Krone'      },
  { code: 'PLN', name: 'Polish Zloty'      },
];

const DEFAULT_CURRENCIES = CURRENCY_META.map(m => ({ ...m, price: 0, change: 0 }));

const BAND_CODES = ['JPY', 'INR', 'KRW', 'CNY', 'EUR', 'GBP', 'USD', 'RUB'];
const CG_CURRENCIES = CURRENCY_META.map(c => c.code.toLowerCase()).join(',');

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
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(2) + 'M';
  if (price >= 1_000)     return Math.round(price).toLocaleString('en-US');
  return price.toFixed(2);
}
function fmtChange(ch) { return (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%'; }

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
  const up = change >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '0 18px',
      fontFamily: 'monospace', fontSize: 'var(--fs-caption)',
      color: '#888', whiteSpace: 'nowrap',
    }}>
      <span style={{ color: up ? '#00D897' : '#FF4757', fontSize: '0.55rem' }}>
        {up ? '▲' : '▼'}
      </span>
      <span style={{ color: '#bbb', fontWeight: 700 }}>{code}</span>
      <span style={{ color: up ? '#00D897' : '#FF4757' }}>{fmtChange(change)}</span>
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
  const bandDataRef  = useRef(DEFAULT_CURRENCIES.filter(c => BAND_CODES.includes(c.code)));
  const [loaded, setLoaded]     = useState(false);  // true once GeoJSON dots ready
  const [search, setSearch]     = useState('');
  const [currencies, setCurrencies] = useState(DEFAULT_CURRENCIES);

  // Live multi-source multi-currency fetch (CoinGecko → Binance+FX → Kraken+FX)
  useEffect(() => {
    let active = true;
    const codes = CURRENCY_META.map(m => m.code.toLowerCase());
    const load = async () => {
      const btc = await fetchMultiCurrencyBtc(codes);
      if (!btc || !active) return;
      const updated = CURRENCY_META.map(m => {
        const key = m.code.toLowerCase();
        return {
          ...m,
          price:  btc[key]                 ?? 0,
          change: btc[`${key}_24h_change`] ?? 0,
        };
      });
      setCurrencies(updated);
      bandDataRef.current = updated.filter(c => BAND_CODES.includes(c.code));
    };
    load();
    const t = setInterval(load, 60_000);
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
        setLoaded(true);
      })
      .catch(() => {
        // Keep fallback dots — already set
        setLoaded(true);
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
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const tickerItems = [...currencies, ...currencies];

  return (
    <div className="flex h-full w-full flex-col bg-[#0a0a0f]">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-5 pt-3 pb-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: '#F7931A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#000',
          }}>₿</div>
          <span style={{
            color: '#ddd', fontFamily: 'monospace',
            fontSize: 'var(--fs-body)', fontWeight: 700,
            letterSpacing: '0.05em',
          }}>
            World Map Price Explorer
          </span>
          {!loaded && (
            <span style={{
              color: '#444', fontFamily: 'monospace',
              fontSize: '0.55rem', marginLeft: 6,
            }}>loading map…</span>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          color: '#444', fontFamily: 'monospace',
          fontSize: 'var(--fs-caption)',
        }}>
          <span style={{
            display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
            background: '#00D897', boxShadow: '0 0 6px #00D897',
          }} />
          LIVE
        </div>
      </div>

      {/* ── Ticker ─────────────────────────────────────────────────────── */}
      <div className="flex-none overflow-hidden" style={{
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        background: '#0d0d12', padding: '3px 0',
      }}>
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
      </div>

      {/* ── Globe + Right panel ────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 flex">

        {/* Globe canvas */}
        <div ref={containerRef} className="flex-1 min-w-0" style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        </div>

        {/* Right panel */}
        <div className="flex-none flex flex-col" style={{
          width: 'clamp(160px, 18vw, 240px)',
          borderLeft: '1px solid #1a1a1a',
          background: '#0d0d12',
        }}>
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
          </div>

          <div className="flex-1 overflow-y-auto" style={{
            scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent',
          }}>
            {filtered.map((c) => {
              const up = c.change >= 0;
              return (
                <div key={c.code} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px', borderBottom: '1px solid #141418',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: up ? '#00D897' : '#FF4757', flexShrink: 0,
                    }} />
                    <span style={{
                      color: '#bbb', fontFamily: 'monospace',
                      fontSize: 'var(--fs-micro)', fontWeight: 700,
                    }}>{c.code}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: '#eee', fontFamily: 'monospace',
                      fontSize: 'var(--fs-micro)', fontWeight: 600,
                    }}>{fmtPrice(c.price)}</div>
                    <div style={{
                      color: up ? '#00D897' : '#FF4757',
                      fontFamily: 'monospace',
                      fontSize: 'var(--fs-tag)',
                    }}>{fmtChange(c.change)}</div>
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
