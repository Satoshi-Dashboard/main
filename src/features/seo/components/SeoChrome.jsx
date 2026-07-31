import { Link, NavLink } from 'react-router-dom';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import { SeoEyebrow, SeoRoutePill } from '@/features/seo/components/SeoPrimitives.jsx';
import { AppContainer, AppPage } from '@/shared/components/layout/AppLayout.jsx';
import { cx } from '@/shared/utils/cx.js';
import { trackSeoNavigationClick } from '@/shared/lib/analytics.js';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: SEO_HUB_PATH, label: 'Landing' },
  { to: SEO_BLOG_PATH, label: 'Blog' },
];

function navClassName({ isActive }) {
  return cx('seo-route-pill sm:min-h-[38px]', isActive && 'seo-route-pill-active');
}

export default function SeoChrome({ children }) {
  return (
    <AppPage>
      <AppContainer size="wide">
        <header className="border-b border-white/8 py-5 sm:py-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8">
            <div className="min-w-0 space-y-2">
              <Link
                to="/"
                onClick={() => trackSeoNavigationClick({ label: 'Satoshi Dashboard', destination: '/', surface: 'seo-header-logo' })}
                className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-white transition hover:opacity-90"
              >
                <img src="/logo.svg" alt="Satoshi Dashboard" width="8682" height="1558" decoding="async" className="h-8 w-auto max-w-[156px] shrink-0" />
                <span className="text-safe-wrap font-mono text-[11px] leading-tight uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] sm:text-[13px] sm:tracking-[0.22em]">
                  Satoshi Dashboard
                </span>
              </Link>
              <p className="max-w-2xl text-safe-wrap text-[14px] leading-7 text-white/58 sm:text-[15px]">
                A minimal editorial layer for search traffic, product context, and article discovery.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-3 sm:gap-4 md:justify-end">
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
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-8">
            <div className="min-w-0">
              <SeoEyebrow className="tracking-[0.18em]">Editorial routes</SeoEyebrow>
              <p className="mt-2 max-w-2xl text-safe-wrap text-[13px] leading-6 text-white/54 sm:text-[14px]">
                Clean pages for discovery, then direct paths back into the live Bitcoin dashboard and modules.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 md:justify-end">
              <SeoRoutePill
                to="/"
                onClick={() => trackSeoNavigationClick({ label: 'Open dashboard', destination: '/', surface: 'seo-footer-nav' })}
              >
                Open dashboard
              </SeoRoutePill>
              <SeoRoutePill
                to={SEO_HUB_PATH}
                onClick={() => trackSeoNavigationClick({ label: 'Open landing', destination: SEO_HUB_PATH, surface: 'seo-footer-nav' })}
              >
                Open landing
              </SeoRoutePill>
              <SeoRoutePill
                to={SEO_BLOG_PATH}
                onClick={() => trackSeoNavigationClick({ label: 'Read blog', destination: SEO_BLOG_PATH, surface: 'seo-footer-nav' })}
              >
                Read blog
              </SeoRoutePill>
            </div>
          </div>
        </footer>
      </AppContainer>
    </AppPage>
  );
}
