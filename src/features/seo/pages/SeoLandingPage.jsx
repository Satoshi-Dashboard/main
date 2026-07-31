import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SeoChrome from '@/features/seo/components/SeoChrome.jsx';
import {
  SeoEyebrow,
  SeoRoutePill,
  SeoSectionIntro,
} from '@/features/seo/components/SeoPrimitives.jsx';
import { FIRST_MODULE, getModulePath } from '@/features/module-registry/modules.js';
import {
  BLOG_POSTS,
  SEO_HUB_FAQS,
  SEO_KEYWORD_ROWS,
  SEO_QUESTION_ROWS,
} from '@/features/seo/content/seoContent.js';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL, usePageSEO } from '@/shared/hooks/usePageSEO.js';
import { AppSection, SurfaceCard } from '@/shared/components/layout/AppLayout.jsx';
import { trackLandingCtaClick, trackLandingViewed } from '@/shared/lib/analytics.js';

const LANDING_TITLE = 'Satoshi Dashboard Landing Page | Bitcoin Price, Nodes, Tools and Blog';
const LANDING_DESCRIPTION = 'A minimal landing page and editorial index for Satoshi Dashboard, built to explain the product, surface high-intent Bitcoin topics, and route visitors into the live dashboard.';
const LANDING_KEYWORDS = [
  'free bitcoin dashboard',
  'bitcoin landing page',
  'bitcoin nodes map',
  'bitcoin analytics tools',
  'bitcoin blog',
  'live bitcoin price',
];

const HIGHLIGHTS = [
  {
    label: 'Root dashboard',
    title: 'Live market view',
    copy: 'Open the main dashboard directly at the root URL with no redirect layer in between.',
    to: '/',
  },
  {
    label: 'Nodes module',
    title: 'Infrastructure visibility',
    copy: 'Surface decentralization, node distribution, and network footprint with one direct module route.',
    to: getModulePath('S06'),
  },
  {
    label: 'Merchant module',
    title: 'Adoption and POS context',
    copy: 'Connect merchant discovery, Bitcoin payments, and Lightning research from one starting point.',
    to: getModulePath('S08'),
  },
  {
    label: 'Editorial index',
    title: 'Topic-led entry paths',
    copy: 'Use blog articles to capture broad search intent, then move readers into live product flows.',
    to: SEO_BLOG_PATH,
  },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: SEO_HUB_FAQS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const WEB_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Satoshi Dashboard landing page',
  url: absoluteUrl(SEO_HUB_PATH),
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  isAccessibleForFree: true,
  description: LANDING_DESCRIPTION,
};

const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Satoshi Dashboard',
  url: `${SITE_URL}/`,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  isAccessibleForFree: true,
  description: 'Free Bitcoin analytics platform with live price, mempool, nodes, merchant maps, Lightning metrics, and long-term market indicators.',
};

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Dashboard', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Landing', item: absoluteUrl(SEO_HUB_PATH) },
  ],
};

function RouteDetail({ body, label, route }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">{label}</div>
      <div className="text-safe-wrap mt-2 font-mono text-[1.05rem] text-white">{route}</div>
      <p className="mt-2 text-safe-wrap text-[14px] leading-7 text-white/56">{body}</p>
    </div>
  );
}

