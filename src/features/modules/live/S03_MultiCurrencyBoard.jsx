// World Map Price Explorer — BTC price in currencies derived from Investing USD crosses
// Globe uses MapLibre GL globe projection with currency capital markers

import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { fetchMultiCurrencyBtc } from '@/shared/services/priceApi.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { ModuleShell, ModuleSourceFooter } from '@/shared/components/module/index.js';
import { UI_COLORS } from '@/shared/constants/colors.js';
import { formatMetaTimestamp } from '@/shared/utils/formatters.js';
import MapLibreBase from '@/shared/map/MapLibreBase.jsx';
import { GLOBE_DARK_STYLE_URL } from '@/shared/map/mapDarkStyle.js';
import { CURRENCY_COORDS } from '@/shared/data/currencyCountryCoords.js';

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

const REFRESH_MS = 30_000;
const ROTATE_RESUME_MS = 6_000; // ms of user inactivity before auto-rotation resumes
const ROTATE_DEG_PER_FRAME = 0.05; // axial spin speed (longitude pan per frame), ~react-globe.gl feel

// UI_COLORS imported from @/shared/constants/colors.js

/**
 * 3-tier color scheme for currency markers based on 24h % change magnitude.
 * Green: subtle → standard → vivid | Red: subtle → standard → vivid
 */
function getMarkerColor(change) {
  if (!Number.isFinite(change)) {
    return { border: 'rgba(180,205,255,0.20)', text: '#c8d8f8' };
  }
  const abs = Math.abs(change);
  if (change > 0) {
    if (abs >= 3) return { border: 'rgba(0,255,157,0.78)',   text: '#00ff9d' }; // vivid neon
    if (abs >= 1) return { border: 'rgba(47,212,140,0.62)',  text: '#2FD48C' }; // standard
    return               { border: 'rgba(90,176,144,0.42)',  text: '#7acbaa' }; // subtle sage
  } else {
    if (abs >= 3) return { border: 'rgba(255,40,40,0.78)',   text: '#ff3333' }; // vivid
    if (abs >= 1) return { border: 'rgba(255,96,96,0.62)',   text: '#ff6060' }; // standard
    return               { border: 'rgba(196,124,124,0.40)', text: '#c47c7c' }; // subtle rose
  }
}

