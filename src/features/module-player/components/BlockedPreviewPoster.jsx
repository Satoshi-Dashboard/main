import Hammer from 'lucide-react/dist/esm/icons/hammer';

export default function BlockedPreviewPoster({ title, onOpenDonate }) {
  return (
    <div className="flex h-full w-full flex-col bg-[#111111] px-4 py-5 sm:px-5 lg:px-6">
      <div className="max-w-3xl rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(247,147,26,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(247,147,26,0.22)] bg-[rgba(247,147,26,0.12)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent-bitcoin)]">
          <Hammer size={14} />
          Under Construction
        </div>
        <h2 className="mt-4 font-mono text-[clamp(24px,4vw,42px)] font-bold leading-[0.95] text-white">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl font-mono text-[13px] leading-6 text-white/62 sm:text-[14px]">
          This preview route stays visible in the player, but the heavy chart payload is deferred until the module is ready for interactive review.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 font-mono text-[12px] text-white/58">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Preview route active</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">SEO noindex preserved</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Heavy charts deferred</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenDonate}
            className="rounded-full border border-[rgba(247,147,26,0.28)] bg-[rgba(247,147,26,0.14)] px-4 py-2 font-mono text-[12px] text-[var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.2)]"
          >
            Support development
          </button>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-[12px] text-white/50">
            Full interactive module loads after release
          </div>
        </div>
      </div>

      <div className="mt-5 grid flex-1 min-h-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/[0.06] bg-[#0f0f0f] p-4"
          >
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="skeleton mt-4 h-14 w-full rounded-2xl" />
            <div className="skeleton mt-4 h-4 w-2/3 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
