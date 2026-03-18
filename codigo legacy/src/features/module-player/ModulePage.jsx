import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hammer from 'lucide-react/dist/esm/icons/hammer';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import SkipBack from 'lucide-react/dist/esm/icons/skip-back';
import SkipForward from 'lucide-react/dist/esm/icons/skip-forward';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FIRST_MODULE,
  getModulePath,
  LEGACY_MODULE_REDIRECTS,
  MODULES,
  MODULES_BY_SLUG,
  preloadModule,
} from '@/features/module-registry/modules.js';
import { getModuleDataMeta } from '@/features/module-registry/moduleDataMeta.js';
import { getModuleSEO } from '@/features/module-registry/moduleSEO.js';
import { preloadSeoHubRoute, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import {
  SharedMetaAbsoluteCard,
  SharedMetaBottomStrip,
  SharedMetaTopStrip,
} from '@/features/module-player/components/SharedModuleMeta.jsx';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js';
import { absoluteUrl, DEFAULT_OG_IMAGE, usePageSEO } from '@/shared/hooks/usePageSEO.js';
import { trackModuleNavigation, trackModuleViewed, trackSeoNavigationClick } from '@/shared/lib/analytics.js';

const BlockedPreviewPoster = lazy(() => import('@/features/module-player/components/BlockedPreviewPoster.jsx'));
const ModuleDonateModal = lazy(() => import('@/features/module-player/components/ModuleDonateModal.jsx'));

const MARKET_AUDIO_POLL_MS = 15_000;
const MARKET_AUDIO_HISTORY_MS = 20 * 60 * 1000;
const MARKET_AUDIO_TRACKS = {
  down: '/modulos-referencia/musica/Bajista.mp3',
  up: '/modulos-referencia/musica/Alcista.mp3',
  stable: '/modulos-referencia/musica/Lateralestable.mp3',
};

const MARKET_AUDIO_THEMES = {
  down: {
    color: 'var(--accent-red)',
    borderColor: 'rgba(255,71,87,0.42)',
    glow: '0 0 24px rgba(255,71,87,0.28)',
    label: 'Bearish soundtrack ready',
  },
  up: {
    color: 'var(--accent-green)',
    borderColor: 'rgba(0,216,151,0.42)',
    glow: '0 0 24px rgba(0,216,151,0.24)',
    label: 'Bullish soundtrack ready',
  },
  stable: {
    color: 'var(--text-secondary)',
    borderColor: 'rgba(255,255,255,0.2)',
    glow: 'none',
    label: 'Sideways soundtrack ready',
  },
};

const DONATION_ADDRESS = 'BC1QC2GD3YN8DTLMZG4UW786MFN085WE69F60V4R6F';
const NOINDEX_PREVIEW_SLUGS = new Set([
  'bitcoin-power-law-model',
  'bitcoin-stock-to-flow-model',
  'bitcoin-big-mac-sats-tracker',
  'bitcoin-seasonality-heatmap',
  'bitcoin-big-mac-index',
  'bitcoin-network-activity',
  'bitcoin-log-regression-channel',
  'bitcoin-mvrv-score',
  'bitcoin-google-trends',
  'bitcoin-dominance-chart',
  'bitcoin-utxo-distribution',
]);

const BLOCKING_OVERLAY_SLUGS = new Set([
  'bitcoin-power-law-model',
  'bitcoin-stock-to-flow-model',
  'bitcoin-big-mac-sats-tracker',
  'bitcoin-seasonality-heatmap',
  'bitcoin-big-mac-index',
  'bitcoin-network-activity',
  'bitcoin-log-regression-channel',
  'bitcoin-mvrv-score',
  'bitcoin-google-trends',
  'bitcoin-dominance-chart',
  'bitcoin-utxo-distribution',
]);

function getCadenceLabel(meta) {
  if (meta?.refreshLabel) return meta.refreshLabel;
  if (meta?.refreshRangeLabel) return meta.refreshRangeLabel;

  const refreshSeconds = Number(meta?.refreshSeconds);
  if (Number.isFinite(refreshSeconds) && refreshSeconds > 0) {
    if (refreshSeconds < 60) return `${Math.round(refreshSeconds)}s`;
    return `${Math.ceil(refreshSeconds / 60)}m`;
  }

  const refreshMinutes = Number(meta?.refreshMinutes);
  if (!Number.isFinite(refreshMinutes) || refreshMinutes <= 0) {
    return 'on demand';
  }
  if (refreshMinutes < 60) return `${Math.ceil(refreshMinutes)}m`;
  return `${Math.ceil(refreshMinutes / 60)}h`;
}

function renderProviderLinks(providers) {
  return (providers || []).map((provider, index) => (
    <span key={`${provider.name}-${provider.url}`}>
      {provider.url ? (
        <a
          href={provider.url}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-2 hover:underline"
          style={{ color: 'var(--accent-bitcoin)' }}
        >
          {provider.name}
        </a>
      ) : (
        <span style={{ color: 'var(--accent-bitcoin)' }}>{provider.name}</span>
      )}
      {index < providers.length - 1 ? <span className="text-white/45"> + </span> : null}
    </span>
  ));
}

function getCadenceMs(meta) {
  const seconds = Number(meta?.refreshSeconds);
  if (Number.isFinite(seconds) && seconds > 0) return Math.round(seconds * 1000);

  const minutes = Number(meta?.refreshMinutes);
  if (Number.isFinite(minutes) && minutes > 0) return Math.round(minutes * 60 * 1000);

  return null;
}

function classifyMarketAudioMood(spot, samples) {
  const change24h = Number(spot?.change24h ?? 0);
  if (Number.isFinite(change24h) && change24h <= -2) return 'down';
  if (Number.isFinite(change24h) && change24h >= 4) return 'up';

  const validSamples = Array.isArray(samples)
    ? samples.filter((sample) => Number.isFinite(sample?.usd) && sample.usd > 0)
    : [];

  if (validSamples.length < 2) return 'stable';

  const first = validSamples[0].usd;
  const last = validSamples[validSamples.length - 1].usd;
  const prices = validSamples.map((sample) => sample.usd);
  const shortTermChange = ((last - first) / first) * 100;
  const rangePct = ((Math.max(...prices) - Math.min(...prices)) / first) * 100;

  if (Math.abs(shortTermChange) <= 0.35 && rangePct <= 0.9) return 'stable';
  return 'stable';
}

const getWrappedIndex = (index) => {
  const total = MODULES.length;
  return ((index % total) + total) % total;
};

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const dateStr = now.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return (
    <span className="font-mono text-[11px] tracking-wide text-white/50 sm:text-[12px]">
      {dateStr}, {timeStr}
    </span>
  );
}