function fmtGlobePrice(price) {
  if (!Number.isFinite(price)) return '--';
  if (price >= 1_000_000) return (price / 1_000_000).toFixed(2) + 'M';
  if (price >= 1_000)     return Math.round(price).toLocaleString('en-US');
  return price.toFixed(2);
}
function fmtGlobeChange(change) {
  if (!Number.isFinite(change)) return '--';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

function parseOverlayProviders(sourceLabel) {
  const src = String(sourceLabel || '').toUpperCase();
  if (src.includes('INVESTING')) {
    return [
      { name: 'Investing', url: 'https://www.investing.com/currencies/single-currency-crosses?currency=usd' },
      { name: 'Binance', url: 'https://api.binance.com' },
    ];
  }

  return [{ name: 'Satoshi Dashboard', url: 'https://github.com/Satoshi-Dashboard/main' }];
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function CurrencyMetric({ value, className = '' }) {
  if (!Number.isFinite(value)) return '--';
  if (value >= 1_000_000) return <AnimatedMetric value={value} variant="compact" decimals={2} inline justify="end" align="center" className={className} />;
  if (value >= 1_000) return <AnimatedMetric value={value} variant="number" decimals={0} inline justify="end" align="center" className={className} />;
  return <AnimatedMetric value={value} variant="number" decimals={2} inline justify="end" align="center" className={className} />;
}

function formatCurrencyValueStatic(value) {
  if (!Number.isFinite(value)) return '--';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return Math.round(value).toLocaleString('en-US');
  return value.toFixed(2);
}

function formatPercentStatic(value) {
  if (!Number.isFinite(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ─── Ticker item ──────────────────────────────────────────────────────────────
function TickerItem({ code, change, useStaticMetrics = false }) {
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
      <span style={{ color: up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative) }}>
        {useStaticMetrics
          ? formatPercentStatic(change)
          : <AnimatedMetric value={change} variant="percent" decimals={2} signed inline justify="end" align="center" color={up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative)} />}
      </span>
    </span>
  );
}

function TickerSkeleton() {
  return (
    <div className="flex items-center gap-4 px-3 py-1">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="skeleton h-2 w-2 rounded-full" />
          <div className="skeleton h-3 w-8 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

function CurrencyListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="flex min-h-[46px] items-center justify-between border-b border-[#141418] px-2.5 py-2">
          <div className="flex items-center gap-2">
            <div className="skeleton h-1.5 w-1.5 rounded-full" />
            <div className="skeleton h-3 w-10 rounded" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-2.5 w-14 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function S03_MultiCurrencyBoard() {
  const globeMapRef     = useRef(null);
  const markersRef      = useRef([]);
  const currenciesRef   = useRef([]);          // always-fresh prices for popup
  const markerElsRef    = useRef({});          // code → DOM element (for live recoloring)
  const [search, setSearch]                   = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const showDesktopOverlay = useMediaQuery('(min-width: 1024px)');
  const useStaticResponsiveMetrics = useMediaQuery('(max-width: 1023px)');

  // Multi-currency fetch via internal TradingEconomics scraper cache.
  const fetchCurrencies = useCallback(() => fetchMultiCurrencyBtc([]), []);

  const transformCurrencies = useCallback((btc) => {
    if (!btc) return { currencies: EMPTY_CURRENCIES, sourceLabel: '/API/BTC/RATES + INVESTING', lastUpdatedAt: new Date() };

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

    let srcLabel = '/API/BTC/RATES + INVESTING';
    const src = String(btc.__source || '').trim();
    if (src) {
      const fallbackTag = btc.__is_fallback ? ' (STALE FALLBACK)' : '';
      srcLabel = `${src.toUpperCase()}${fallbackTag}`;
    }

    return { currencies: updated, sourceLabel: srcLabel, lastUpdatedAt: new Date() };
  }, []);

  const { data: priceData, loading: isPriceLoading } = useModuleData(fetchCurrencies, {
    refreshMs: REFRESH_MS,
    initialData: { currencies: EMPTY_CURRENCIES, sourceLabel: '/API/BTC/RATES + INVESTING', lastUpdatedAt: new Date() },
    keepPreviousOnError: true,
    transform: transformCurrencies,
  });

  const currencies = priceData.currencies;
  const sourceLabel = priceData.sourceLabel;
  const lastUpdatedAt = priceData.lastUpdatedAt;

  // Keep currenciesRef in sync + recolor markers based on 24h change magnitude
  useEffect(() => {
    currenciesRef.current = currencies;
    currencies.forEach(({ code, change }) => {
      const el = markerElsRef.current[code];
      if (!el) return;
      const { border, text } = getMarkerColor(change);
      el.style.borderColor = border;
      el.style.color = text;
    });
  }, [currencies]);

  // FlyTo selected currency capital on the globe
  useEffect(() => {
    if (!selectedCurrency || !globeMapRef.current) return;
    const coords = CURRENCY_COORDS[selectedCurrency];
    if (!coords) return;
    const map = globeMapRef.current;
    // Pause axial spin during flyTo so the rAF loop doesn't fight flyTo's center.
    map.__s03?.stop();
    map.flyTo({ center: coords, zoom: 3, duration: 1500 });
    const resume = setTimeout(() => map.__s03?.start(), 1600);
    return () => clearTimeout(resume);
  }, [selectedCurrency]);

  // Globe ready — rotation with resume + currency markers with price popup
  const handleGlobeReady = useCallback((map) => {
    globeMapRef.current = map;

    // Keep the globe upright (no tilt) so the spin reads as a clean axial Earth rotation.
    map.easeTo({ pitch: 0, bearing: 0, duration: 1200 });

    // ── Auto-rotation with pause-and-resume ─────────────────────────────
    let rafId = null;
    let resumeTimer = null;

    const stopRotation = () => {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      clearTimeout(resumeTimer);
    };

    const startRotation = () => {
      if (rafId !== null) return; // already running
      const tick = () => {
        // Pan center longitude → clean west→east axial spin (like react-globe.gl autoRotate)
        const c = map.getCenter();
        map.setCenter([c.lng - ROTATE_DEG_PER_FRAME, c.lat]);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };

    // Expose control functions so the Reset button can call them
    map.__s03 = { start: startRotation, stop: stopRotation };

    const onUserInteraction = () => {
      stopRotation();
      resumeTimer = setTimeout(startRotation, ROTATE_RESUME_MS);
    };

    map.on('mousedown', onUserInteraction);
    map.on('dragstart', onUserInteraction);
    map.on('touchstart', onUserInteraction);
    // Clean up when MapLibre removes the map
    map.on('remove', () => { stopRotation(); });
    startRotation();

    // ── Globe atmosphere — opaque dark back-hemisphere, no see-through ──
    try {
      map.setFog({
        color: '#0d1117',
        'high-color': '#080c12',
        'horizon-blend': 0.06,
        'space-color': '#000005',
        'star-intensity': 0,
      });
    } catch { /* MapLibre version may not support fog — safe to ignore */ }

    // ── Currency capital markers (one popup per marker) ──────────────────
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markerElsRef.current = {};

    Object.entries(CURRENCY_COORDS).forEach(([code, coords]) => {
      // Initial color: pick from currenciesRef if data already loaded
      const cur0 = currenciesRef.current.find(c => c.code === code);
      const { border: initBorder, text: initColor } = getMarkerColor(cur0?.change ?? null);

      const el = document.createElement('div');
      el.textContent = code;
      el.setAttribute('style', [
        'background:rgba(6,6,10,0.92)',
        `border:1px solid ${initBorder}`,
        'border-radius:4px',
        `color:${initColor}`,
        'font-family:monospace',
        'font-size:10px',
        'font-weight:700',
        'padding:2px 7px',
        'cursor:pointer',
        'white-space:nowrap',
        'pointer-events:auto',
        'user-select:none',
        'line-height:1.6',
        'box-shadow:0 2px 8px rgba(0,0,0,0.85)',
        'transition:border-color 0.18s,background 0.18s,color 0.18s',
      ].join(';'));

      markerElsRef.current[code] = el;   // register for live recoloring

      el.addEventListener('mouseenter', () => {
        el.style.background = 'rgba(18,28,56,0.97)';
        el.style.borderColor = 'rgba(140,180,255,0.65)';
        el.style.color = '#ffffff';
      });
      el.addEventListener('mouseleave', () => {
        // Restore to current tier-color from ref (avoids stale closure)
        const cur = currenciesRef.current.find(c => c.code === code);
        const { border, text } = getMarkerColor(cur?.change ?? null);
        el.style.background = 'rgba(6,6,10,0.92)';
        el.style.borderColor = border;
        el.style.color = text;
      });

      // One popup anchored to this marker — MapLibre handles toggle open/close
      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        anchor: 'bottom',
        offset: [0, -4],
        maxWidth: '220px',
        className: 's03-price-popup',
      });

      // Our listener fires first: update HTML → then MapLibre opens the popup
      el.addEventListener('click', () => {
        onUserInteraction();

        const cur = currenciesRef.current.find(c => c.code === code);
        const price = cur?.price;
        const change = cur?.change;
        const up = Number.isFinite(change) ? change >= 0 : null;
        const changeColor = up === null ? 'rgba(255,255,255,0.38)' : (up ? '#2FD48C' : '#ff6060');
        const changeArrow = up === null ? '' : (up ? '▲ ' : '▼ ');

        popup.setHTML(`
          <div style="font-family:monospace;line-height:1.4">
            <div style="font-size:13px;font-weight:700;color:#e8f0ff;letter-spacing:0.04em">${code}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.38);margin-bottom:7px">${cur?.name || ''}</div>
            <div style="font-size:16px;font-weight:700;color:#fff">${fmtGlobePrice(price)}</div>
            <div style="font-size:11px;margin-top:3px;color:${changeColor}">${changeArrow}${fmtGlobeChange(change)} (24h)</div>
          </div>
        `);

        setSelectedCurrency(code);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(coords)
        .setPopup(popup)   // native toggle: click to open, click again / elsewhere to close
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, []);

  const filtered = currencies.filter(
    c =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      String(c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const tickerItems = [...currencies, ...currencies];
  const showCurrencySkeleton = isPriceLoading && !currencies.some((currency) => Number.isFinite(currency.price));

  return (
    <ModuleShell overflow="hidden">

      {/* ── Ticker ─────────────────────────────────────────────────────── */}
      <div className="flex-none overflow-hidden" style={{
        borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a',
        background: '#111111', padding: '2px 0',
      }}>
        <style>{`
          @keyframes s03-ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          /* Hide markers on the back hemisphere — prevents see-through ghost labels */
          .maplibregl-marker-covered {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.2s !important;
          }
          /* Global base layer forces bg/shadow/padding/rounded with !important on
             .maplibregl-popup-content — must re-assert with !important to win. */
          .s03-price-popup .maplibregl-popup-content {
            background: rgba(5,5,9,0.97) !important;
            border: 1px solid rgba(160,190,255,0.18) !important;
            border-radius: 7px !important;
            padding: 10px 13px !important;
            box-shadow: 0 6px 28px rgba(0,0,0,0.75) !important;
            color: #fff;
          }
          .s03-price-popup .maplibregl-popup-tip {
            display: block !important;
            border-top-color: rgba(5,5,9,0.97) !important;
          }
          .s03-price-popup .maplibregl-popup-close-button {
            color: rgba(255,255,255,0.35);
            font-size: 15px;
            padding: 3px 7px;
            line-height: 1;
          }
          .s03-price-popup .maplibregl-popup-close-button:hover {
            color: rgba(255,255,255,0.75);
            background: transparent;
          }
        `}</style>
        {showCurrencySkeleton ? (
          <TickerSkeleton />
        ) : (
          <div style={{
            display: 'inline-flex',
            animation: 's03-ticker 75s linear infinite',
            whiteSpace: 'nowrap',
          }}>
            {tickerItems.map((c, i) => (
              <TickerItem key={i} code={c.code} change={c.change} useStaticMetrics={useStaticResponsiveMetrics} />
            ))}
          </div>
        )}
      </div>

      {/* ── Globe + Right panel ────────────────────────────────────────── */}
      <div className="min-h-0 flex flex-col lg:flex-1 lg:flex-row">

        {/* Globe — MapLibre 3D */}
        <div className="visual-canvas-surface relative h-[42vh] min-h-[240px] max-h-[420px] min-w-0 flex-none sm:h-[48vh] sm:min-h-[280px] sm:max-h-[500px] lg:h-auto lg:min-h-0 lg:max-h-none lg:flex-1">
          <MapLibreBase
            style={GLOBE_DARK_STYLE_URL}
            projection="globe"
            center={[10, 20]}
            zoom={1.5}
            minZoom={1}
            maxZoom={8}
            onMapReady={handleGlobeReady}
          />

          {/* Reset globe orientation button */}
          <button
            title="Reset globe to north"
            onClick={() => {
              const map = globeMapRef.current;
              if (!map) return;
              map.__s03?.stop();
              map.easeTo({ center: [10, 20], bearing: 0, pitch: 0, zoom: 1.5, duration: 800 });
              setTimeout(() => map.__s03?.start(), 900);
            }}
            style={{
              position: 'absolute',
              bottom: 14,
              right: 14,
              zIndex: 1000,
              background: 'rgba(8,8,12,0.85)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.70)',
              fontFamily: 'monospace',
              fontSize: 11,
              padding: '5px 10px',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'border-color 0.15s, color 0.15s',
              lineHeight: 1.4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)'; e.currentTarget.style.color = 'rgba(255,255,255,0.90)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.70)'; }}
          >
            ↺ Reset
          </button>

          {showDesktopOverlay && (
            <ModuleSourceFooter
              providers={parseOverlayProviders(sourceLabel)}
              refreshLabel={`${Math.round(REFRESH_MS / 1000)}s`}
              lastSync={formatMetaTimestamp(lastUpdatedAt)}
              align="left"
              className="absolute bottom-3 left-3 z-10 rounded border border-white/10 bg-[#080808]/90 px-3 py-2"
              style={{ color: '#7c7c7c', fontSize: '12px' }}
            />
          )}
        </div>

        {/* Right panel */}
        <div className="visual-integrity-lock flex h-[min(40vh,360px)] min-h-[280px] flex-none flex-col border-t border-[#1a1a1a] bg-[#111111] sm:h-[min(42vh,420px)] sm:min-h-[320px] lg:h-auto lg:min-h-0 lg:w-[clamp(180px,22vw,260px)] lg:border-l lg:border-t-0">
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#141418', border: '1px solid #252530',
              borderRadius: 8, padding: '8px 10px', minHeight: 42,
            }}>
              <span style={{ color: '#444', fontSize: 12 }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search currency..."
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#aaa', fontFamily: 'monospace',
                  fontSize: 'var(--fs-caption)',
                  width: '100%',
                }}
                />
              </div>
          </div>

          <div
            className="scrollbar-hidden-mobile min-h-0 flex-1 overflow-y-auto pb-3"
            style={{
              scrollbarWidth: 'thin', scrollbarColor: '#2a2a2a transparent',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {showCurrencySkeleton ? (
              <CurrencyListSkeleton />
            ) : filtered.map((c) => {
              const hasChange = Number.isFinite(c.change);
              const up = hasChange ? c.change >= 0 : null;
              const hasCoords = Boolean(CURRENCY_COORDS[c.code]);
              return (
                <div
                  key={c.code}
                  onClick={() => hasCoords && setSelectedCurrency(c.code)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderBottom: '1px solid #141418', minHeight: 46,
                    cursor: hasCoords ? 'pointer' : 'default',
                    background: selectedCurrency === c.code ? 'rgba(60,80,140,0.18)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative),
                    }} />
                    <span style={{
                      color: '#bbb', fontFamily: 'monospace',
                      fontSize: 'var(--fs-caption)', fontWeight: 700,
                    }}>{c.code}</span>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 96, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{
                      color: '#eee', fontFamily: 'monospace',
                      fontSize: 'var(--fs-caption)', fontWeight: 600, minHeight: '1.2em', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                      width: '100%',
                    }}>{useStaticResponsiveMetrics ? formatCurrencyValueStatic(c.price) : <CurrencyMetric value={c.price} className="w-full" />}</div>
                    <div style={{
                      color: up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative),
                      fontFamily: 'monospace',
                      fontSize: 'var(--fs-tag)', minHeight: '1.1em', display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                      width: '100%',
                    }}>{useStaticResponsiveMetrics ? formatPercentStatic(c.change) : <AnimatedMetric value={c.change} variant="percent" decimals={2} signed inline justify="end" align="center" className="w-full" color={up == null ? UI_COLORS.textTertiary : (up ? UI_COLORS.positive : UI_COLORS.negative)} />}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