export default function SeoLandingPage() {
  usePageSEO({
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    canonicalPath: SEO_HUB_PATH,
    keywords: LANDING_KEYWORDS,
    image: DEFAULT_OG_IMAGE,
    imageAlt: 'Satoshi Dashboard landing page and blog',
    schema: [WEB_APP_SCHEMA, SOFTWARE_SCHEMA, FAQ_SCHEMA, BREADCRUMB_SCHEMA],
  });

  useEffect(() => {
    trackLandingViewed({ path: SEO_HUB_PATH });
  }, []);

  return (
    <SeoChrome>
      <AppSection className="pt-0">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_280px]">
          <div className="min-w-0 max-w-4xl">
            <SeoEyebrow>Landing page</SeoEyebrow>
            <h1 className="mt-4 text-safe-wrap font-mono text-[clamp(1.9rem,9vw,3rem)] leading-[1.02] text-white sm:text-[clamp(2.3rem,6vw,5rem)]">
              A quieter way to explain the dashboard, the blog, and the Bitcoin tools behind them.
            </h1>
            <p className="mt-6 max-w-3xl text-safe-wrap text-[16px] leading-8 text-white/68 sm:text-[18px]">
              This page exists as a clean editorial front door. It explains what Satoshi Dashboard is, why the product has supporting articles, and where visitors should go next if they care about live Bitcoin price, nodes, mempool pressure, merchant adoption, or free analysis tools.
            </p>
            <p className="mt-5 max-w-3xl text-safe-wrap text-[15px] leading-8 text-white/60 sm:text-[16px]">
              The main product still lives at the root URL. The landing page and blog simply give broader search traffic a calmer entry point before moving people into the live dashboard or a specific module.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <SeoRoutePill
                to={getModulePath(FIRST_MODULE)}
                tone="accent"
                onClick={() => trackLandingCtaClick({ label: 'Open dashboard', destination: getModulePath(FIRST_MODULE), section: 'hero-cta' })}
              >
                Open dashboard
              </SeoRoutePill>
              <SeoRoutePill
                to={SEO_BLOG_PATH}
                onClick={() => trackLandingCtaClick({ label: 'Open blog', destination: SEO_BLOG_PATH, section: 'hero-cta' })}
              >
                Open blog
              </SeoRoutePill>
            </div>
          </div>

          <aside className="space-y-6 border-t border-white/8 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <RouteDetail
              label="Primary path"
              route="`/`"
              body="The canonical dashboard route, now served directly with no redirect."
            />
            <RouteDetail
              label="Landing route"
              route={`\`${SEO_HUB_PATH}\``}
              body="A dedicated landing page for product context, search intent mapping, and internal distribution."
            />
            <RouteDetail
              label="Editorial route"
              route={`\`${SEO_BLOG_PATH}\``}
              body="A simple article index for price, nodes, merchant, and Bitcoin tool explainers."
            />
          </aside>
        </div>
      </AppSection>

      <AppSection className="py-0">
        <div className="grid gap-0 lg:grid-cols-2">
          {HIGHLIGHTS.map((item, index) => (
            <Link
              key={item.title}
              to={item.to}
              onClick={() => trackLandingCtaClick({ label: item.title, destination: item.to, section: 'highlights' })}
              className={[
                'group min-w-0 border-white/8 py-7 transition',
                index % 2 === 0 ? 'lg:border-r lg:pr-10' : 'lg:pl-10',
                index < 2 ? 'border-b lg:pb-10' : 'pt-10',
              ].join(' ')}
            >
              <SeoEyebrow className="tracking-[0.18em]">{item.label}</SeoEyebrow>
              <h2 className="mt-3 text-safe-wrap font-mono text-[1.45rem] text-white transition group-hover:text-[color:var(--accent-bitcoin)]">
                {item.title}
              </h2>
              <p className="mt-4 max-w-xl text-safe-wrap text-[15px] leading-8 text-white/62">{item.copy}</p>
            </Link>
          ))}
        </div>
      </AppSection>

      <AppSection>
        <SeoSectionIntro
          kicker="Positioning"
          title="The landing page explains the system. The dashboard proves it. The blog expands it."
          body="That is the structure now. The root handles product truth, the landing handles orientation, and the blog handles broader thematic entry points. It is a cleaner split for branding, SEO, and AI-readable discovery."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-5 text-[15px] leading-8 text-white/64 sm:text-[16px]">
            <p>
              A landing page should not feel like a cramped marketing block. It should read like a briefing page. That is why this version stays minimal: more space, more typography, fewer decorative cards, and clearer transitions between overview, keyword mapping, user questions, and the article layer.
            </p>
            <p>
              The visual goal is close to an editorial product release page, but adapted to the dashboard aesthetic. The background stays black, the typography stays restrained, and the orange brand token only appears where it helps orientation. The result is still on-brand, but less heavy and easier to scan.
            </p>
            <p>
              From an acquisition standpoint, the page is also easier to understand. Visitors can immediately tell the difference between the main product, the explanatory landing page, and the blog that supports it. That reduces brand confusion and lowers the chance that secondary pages compete with the dashboard for navigational intent.
            </p>
          </div>

          <div className="space-y-6 border-t border-white/8 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Signal 01</div>
              <p className="mt-2 text-safe-wrap text-[15px] leading-8 text-white/62">Brand intent resolves to `/`.</p>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Signal 02</div>
              <p className="mt-2 text-safe-wrap text-[15px] leading-8 text-white/62">The landing page at `{SEO_HUB_PATH}` handles explanation and navigation.</p>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Signal 03</div>
              <p className="mt-2 text-safe-wrap text-[15px] leading-8 text-white/62">The blog captures broader question-based discovery without replacing the product.</p>
            </div>
          </div>
        </div>
      </AppSection>

      <AppSection>
        <SeoSectionIntro
          kicker="Keyword map"
          title="A compact keyword table for product, tool, and conversational intent"
          body="The Spanish keyword phrases stay here intentionally because they help capture search demand. The surrounding explanatory copy remains in English so the interface keeps one primary language."
        />

        <div className="mt-10 hidden overflow-x-auto pb-1 md:block">
          <table className="min-w-full border-collapse text-left text-[13px] sm:text-[14px]">
            <thead>
              <tr className="border-b border-white/8 text-[11px] uppercase tracking-[0.18em] text-white/40">
                <th className="px-0 py-4 pr-6">Category</th>
                <th className="px-0 py-4 pr-6">Keyword</th>
                <th className="px-0 py-4 pr-6">Language</th>
                <th className="px-0 py-4 pr-6">Intent</th>
                <th className="px-0 py-4">Destination</th>
              </tr>
            </thead>
            <tbody>
              {SEO_KEYWORD_ROWS.map((row) => (
                <tr key={row.keyword} className="border-b border-white/6 align-top text-white/62">
                  <td className="px-0 py-4 pr-6">{row.category}</td>
                  <td className="px-0 py-4 pr-6 text-safe-wrap text-white">{row.keyword}</td>
                  <td className="px-0 py-4 pr-6">{row.language}</td>
                  <td className="px-0 py-4 pr-6">{row.intent}</td>
                  <td className="px-0 py-4">
                    <Link to={row.pagePath} className="text-[color:var(--accent-bitcoin)] transition hover:text-white">
                      {row.pageLabel}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-3 md:hidden">
          {SEO_KEYWORD_ROWS.map((row) => (
            <SurfaceCard key={row.keyword} className="p-4">
              <SeoEyebrow className="tracking-[0.18em]">{row.category}</SeoEyebrow>
              <div className="mt-2 text-safe-wrap text-[15px] leading-7 text-white">{row.keyword}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] text-white/60">
                <div className="min-w-0">
                  <div className="text-white/35">Language</div>
                  <div className="text-safe-wrap">{row.language}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-white/35">Intent</div>
                  <div className="text-safe-wrap">{row.intent}</div>
                </div>
              </div>
              <SeoRoutePill to={row.pagePath} tone="accent" className="mt-4 w-full">
                {row.pageLabel}
              </SeoRoutePill>
            </SurfaceCard>
          ))}
        </div>
      </AppSection>

      <AppSection>
        <SeoSectionIntro
          kicker="Questions"
          title="Fifteen user questions that should route cleanly into the right page"
          body="These are the kinds of prompts users type into Google, ChatGPT, Perplexity, and Gemini. The point of the landing layer is to make those paths explicit."
        />

        <div className="mt-10 space-y-4">
          {SEO_QUESTION_ROWS.map((item) => (
            <div key={item.question} className="grid gap-2 border-b border-white/6 py-4 md:grid-cols-[160px_minmax(0,1fr)_220px] md:gap-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">{item.intent}</div>
              <div className="text-safe-wrap text-[15px] leading-8 text-white/74">{item.question}</div>
              <Link to={item.pagePath} className="text-safe-wrap text-[14px] leading-8 text-[color:var(--accent-bitcoin)] transition hover:text-white">
                {item.pageLabel}
              </Link>
            </div>
          ))}
        </div>
      </AppSection>

      <AppSection>
        <SeoSectionIntro
          kicker="FAQ"
          title="Direct answers for snippet-style discovery"
          body="These answers stay concise on purpose so they can be extracted, summarized, and understood quickly by both humans and answer engines."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {SEO_HUB_FAQS.map((item) => (
            <article key={item.question} className="border-t border-white/8 pt-5">
              <h3 className="text-safe-wrap font-mono text-[1.05rem] text-white">{item.question}</h3>
              <p className="mt-3 text-safe-wrap text-[15px] leading-8 text-white/62">{item.answer}</p>
            </article>
          ))}
        </div>
      </AppSection>

      <AppSection className="border-b-0 pb-0">
        <SeoSectionIntro
          kicker="Blog"
          title="A restrained article index instead of a noisy content grid"
          body="The blog should feel like a continuation of the landing page, not a different product. Each article is positioned as a simple entry route into a live module or the root dashboard."
        />

        <div className="mt-10 divide-y divide-white/8 border-t border-white/8">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="grid gap-6 py-7 lg:grid-cols-[190px_minmax(0,1fr)_180px] lg:items-start">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">
                <div>{post.publishedDate}</div>
                <div className="mt-2">{post.readTime}</div>
              </div>
              <div className="min-w-0">
                <h3 className="text-safe-wrap font-mono text-[1.3rem] text-white">{post.title}</h3>
                <p className="mt-3 max-w-3xl text-safe-wrap text-[15px] leading-8 text-white/62">{post.excerpt}</p>
              </div>
              <div className="flex items-start lg:justify-end">
                <Link to={`${SEO_BLOG_PATH}/${post.slug}`} className="border-b border-[color:var(--accent-bitcoin)] pb-1 text-[12px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:text-white">
                  Read article
                </Link>
              </div>
            </article>
          ))}
        </div>
      </AppSection>
    </SeoChrome>
  );
}
