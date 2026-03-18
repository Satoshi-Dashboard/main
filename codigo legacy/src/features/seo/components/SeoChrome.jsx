import { Link, NavLink } from 'react-router-dom';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import { trackSeoNavigationClick } from '@/shared/lib/analytics.js';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: SEO_HUB_PATH, label: 'Landing' },
  { to: SEO_BLOG_PATH, label: 'Blog' },
];

function navClassName({ isActive }) {
  return [
    'inline-flex min-h-[42px] items-center rounded-full border px-4 py-2 text-[12px] tracking-[0.16em] uppercase transition sm:min-h-[38px]',
    isActive
      ? 'border-[color:var(--accent-bitcoin)] bg-[rgba(247,147,26,0.08)] text-white'
      : 'border-white/10 text-white/56 hover:border-white/20 hover:text-white',
  ].join(' ');
}

export default function SeoChrome({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[color:var(--text-primary)]">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8" style={{ paddingLeft: 'max(1.25rem, calc(var(--safe-left) + 1rem))', paddingRight: 'max(1.25rem, calc(var(--safe-right) + 1rem))' }}>
        <header className="border-b border-white/8 py-5 sm:py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Link
                to="/"
                onClick={() => trackSeoNavigationClick({ label: 'Satoshi Dashboard', destination: '/', surface: 'seo-header-logo' })}
                className="inline-flex items-center gap-3 text-white transition hover:opacity-90"
              >
                <img src="/logo.svg" alt="Satoshi Dashboard" width="8682" height="1558" decoding="async" className="h-8 w-auto" />
                <span className="font-mono text-[13px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)]">
                  Satoshi Dashboard
                </span>
              </Link>
              <p className="max-w-2xl text-[14px] leading-7 text-white/58 sm:text-[15px]">
                A minimal editorial layer for search traffic, product context, and article discovery.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-3 sm:gap-4">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navClassName}
                  end={item.to === '/'}
                  onClick={() => trackSeoNavigationClick({ label: item.label, destination: item.to, surface: 'seo-header-nav' })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="py-10 sm:py-12 lg:py-14">{children}</main>

        <footer className="border-t border-white/8 py-6 sm:py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)]">
                Editorial routes
              </div>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/54 sm:text-[14px]">
                Clean pages for discovery, then direct paths back into the live Bitcoin dashboard and modules.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[12px] uppercase tracking-[0.16em] text-white/58 sm:gap-4">
              <Link to="/" onClick={() => trackSeoNavigationClick({ label: 'Open dashboard', destination: '/', surface: 'seo-footer-nav' })} className="inline-flex min-h-[42px] items-center rounded-full border border-white/10 px-4 py-2 transition hover:border-white/20 hover:text-white">Open dashboard</Link>
              <Link to={SEO_HUB_PATH} onClick={() => trackSeoNavigationClick({ label: 'Open landing', destination: SEO_HUB_PATH, surface: 'seo-footer-nav' })} className="inline-flex min-h-[42px] items-center rounded-full border border-white/10 px-4 py-2 transition hover:border-white/20 hover:text-white">Open landing</Link>
              <Link to={SEO_BLOG_PATH} onClick={() => trackSeoNavigationClick({ label: 'Read blog', destination: SEO_BLOG_PATH, surface: 'seo-footer-nav' })} className="inline-flex min-h-[42px] items-center rounded-full border border-white/10 px-4 py-2 transition hover:border-white/20 hover:text-white">Read blog</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
