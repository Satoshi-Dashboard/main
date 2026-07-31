import { useEffect, useState } from 'react';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Play from 'lucide-react/dist/esm/icons/play';
import SkipBack from 'lucide-react/dist/esm/icons/skip-back';
import SkipForward from 'lucide-react/dist/esm/icons/skip-forward';
import { Link } from 'react-router-dom';
import { SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import { cx } from '@/shared/utils/cx.js';

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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

function chromePaddingStyle(kind) {
  if (kind === 'top') {
    return {
      paddingTop: 'var(--safe-top)',
      paddingLeft: 'max(0.75rem, calc(var(--safe-left) + 0.5rem))',
      paddingRight: 'max(0.75rem, calc(var(--safe-right) + 0.5rem))',
      minHeight: 'calc(3.5rem + var(--safe-top))',
    };
  }

  return {
    paddingBottom: 'var(--safe-bottom)',
    paddingLeft: 'max(0.75rem, calc(var(--safe-left) + 0.5rem))',
    paddingRight: 'max(0.75rem, calc(var(--safe-right) + 0.5rem))',
    minHeight: 'calc(4.25rem + var(--safe-bottom))',
  };
}

export function PlayerTopBar({
  isFullscreen,
  onGoHome,
  onOpenDonate,
  onToggleFullscreen,
}) {
  return (
    <header
      className="absolute inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#0d0d0d]/95 backdrop-blur-sm"
      style={chromePaddingStyle('top')}
    >
      <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:h-14 sm:gap-4 lg:h-12">
        <button
          type="button"
          onClick={onGoHome}
          className="flex h-10 min-w-0 cursor-pointer items-center rounded px-1 py-0.5 transition hover:opacity-90"
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

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenDonate}
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
            onClick={onToggleFullscreen}
            className="hidden h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white/80 lg:flex"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function PlayerBottomBar({
  currentLabel,
  isPlaying,
  marketAudioAriaLabel,
  marketAudioTheme,
  onNext,
  onOpenLanding,
  onPrevious,
  onPreloadLanding,
  onPreloadNext,
  onPreloadPrevious,
  onTogglePlayback,
  totalLabel,
}) {
  return (
    <footer
      className="absolute inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0d0d0d]/95 backdrop-blur-sm"
      style={chromePaddingStyle('bottom')}
    >
      <div className="grid h-[68px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:h-16 sm:gap-3 lg:h-10">
        <button
          type="button"
          onClick={onTogglePlayback}
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

        <div className="flex min-w-0 justify-center px-1">
          <Link
            to={SEO_HUB_PATH}
            onClick={onOpenLanding}
            onMouseEnter={onPreloadLanding}
            onFocus={onPreloadLanding}
            className={cx(
              'hidden min-w-0 items-center justify-center text-center tracking-[0.18em] text-white/56 transition-colors hover:text-white/80 sm:inline-flex',
              'max-w-full truncate text-[var(--fs-tag)]',
            )}
            aria-label="Open landing page"
          >
            satoshi-dashboard
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 text-white/50 sm:gap-2">
          <button
            type="button"
            onClick={onPrevious}
            onMouseEnter={onPreloadPrevious}
            onFocus={onPreloadPrevious}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-white/35 hover:text-white sm:h-9 sm:w-9 lg:h-7 lg:w-7 lg:border-0"
            aria-label="Previous module"
          >
            <SkipBack size={16} />
          </button>

          <span className="min-w-[4.4rem] text-center font-mono text-[14px] tabular-nums text-white/70 sm:text-[13px] lg:min-w-[3.5rem] lg:text-[12px]">
            {currentLabel}&nbsp;/&nbsp;{totalLabel}
          </span>

          <button
            type="button"
            onClick={onNext}
            onMouseEnter={onPreloadNext}
            onFocus={onPreloadNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition hover:border-white/35 hover:text-white sm:h-9 sm:w-9 lg:h-7 lg:w-7 lg:border-0"
            aria-label="Next module"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}
