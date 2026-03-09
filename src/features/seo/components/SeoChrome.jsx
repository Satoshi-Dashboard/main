import { Link, NavLink } from 'react-router-dom';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: SEO_HUB_PATH, label: 'Landing' },
  { to: SEO_BLOG_PATH, label: 'Blog' },
];

function navClassName({ isActive }) {
  return [
    'border-b pb-1 text-[12px] tracking-[0.16em] uppercase transition',
    isActive
      ? 'border-[color:var(--accent-bitcoin)] text-white'
      : 'border-transparent text-white/56 hover:text-white',
  ].join(' ');
}

export default function SeoChrome({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[color:var(--text-primary)]">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <header className="border-b border-white/8 py-5 sm:py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Link to="/" className="inline-flex items-center gap-3 text-white transition hover:opacity-90">
                <img src="/logo.svg" alt="Satoshi Dashboard" className="h-8 w-auto" />
                <span className="font-mono text-[13px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)]">
                  Satoshi Dashboard
                </span>
              </Link>
              <p className="max-w-2xl text-[14px] leading-7 text-white/58 sm:text-[15px]">
                A minimal editorial layer for search traffic, product context, and article discovery.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-5">
              {NAV_LINKS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClassName} end={item.to === '/'}>
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

            <div className="flex flex-wrap gap-5 text-[12px] uppercase tracking-[0.16em] text-white/58">
              <Link to="/" className="transition hover:text-white">Open dashboard</Link>
              <Link to={SEO_HUB_PATH} className="transition hover:text-white">Open landing</Link>
              <Link to={SEO_BLOG_PATH} className="transition hover:text-white">Read blog</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
