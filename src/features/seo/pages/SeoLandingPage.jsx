import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SeoChrome from '@/features/seo/components/SeoChrome.jsx';
import { FIRST_MODULE, getModulePath } from '@/features/module-registry/modules.js';
import {
  BLOG_POSTS,
  SEO_HUB_FAQS,
  SEO_KEYWORD_ROWS,
  SEO_QUESTION_ROWS,
} from '@/features/seo/content/seoContent.js';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL, usePageSEO } from '@/shared/hooks/usePageSEO.js';
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

function SectionIntro({ kicker, title, body }) {
  return (
    <div className="mb-8 max-w-3xl">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
        {kicker}
      </div>
      <h2 className="mt-3 font-mono text-[clamp(1.4rem,3vw,2.5rem)] leading-tight text-white">{title}</h2>
      <p className="mt-4 text-[15px] leading-8 text-white/66 sm:text-[16px]">{body}</p>
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
      <section className="grid gap-10 border-b border-white/8 pb-12 lg:grid-cols-[minmax(0,1.2fr)_280px] lg:pb-16">
        <div className="max-w-4xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
            Landing page
          </div>
          <h1 className="mt-4 font-mono text-[clamp(2.3rem,6vw,5rem)] leading-[1.02] text-white">
            A quieter way to explain the dashboard, the blog, and the Bitcoin tools behind them.
          </h1>
          <p className="mt-6 max-w-3xl text-[16px] leading-8 text-white/68 sm:text-[18px]">
            This page exists as a clean editorial front door. It explains what Satoshi Dashboard is, why the product has supporting articles, and where visitors should go next if they care about live Bitcoin price, nodes, mempool pressure, merchant adoption, or free analysis tools.
          </p>
          <p className="mt-5 max-w-3xl text-[15px] leading-8 text-white/60 sm:text-[16px]">
            The main product still lives at the root URL. The landing page and blog simply give broader search traffic a calmer entry point before moving people into the live dashboard or a specific module.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-[12px] uppercase tracking-[0.18em] text-white/66 sm:gap-4">
            <Link
              to={getModulePath(FIRST_MODULE)}
              onClick={() => trackLandingCtaClick({ label: 'Open dashboard', destination: getModulePath(FIRST_MODULE), section: 'hero-cta' })}
              className="inline-flex min-h-[44px] items-center rounded-full border border-[color:var(--accent-bitcoin)] px-4 py-2 text-white transition hover:bg-[rgba(247,147,26,0.08)] hover:text-[color:var(--accent-bitcoin)]"
            >
              Open dashboard
            </Link>
            <Link
              to={SEO_BLOG_PATH}
              onClick={() => trackLandingCtaClick({ label: 'Open blog', destination: SEO_BLOG_PATH, section: 'hero-cta' })}
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-4 py-2 transition hover:border-white/35 hover:text-white"
            >
              Open blog
            </Link>
          </div>
        </div>

        <aside className="space-y-6 border-t border-white/8 pt-8 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Primary path</div>
            <div className="mt-2 font-mono text-[1.05rem] text-white">`/`</div>
            <p className="mt-2 text-[14px] leading-7 text-white/56">The canonical dashboard route, now served directly with no redirect.</p>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Landing route</div>
            <div className="mt-2 font-mono text-[1.05rem] text-white">`{SEO_HUB_PATH}`</div>
            <p className="mt-2 text-[14px] leading-7 text-white/56">A dedicated landing page for product context, search intent mapping, and internal distribution.</p>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Editorial route</div>
            <div className="mt-2 font-mono text-[1.05rem] text-white">`{SEO_BLOG_PATH}`</div>
            <p className="mt-2 text-[14px] leading-7 text-white/56">A simple article index for price, nodes, merchant, and Bitcoin tool explainers.</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-0 border-b border-white/8 py-12 sm:py-14 lg:grid-cols-2 lg:py-16">
        {HIGHLIGHTS.map((item, index) => (
          <Link
            key={item.title}
            to={item.to}
            onClick={() => trackLandingCtaClick({ label: item.title, destination: item.to, section: 'highlights' })}
            className={[
              'group border-white/8 py-7 transition',
              index % 2 === 0 ? 'lg:border-r lg:pr-10' : 'lg:pl-10',
              index < 2 ? 'border-b lg:pb-10' : 'pt-10',
            ].join(' ')}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)]">{item.label}</div>
            <h2 className="mt-3 font-mono text-[1.45rem] text-white transition group-hover:text-[color:var(--accent-bitcoin)]">{item.title}</h2>
            <p className="mt-4 max-w-xl text-[15px] leading-8 text-white/62">{item.copy}</p>
          </Link>
        ))}
      </section>

      <section className="border-b border-white/8 py-12 sm:py-14 lg:py-16">
        <SectionIntro
          kicker="Positioning"
          title="The landing page explains the system. The dashboard proves it. The blog expands it."
          body="That is the structure now. The root handles product truth, the landing handles orientation, and the blog handles broader thematic entry points. It is a cleaner split for branding, SEO, and AI-readable discovery."
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
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
              <p className="mt-2 text-[15px] leading-8 text-white/62">Brand intent resolves to `/`.</p>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Signal 02</div>
              <p className="mt-2 text-[15px] leading-8 text-white/62">The landing page at `{SEO_HUB_PATH}` handles explanation and navigation.</p>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">Signal 03</div>
              <p className="mt-2 text-[15px] leading-8 text-white/62">The blog captures broader question-based discovery without replacing the product.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/8 py-12 sm:py-14 lg:py-16">
        <SectionIntro
          kicker="Keyword map"
          title="A compact keyword table for product, tool, and conversational intent"
          body="The Spanish keyword phrases stay here intentionally because they help capture search demand. The surrounding explanatory copy remains in English so the interface keeps one primary language."
        />

        <div className="hidden overflow-x-auto md:block">
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
                  <td className="px-0 py-4 pr-6 text-white">{row.keyword}</td>
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

        <div className="grid gap-3 md:hidden">
          {SEO_KEYWORD_ROWS.map((row) => (
            <article key={row.keyword} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)]">{row.category}</div>
              <div className="mt-2 text-[15px] leading-7 text-white">{row.keyword}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[13px] text-white/60">
                <div>
                  <div className="text-white/35">Language</div>
                  <div>{row.language}</div>
                </div>
                <div>
                  <div className="text-white/35">Intent</div>
                  <div>{row.intent}</div>
                </div>
              </div>
              <Link to={row.pagePath} className="mt-4 inline-flex min-h-[42px] items-center rounded-full border border-[color:var(--accent-bitcoin)] px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.08)] hover:text-white">
                {row.pageLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-white/8 py-12 sm:py-14 lg:py-16">
        <SectionIntro
          kicker="Questions"
          title="Fifteen user questions that should route cleanly into the right page"
          body="These are the kinds of prompts users type into Google, ChatGPT, Perplexity, and Gemini. The point of the landing layer is to make those paths explicit."
        />

        <div className="space-y-4">
          {SEO_QUESTION_ROWS.map((item) => (
            <div key={item.question} className="grid gap-2 border-b border-white/6 py-4 md:grid-cols-[160px_minmax(0,1fr)_220px] md:gap-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">{item.intent}</div>
              <div className="text-[15px] leading-8 text-white/74">{item.question}</div>
              <Link to={item.pagePath} className="text-[14px] leading-8 text-[color:var(--accent-bitcoin)] transition hover:text-white">
                {item.pageLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-white/8 py-12 sm:py-14 lg:py-16">
        <SectionIntro
          kicker="FAQ"
          title="Direct answers for snippet-style discovery"
          body="These answers stay concise on purpose so they can be extracted, summarized, and understood quickly by both humans and answer engines."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          {SEO_HUB_FAQS.map((item) => (
            <article key={item.question} className="border-t border-white/8 pt-5">
              <h3 className="font-mono text-[1.05rem] text-white">{item.question}</h3>
              <p className="mt-3 text-[15px] leading-8 text-white/62">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-14 lg:py-16">
        <SectionIntro
          kicker="Blog"
          title="A restrained article index instead of a noisy content grid"
          body="The blog should feel like a continuation of the landing page, not a different product. Each article is positioned as a simple entry route into a live module or the root dashboard."
        />

        <div className="divide-y divide-white/8 border-t border-white/8">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="grid gap-6 py-7 lg:grid-cols-[190px_minmax(0,1fr)_180px] lg:items-start">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">
                <div>{post.publishedDate}</div>
                <div className="mt-2">{post.readTime}</div>
              </div>
              <div>
                <h3 className="font-mono text-[1.3rem] text-white">{post.title}</h3>
                <p className="mt-3 max-w-3xl text-[15px] leading-8 text-white/62">{post.excerpt}</p>
              </div>
              <div className="flex items-start lg:justify-end">
                <Link to={`${SEO_BLOG_PATH}/${post.slug}`} className="border-b border-[color:var(--accent-bitcoin)] pb-1 text-[12px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:text-white">
                  Read article
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SeoChrome>
  );
}
