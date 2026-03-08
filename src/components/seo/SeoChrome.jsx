import { Link, NavLink } from 'react-router-dom';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '../../config/seoContent';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: SEO_HUB_PATH, label: 'SEO Hub' },
  { to: SEO_BLOG_PATH, label: 'Blog' },
];

function navClassName({ isActive }) {
  return [
    'rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition sm:text-[12px]',
    isActive
      ? 'border-[color:var(--border-active)] bg-[rgba(247,147,26,0.14)] text-[color:var(--accent-bitcoin)]'
      : 'border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white',
  ].join(' ');
}

export default function SeoChrome({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090d] text-[color:var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(247,147,26,0.2),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />

      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0b0b10]/85 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-white transition-opacity hover:opacity-90">
            <img src="/logo.svg" alt="Satoshi Dashboard" className="h-7 w-auto sm:h-8" />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[11px]">
                Satoshi Dashboard
              </div>
              <div className="font-mono text-[11px] text-white/55 sm:text-[12px]">SEO Hub & editorial routes</div>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClassName} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">{children}</main>

      <footer className="relative border-t border-white/8 bg-[#0b0b10]/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
              Organic acquisition flow
            </div>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-white/68 sm:text-[14px]">
              These pages target informational and conversational Bitcoin searches, then route qualified traffic back to the live dashboard and modules.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-full border border-[color:var(--border-active)] bg-[rgba(247,147,26,0.14)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.2)] sm:text-[12px]"
            >
              Open live dashboard
            </Link>
            <Link
              to={SEO_BLOG_PATH}
              className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/72 transition hover:border-white/20 hover:text-white sm:text-[12px]"
            >
              Read the blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