function ModuleContentFallback({ title }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111] px-3.5 pb-3.5 pt-4 sm:px-5 sm:pb-4 sm:pt-5 lg:px-[22px] lg:pb-4 lg:pt-5">
      <div className="flex flex-shrink-0 flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0">
          <div
            className="font-mono font-bold lg:hidden"
            style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-subtitle)' }}
          >
            {title}
          </div>
          <div className="skeleton mt-2 h-10 w-[min(240px,72vw)] rounded-xl sm:mt-0 sm:h-12 sm:w-[320px]" />
          <div className="skeleton mt-3 h-4 w-40 rounded-full" />
        </div>
        <div className="hidden sm:block">
          <div className="skeleton h-4 w-28 rounded-full" />
        </div>
      </div>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <div className="grid flex-1 min-h-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/[0.06] bg-[#0f0f0f] p-4"
            >
              <div className="skeleton h-5 w-24 rounded-full" />
              <div className="skeleton mt-4 h-14 w-full rounded-2xl" />
              <div className="skeleton mt-4 h-4 w-2/3 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModulePage({ forcedSlug = null }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const activeSlug = forcedSlug || slug;

  const currentIndex = useMemo(() => {
    const index = MODULES.findIndex((m) => m.slug === activeSlug);
    return index >= 0 ? index : 0;
  }, [activeSlug]);

  const module = MODULES_BY_SLUG[activeSlug] || MODULES[currentIndex];
  const Component = module.component;
  const seo = useMemo(() => getModuleSEO(module.slugBase), [module.slugBase]);
  const canonicalPath = module.code === FIRST_MODULE.code ? '/' : `/module/${module.slug}`;
  const isNoindexPreview = useMemo(() => NOINDEX_PREVIEW_SLUGS.has(module.slugBase), [module.slugBase]);
  const hasBlockingOverlay = useMemo(() => BLOCKING_OVERLAY_SLUGS.has(module.slugBase), [module.slugBase]);
  const moduleSchema = useMemo(
    () => ([
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: seo.title,
        description: seo.description,
        url: absoluteUrl(canonicalPath),
        isPartOf: 'https://satoshidashboard.com/',
        primaryImageOfPage: DEFAULT_OG_IMAGE,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Dashboard',
            item: 'https://satoshidashboard.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: module.title,
            item: absoluteUrl(canonicalPath),
          },
        ],
      },
    ]),
    [canonicalPath, module.title, seo.description, seo.title],
  );

  usePageSEO({
    title: seo.title,
    description: seo.description,
    canonicalPath,
    keywords: seo.keywords,
    robots: isNoindexPreview ? 'noindex, follow' : undefined,
    image: DEFAULT_OG_IMAGE,
    imageAlt: module.title,
    schema: isNoindexPreview ? [] : moduleSchema,
  });

  useEffect(() => {
    trackModuleViewed(module, {
      path: canonicalPath,
      routeType: module.code === FIRST_MODULE.code ? 'root' : 'module',
      slugBase: module.slugBase,
    });
  }, [canonicalPath, module]);

  const footerPage = useMemo(() => String(module.code || '').replace(/^S/i, ''), [module.code]);
  const footerTotal = useMemo(
    () => MODULES.reduce((max, item) => {
      const n = Number(String(item.code || '').match(/\d+/)?.[0] || 0);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0),
    [],
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [marketAudioMood, setMarketAudioMood] = useState('stable');
  const [marketAudioSpot, setMarketAudioSpot] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateCopied, setDonateCopied] = useState(false);
  const [metaLastAtMs, setMetaLastAtMs] = useState(() => Date.now());
  const [marketAudioReady, setMarketAudioReady] = useState(false);
  const marketSamplesRef = useRef([]);
  const marketAudioRef = useRef(null);

  const onCopyDonation = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_ADDRESS);
      setDonateCopied(true);
      setTimeout(() => setDonateCopied(false), 1400);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = DONATION_ADDRESS;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setDonateCopied(true);
          setTimeout(() => setDonateCopied(false), 1400);
        }
      } catch { /* ignore */ }
    }
  };
  const isResponsiveViewport = useMediaQuery('(max-width: 1023px)');
  const contentScrollRef = useRef(null);

  const moduleMeta = useMemo(() => getModuleDataMeta(module), [module]);
  const cadenceLabel = useMemo(() => getCadenceLabel(moduleMeta), [moduleMeta]);
  const showSharedStrip = moduleMeta?.showSharedStrip !== false;
  const showSharedStripOnResponsive = moduleMeta?.showSharedStripOnResponsive !== false;
  const cadenceMs = useMemo(() => getCadenceMs(moduleMeta), [moduleMeta]);
  const hideSharedMetaForDesktopOverlay = Boolean(!isResponsiveViewport && moduleMeta?.desktopOverlayInModule);
  const showSharedMeta = showSharedStrip
    && !hideSharedMetaForDesktopOverlay
    && (!isResponsiveViewport || showSharedStripOnResponsive);
  const useAbsoluteSharedMetaCard = Boolean(moduleMeta?.sharedMetaAbsoluteCard);
  const showAbsoluteMetaCard = showSharedMeta && useAbsoluteSharedMetaCard && !isResponsiveViewport;
  const hideSharedMetaOnDesktop = Boolean(moduleMeta?.hideSharedMetaOnDesktop);
  const showTopMeta = showSharedMeta && !useAbsoluteSharedMetaCard && !hideSharedMetaOnDesktop;
  const showBottomMeta = showSharedMeta && isResponsiveViewport;
  const useResponsiveScroll = isResponsiveViewport && (showBottomMeta || moduleMeta?.responsiveScroll === true);
  const metaLastAt = new Date(metaLastAtMs);
  const stripTitle = moduleMeta?.showTitleInStrip === false ? '' : (moduleMeta?.stripTitle || module.title);

  useEffect(() => {
    if (!isResponsiveViewport) return;

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    };

    resetScroll();
    requestAnimationFrame(resetScroll);
  }, [activeSlug, isResponsiveViewport]);

  useEffect(() => {
    if (!showSharedMeta || !Number.isFinite(cadenceMs) || cadenceMs <= 0) return undefined;

    const intervalMs = Math.max(1000, cadenceMs);
    const timer = setInterval(() => setMetaLastAtMs(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [showSharedMeta, cadenceMs]);

  useEffect(() => {
    if (!slug) return;

    if (slug === FIRST_MODULE.slug) {
      navigate('/', { replace: true });
      return;
    }

    const legacyRedirect = LEGACY_MODULE_REDIRECTS[slug];
    if (legacyRedirect) {
      navigate(legacyRedirect, { replace: true });
      return;
    }

    if (!MODULES_BY_SLUG[slug]) {
      navigate('/', { replace: true });
    }
  }, [slug, navigate]);

  const goToModule = useCallback(
    (index, options = {}) => {
      const targetModule = MODULES[getWrappedIndex(index)];
      trackModuleNavigation({
        action: options.action || 'open',
        surface: options.surface || 'module-shell',
        currentModule: module,
        targetModule,
      });
      navigate(getModulePath(targetModule));
    },
    [module, navigate],
  );

  const goToHomeModule = useCallback(() => {
    trackModuleNavigation({
      action: 'home',
      surface: 'header-logo',
      currentModule: module,
      targetModule: FIRST_MODULE,
    });
    navigate('/');
  }, [module, navigate]);

  const onOpenLanding = useCallback(() => {
    trackSeoNavigationClick({
      label: 'satoshi-dashboard',
      destination: SEO_HUB_PATH,
      surface: 'module-footer-brand',
    });
  }, []);

  const preloadModuleDirection = useCallback((index) => {
    const targetModule = MODULES[getWrappedIndex(index)];
    void preloadModule(targetModule);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToModule(currentIndex - 1, { action: 'previous', surface: 'keyboard' });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToModule(currentIndex + 1, { action: 'next', surface: 'keyboard' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, goToModule]);

  useEffect(() => {
    if (!marketAudioReady) return undefined;

    let active = true;

    const loadMarketAudioState = async () => {
      try {
        const { fetchBtcSpot } = await import('@/shared/services/priceApi.js');
        const spot = await fetchBtcSpot();
        if (!active || !spot || !Number.isFinite(spot.usd) || spot.usd <= 0) return;

        const now = Date.now();
        const nextSamples = [...marketSamplesRef.current, { ts: now, usd: spot.usd }]
          .filter((sample) => now - sample.ts <= MARKET_AUDIO_HISTORY_MS)
          .slice(-120);

        marketSamplesRef.current = nextSamples;
        setMarketAudioSpot(spot);
        setMarketAudioMood(classifyMarketAudioMood(spot, nextSamples));
      } catch {
        // Keep previous soundtrack state if spot refresh fails.
      }
    };

    loadMarketAudioState();
    const timer = setInterval(loadMarketAudioState, MARKET_AUDIO_POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [marketAudioReady]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!donateOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setDonateOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [donateOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const marketAudioTheme = MARKET_AUDIO_THEMES[marketAudioMood] || MARKET_AUDIO_THEMES.stable;
  const activeTrackSrc = MARKET_AUDIO_TRACKS[marketAudioMood] || MARKET_AUDIO_TRACKS.stable;
  const marketAudioChangeLabel = Number.isFinite(marketAudioSpot?.change24h)
    ? `${marketAudioSpot.change24h >= 0 ? '+' : ''}${marketAudioSpot.change24h.toFixed(2)}% 24h`
    : 'Waiting for BTC trend';
  const marketAudioAriaLabel = isPlaying
    ? `Pause market soundtrack. ${marketAudioTheme.label}. ${marketAudioChangeLabel}.`
    : `Play market soundtrack. ${marketAudioTheme.label}. ${marketAudioChangeLabel}.`;

  useEffect(() => {
    const audio = marketAudioRef.current;
    if (!audio || !marketAudioReady) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }

    audio.loop = true;
    audio.volume = 1;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setIsPlaying(false);
      });
    }
  }, [activeTrackSrc, isPlaying, marketAudioReady]);

  return (
    <main className="player-shell relative h-dvh w-screen overflow-hidden bg-[color:var(--bg-primary)]">
      <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
        <audio
          key={activeTrackSrc}
          ref={marketAudioRef}
          src={activeTrackSrc}
          loop
          preload="none"
        />
      </div>

      {/* ── TOP BAR ── */}
      <div className="absolute inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0d0d0d]/95 px-3 backdrop-blur-sm sm:h-14 sm:px-4 lg:h-12 lg:px-5" style={{ paddingTop: 'var(--safe-top)', paddingLeft: 'max(0.75rem, calc(var(--safe-left) + 0.5rem))', paddingRight: 'max(0.75rem, calc(var(--safe-right) + 0.5rem))', minHeight: 'calc(3.5rem + var(--safe-top))' }}>
        {/* Project logo */}
        <button
          type="button"
          onClick={goToHomeModule}
          className="flex h-10 cursor-pointer items-center rounded px-1 py-0.5 transition hover:opacity-90"
          aria-label="Go to first module"
        >
          <img
            src="/logo.svg"
            alt="Satoshi Dashboard"
            width="8682"
            height="1558"
            fetchPriority="high"
            decoding="async"
            className="h-6 w-auto max-w-[110px] drop-shadow-[0_0_10px_rgba(245,136,13,0.35)] sm:h-7 sm:max-w-[120px]"
          />
        </button>

        {/* Right: LIVE + clock + fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setDonateOpen(true)}
            className="flex min-h-[40px] items-center gap-1 rounded-[3px] px-2.5 py-[6px] font-mono text-[11px] font-black tracking-[0.14em] transition hover:opacity-80 sm:min-h-[36px]"
            style={{ background: 'var(--accent-warning)', color: '#111111' }}
          >
            ♥ DONATE
          </button>
            <div className="flex min-h-[40px] items-center gap-1.5 rounded-[3px] bg-white px-2.5 py-[6px] sm:min-h-[36px]">
            <div className="h-[7px] w-[7px] animate-pulse rounded-full bg-green-500" />
            <span className="text-[11px] font-black tracking-[0.18em] text-black">LIVE</span>
          </div>
          <div className="hidden md:block">
            <LiveClock />
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white/80"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* ── MODULE CONTENT ── */}
      <div className="h-full w-full pb-[68px] sm:pb-16 lg:pb-10" style={{ paddingTop: 'calc(3.5rem + var(--safe-top))', paddingBottom: 'calc(4.25rem + var(--safe-bottom))' }}>
        <div
          ref={contentScrollRef}
          className={`scrollbar-hidden-mobile relative flex h-full min-h-0 flex-col ${useResponsiveScroll ? 'overflow-y-auto' : 'overflow-hidden'} lg:overflow-hidden`}
        >
          {showAbsoluteMetaCard && (
            <SharedMetaAbsoluteCard
              cadenceLabel={cadenceLabel}
              metaLastAt={metaLastAt}
              providers={moduleMeta.providers}
              renderProviderLinks={renderProviderLinks}
            />
          )}

          {showTopMeta && (
            <SharedMetaTopStrip
              cadenceLabel={cadenceLabel}
              metaLastAt={metaLastAt}
              providers={moduleMeta.providers}
              renderProviderLinks={renderProviderLinks}
              title={stripTitle}
              hideMeta={isResponsiveViewport}
            />
          )}
          <div className={`relative min-h-0 ${useResponsiveScroll ? 'min-h-full flex-none' : 'flex-1'}`}>
            {hasBlockingOverlay ? (
              <Suspense fallback={<ModuleContentFallback title={module.title} />}>
                <BlockedPreviewPoster title={module.title} onOpenDonate={() => setDonateOpen(true)} />
              </Suspense>
            ) : (
              <Suspense fallback={<ModuleContentFallback title={module.title} />}>
                <Component onOpenDonate={() => setDonateOpen(true)} />
              </Suspense>
            )}
            {hasBlockingOverlay && (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center"
                style={{
                  backdropFilter: 'blur(8px) saturate(130%)',
                  WebkitBackdropFilter: 'blur(8px) saturate(130%)',
                  background: 'rgba(6, 6, 10, 0.32)',
                }}
              >
                <div
                  className="flex flex-col items-center gap-4 rounded-2xl px-10 py-9 text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.055)',
                    border: '1px solid rgba(255, 255, 255, 0.11)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <Hammer size={26} style={{ color: 'var(--accent-bitcoin)', opacity: 0.85 }} />
                  <div>
                    <div
                      className="font-bold text-white tracking-widest uppercase"
                      style={{ fontSize: 'var(--fs-tag)', letterSpacing: '0.22em' }}
                    >
                      Under Construction
                    </div>
                    <div
                      className="mt-1"
                      style={{ fontSize: 'var(--fs-micro)', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}
                    >
                      Coming soon
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showBottomMeta && (
            <SharedMetaBottomStrip
              cadenceLabel={cadenceLabel}
              metaLastAt={metaLastAt}
              providers={moduleMeta.providers}
              renderProviderLinks={renderProviderLinks}
              title={stripTitle}
            />
          )}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="absolute inset-x-0 bottom-0 z-40 flex h-[68px] items-center justify-between border-t border-white/[0.06] bg-[#0d0d0d]/95 px-3 backdrop-blur-sm sm:h-16 sm:px-4 lg:h-10 lg:px-5" style={{ paddingBottom: 'var(--safe-bottom)', paddingLeft: 'max(0.75rem, calc(var(--safe-left) + 0.5rem))', paddingRight: 'max(0.75rem, calc(var(--safe-right) + 0.5rem))', minHeight: 'calc(4.25rem + var(--safe-bottom))' }}>
        {/* Play / Pause */}
        <button
          type="button"
          onClick={() => {
            setMarketAudioReady(true);
            setIsPlaying((v) => !v);
          }}
            className="flex h-11 w-11 items-center justify-center rounded-full border transition duration-300 hover:scale-[1.03] sm:h-10 sm:w-10 lg:h-7 lg:w-7"
          style={{
            color: marketAudioTheme.color,
            borderColor: marketAudioTheme.borderColor,
            boxShadow: isPlaying ? marketAudioTheme.glow : 'none',
            background: isPlaying ? 'rgba(255,255,255,0.04)' : 'transparent',
          }}
          aria-label={marketAudioAriaLabel}
          title={marketAudioAriaLabel}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Branding */}
        <Link
          to={SEO_HUB_PATH}
          onClick={onOpenLanding}
          onMouseEnter={preloadSeoHubRoute}
          onFocus={preloadSeoHubRoute}
          className="absolute left-1/2 top-1/2 hidden max-w-[34vw] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center tracking-[0.18em] text-white/56 transition-colors hover:text-white/80 sm:flex lg:max-w-none"
          style={{ fontSize: 'var(--fs-tag)' }}
          aria-label="Open landing page"
        >
          satoshi-dashboard
        </Link>

        {/* Pagination */}
        <div className="flex items-center gap-1.5 text-white/50 sm:gap-2">
          <button
            type="button"
            onClick={() => goToModule(currentIndex - 1, { action: 'previous', surface: 'pagination' })}
            onMouseEnter={() => preloadModuleDirection(currentIndex - 1)}
            onFocus={() => preloadModuleDirection(currentIndex - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-white/35 hover:text-white sm:h-9 sm:w-9 lg:h-7 lg:w-7 lg:border-0"
            aria-label="Previous module"
          >
            <SkipBack size={16} />
          </button>
          <span className="min-w-[4.4rem] text-center font-mono text-[14px] tabular-nums text-white/70 sm:text-[13px] lg:min-w-[3.5rem] lg:text-[12px]">
            {footerPage}&nbsp;/&nbsp;{footerTotal}
          </span>
          <button
            type="button"
            onClick={() => goToModule(currentIndex + 1, { action: 'next', surface: 'pagination' })}
            onMouseEnter={() => preloadModuleDirection(currentIndex + 1)}
            onFocus={() => preloadModuleDirection(currentIndex + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-white/35 hover:text-white sm:h-9 sm:w-9 lg:h-7 lg:w-7 lg:border-0"
            aria-label="Next module"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {/* ── DONATE MODAL ── */}
      {donateOpen && (
        <Suspense fallback={null}>
          <ModuleDonateModal
            donateCopied={donateCopied}
            donationAddress={DONATION_ADDRESS}
            onClose={() => setDonateOpen(false)}
            onCopyDonation={onCopyDonation}
          />
        </Suspense>
      )}
    </main>
  );
}
