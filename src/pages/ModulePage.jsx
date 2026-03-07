import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MODULES, MODULES_BY_SLUG } from '../config/modules';
import { getModuleDataMeta } from '../config/moduleDataMeta';

const AUTOPLAY_MS = 9000;

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
      <a
        href={provider.url}
        target="_blank"
        rel="noreferrer"
        className="text-[#F7931A] underline-offset-2 hover:underline"
      >
        {provider.name}
      </a>
      {index < providers.length - 1 ? <span className="text-white/45"> + </span> : null}
    </span>
  ));
}

function formatMetaTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return 'N/A';

  const dateStr = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${dateStr}, ${timeStr}`;
}

function getCadenceMs(meta) {
  const seconds = Number(meta?.refreshSeconds);
  if (Number.isFinite(seconds) && seconds > 0) return Math.round(seconds * 1000);

  const minutes = Number(meta?.refreshMinutes);
  if (Number.isFinite(minutes) && minutes > 0) return Math.round(minutes * 60 * 1000);

  return null;
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

export default function ModulePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const currentIndex = useMemo(() => {
    const index = MODULES.findIndex((m) => m.slug === slug);
    return index >= 0 ? index : 0;
  }, [slug]);

  const module = MODULES_BY_SLUG[slug] || MODULES[currentIndex];
  const Component = module.component;

  const footerPage = useMemo(() => String(module.code || '').replace(/^S/i, ''), [module.code]);
  const footerTotal = useMemo(
    () => MODULES.reduce((max, item) => {
      const n = Number(String(item.code || '').match(/\d+/)?.[0] || 0);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0),
    [],
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [metaLastAtMs, setMetaLastAtMs] = useState(() => Date.now());
  const [isResponsiveViewport, setIsResponsiveViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches;
  });
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
  const showTopMeta = showSharedMeta && !isResponsiveViewport && !useAbsoluteSharedMetaCard;
  const showBottomMeta = showSharedMeta && isResponsiveViewport;
  const metaLastAt = new Date(metaLastAtMs);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mobileMedia = window.matchMedia('(max-width: 1023px)');

    const onMobile = (event) => setIsResponsiveViewport(event.matches);

    if (typeof mobileMedia.addEventListener === 'function') {
      mobileMedia.addEventListener('change', onMobile);
      return () => {
        mobileMedia.removeEventListener('change', onMobile);
      };
    }

    mobileMedia.addListener(onMobile);
    return () => {
      mobileMedia.removeListener(onMobile);
    };
  }, []);

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
  }, [slug, isResponsiveViewport]);

  useEffect(() => {
    if (!showSharedMeta || !Number.isFinite(cadenceMs) || cadenceMs <= 0) return undefined;

    const intervalMs = Math.max(1000, cadenceMs);
    const timer = setInterval(() => setMetaLastAtMs(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [showSharedMeta, cadenceMs]);

  useEffect(() => {
    if (!MODULES_BY_SLUG[slug]) {
      navigate(`/module/${MODULES[0].slug}`, { replace: true });
    }
  }, [slug, navigate]);

  const goToModule = useCallback(
    (index) => {
      navigate(`/module/${MODULES[getWrappedIndex(index)].slug}`);
    },
    [navigate],
  );

  const goToHomeModule = useCallback(() => {
    navigate(`/module/${MODULES[0].slug}`);
  }, [navigate]);

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
        goToModule(currentIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToModule(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, goToModule]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setInterval(() => goToModule(currentIndex + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, goToModule]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <main className="player-shell relative h-dvh w-screen overflow-hidden bg-[#111111]">
      {/* ── TOP BAR ── */}
      <div className="absolute inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0d0d0d]/95 px-3 backdrop-blur-sm sm:h-14 sm:px-4 lg:h-12 lg:px-5">
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
            className="h-6 w-auto max-w-[110px] drop-shadow-[0_0_10px_rgba(245,136,13,0.35)] sm:h-7 sm:max-w-[120px]"
          />
        </button>

        {/* Right: LIVE + clock + fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-[3px] bg-white px-2 py-[4px]">
            <div className="h-[7px] w-[7px] animate-pulse rounded-full bg-green-500" />
            <span className="text-[11px] font-black tracking-[0.18em] text-black">LIVE</span>
          </div>
          <div className="hidden md:block">
            <LiveClock />
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white/80"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* ── MODULE CONTENT ── */}
      <div className="h-full w-full pt-14 pb-[68px] sm:pb-16 lg:pt-12 lg:pb-10">
        <div
          ref={contentScrollRef}
          className={`scrollbar-hidden-mobile relative flex h-full min-h-0 flex-col ${showBottomMeta ? 'overflow-y-auto' : 'overflow-hidden'} lg:overflow-hidden`}
        >
          {showAbsoluteMetaCard && (
            <div className="pointer-events-none absolute right-2 top-2 z-30 sm:right-3 sm:top-3 lg:right-4 lg:top-3">
              <div className="pointer-events-auto rounded-md border border-white/10 bg-[#0f0f0f]/88 px-3 py-2 text-right font-mono text-[11px] tracking-wide text-[#9a9a9a] shadow-[0_8px_28px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:text-[12px]">
                <div>
                  <span>src: </span>
                  {renderProviderLinks(moduleMeta.providers)}
                </div>
                <div>Auto update: {cadenceLabel}</div>
                <div>Last: {formatMetaTimestamp(metaLastAt)}</div>
              </div>
            </div>
          )}

          {showTopMeta && (
            <div className="flex flex-none justify-end px-2 py-1 sm:px-3 lg:px-4">
              <div className="text-right font-mono text-[11px] tracking-wide text-[#7c7c7c]">
                <div>
                  <span>src: </span>
                  {renderProviderLinks(moduleMeta.providers)}
                </div>
                <div>Auto update: {cadenceLabel}</div>
                <div>Last: {formatMetaTimestamp(metaLastAt)}</div>
              </div>
            </div>
          )}
          <div className={`min-h-0 ${showBottomMeta ? 'min-h-full flex-none' : 'flex-1'}`}>
            <Component />
          </div>

          {showBottomMeta && (
            <div className="flex flex-none justify-end px-3 pb-24 pt-3 sm:px-4">
              <div className="text-right font-mono text-[11px] tracking-wide text-[#7c7c7c]">
                <div>
                  <span>src: </span>
                  {renderProviderLinks(moduleMeta.providers)}
                </div>
                <div>Auto update: {cadenceLabel}</div>
                <div>Last: {formatMetaTimestamp(metaLastAt)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="absolute inset-x-0 bottom-0 z-40 flex h-[68px] items-center justify-between border-t border-white/[0.06] bg-[#0d0d0d]/95 px-3 backdrop-blur-sm sm:h-16 sm:px-4 lg:h-10 lg:px-5">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={() => setIsPlaying((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-[#F7931A]/60 hover:text-[#F7931A] sm:h-10 sm:w-10 lg:h-7 lg:w-7"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Branding */}
        <span className="hidden text-[11px] tracking-[0.2em] text-white/20 lg:block">satoshi-dashboard</span>

        {/* Pagination */}
        <div className="flex items-center gap-1.5 text-white/50 sm:gap-2">
          <button
            type="button"
            onClick={() => goToModule(currentIndex - 1)}
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
            onClick={() => goToModule(currentIndex + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-white/35 hover:text-white sm:h-9 sm:w-9 lg:h-7 lg:w-7 lg:border-0"
            aria-label="Next module"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
