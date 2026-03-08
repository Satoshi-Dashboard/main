import { Link } from 'react-router-dom';
import SeoChrome from '../components/seo/SeoChrome';
import { FIRST_MODULE, getModulePath, MODULES_BY_CODE } from '../config/modules';
import {
  BLOG_POSTS,
  SEO_BLOG_PATH,
  SEO_HUB_FAQS,
  SEO_HUB_PATH,
  SEO_KEYWORD_ROWS,
  SEO_QUESTION_ROWS,
} from '../config/seoContent';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL, usePageSEO } from '../lib/usePageSEO';

const LANDING_TITLE = 'Free Bitcoin Dashboard, Nodes Map & Live BTC Price | Satoshi Dashboard';
const LANDING_DESCRIPTION = 'Explore a free Bitcoin dashboard with live BTC price, mempool data, Bitcoin nodes maps, merchant coverage, and SEO content built for Google and AI search engines.';
const LANDING_KEYWORDS = [
  'free bitcoin dashboard',
  'bitcoin price dashboard',
  'bitcoin nodes map',
  'bitcoin analytics tools',
  'bitcoin merchant map',
  'live bitcoin price',
];

const FEATURE_CARDS = [
  {
    title: 'Live Bitcoin price',
    copy: 'A root-level dashboard view built to answer immediate market questions without an intermediate redirect.',
    path: '/',
    pathLabel: 'Open dashboard',
  },
  {
    title: 'Bitcoin nodes map',
    copy: 'A full-node distribution view built for decentralization, infrastructure, and AI-answer style queries.',
    path: getModulePath('S06'),
    pathLabel: MODULES_BY_CODE.S06.title,
  },
  {
    title: 'Merchant and POS research',
    copy: 'Merchant map and Lightning data that support Bitcoin payment, adoption, and point-of-sale research intent.',
    path: getModulePath('S08'),
    pathLabel: MODULES_BY_CODE.S08.title,
  },
  {
    title: 'Search-ready editorial pages',
    copy: 'An SEO hub and blog that answer real user questions, then move high-intent traffic into the live product.',
    path: SEO_BLOG_PATH,
    pathLabel: 'Read blog',
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
  name: 'Satoshi Dashboard SEO Hub',
  url: absoluteUrl(SEO_HUB_PATH),
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  isAccessibleForFree: true,
  description: LANDING_DESCRIPTION,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Satoshi Dashboard',
  url: `${SITE_URL}/`,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  isAccessibleForFree: true,
  description: 'Free Bitcoin analytics platform with live price, mempool, nodes, Lightning, merchant maps, and 31 interactive modules.',
  featureList: [
    'Live Bitcoin price dashboard',
    'Bitcoin price chart',
    'Bitcoin nodes world map',
    'Merchant map and point-of-sale research',
    'Mempool and fee monitoring',
    'On-chain and cycle indicators',
  ],
};

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Dashboard',
      item: `${SITE_URL}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'SEO Hub',
      item: absoluteUrl(SEO_HUB_PATH),
    },
  ],
};

function SectionHeading({ eyebrow, title, body }) {
  return (
    <div className="mb-6 max-w-3xl">
      <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">{eyebrow}</div>
      <h2 className="mt-3 font-mono text-[clamp(1.35rem,3vw,2.35rem)] leading-tight text-white">{title}</h2>
      <p className="mt-3 text-[14px] leading-7 text-white/72 sm:text-[15px]">{body}</p>
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
    imageAlt: 'Free Bitcoin dashboard, nodes map, and live BTC price tools',
    schema: [WEB_APP_SCHEMA, SOFTWARE_SCHEMA, FAQ_SCHEMA, BREADCRUMB_SCHEMA],
  });

  return (
    <SeoChrome>
      <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(247,147,26,0.14),rgba(255,255,255,0.03)_48%,rgba(0,0,0,0.24))] px-5 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(247,147,26,0.18),transparent_60%)]" />
        <div className="relative max-w-4xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.26em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
            Bitcoin SEO hub
          </div>
          <h1 className="mt-4 max-w-4xl font-mono text-[clamp(2rem,5vw,4rem)] leading-[1.05] text-white">
            Free Bitcoin dashboard for live price, nodes, mempool, merchants, and AI-ready answers
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-8 text-white/76 sm:text-[16px]">
            This landing page is built to capture searches around <strong>Bitcoin price today</strong>, <strong>Bitcoin nodes map</strong>, <strong>free Bitcoin dashboard</strong>, <strong>BTC analysis tools</strong>, and <strong>Bitcoin point of sale</strong>. The goal is simple: answer the search intent clearly, earn visibility in Google and AI search engines, and route qualified visitors into the live dashboard at the root URL.
          </p>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-white/72 sm:text-[16px]">
            Instead of sending users to a generic marketing page, the site now connects informational content with working modules. A user who starts with a broad search can move from this SEO hub into live Bitcoin tools in one click, whether the question is about price, fees, full nodes, merchant adoption, or long-term valuation models.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={getModulePath(FIRST_MODULE)}
              className="rounded-full border border-[color:var(--border-active)] bg-[rgba(247,147,26,0.16)] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.24)] sm:text-[12px]"
            >
              Open the live dashboard
            </Link>
            <Link
              to={SEO_BLOG_PATH}
              className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/76 transition hover:border-white/20 hover:text-white sm:text-[12px]"
            >
              Explore the blog
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {FEATURE_CARDS.map((card, index) => (
          <Link
            key={card.title}
            to={card.path}
            className="fade-up rounded-[24px] border border-white/8 bg-[#111118]/90 p-5 shadow-[0_18px_42px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-[color:var(--border-active)]"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
              {card.pathLabel}
            </div>
            <h2 className="mt-3 font-mono text-[1.15rem] text-white">{card.title}</h2>
            <p className="mt-3 text-[14px] leading-7 text-white/68">{card.copy}</p>
          </Link>
        ))}
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Why this exists"
          title="A Bitcoin SEO architecture that answers the query and exposes the product"
          body="The site now has a cleaner acquisition path: the dashboard loads directly at the root URL, while the landing page and blog capture informational, comparative, and transactional search demand. That structure improves technical SEO, internal linking, canonical clarity, and user progression from search result to working tool."
        />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-white/8 bg-[#101018]/90 p-6">
            <p className="text-[14px] leading-8 text-white/72 sm:text-[15px]">
              A common SEO mistake in analytics products is to hide the tool behind redirects or thin landing pages. That weakens canonical signals and breaks the natural connection between intent and destination. Here, the root URL is now the canonical dashboard. That means a user who searches for live Bitcoin price or Bitcoin dashboard lands directly on the real experience instead of on a redirect chain.
            </p>
            <p className="mt-4 text-[14px] leading-8 text-white/72 sm:text-[15px]">
              The SEO hub serves a different purpose. It is designed to target broader discovery phrases such as free Bitcoin dashboard, monitor BTC nodes, or best free Bitcoin analysis tool. Those users often need explanation, comparison, and orientation before they are ready to engage with a live module. The hub supplies that missing context and then funnels traffic to the exact module that satisfies the task.
            </p>
            <p className="mt-4 text-[14px] leading-8 text-white/72 sm:text-[15px]">
              This same structure is strong for AI search. Systems like SearchGPT, Perplexity, and Gemini prefer pages that answer questions directly, contain compact definitions, and point to a clear source-of-truth experience. The combination of schema, FAQ formatting, route clarity, and tool-specific internal links makes the content easier to summarize and cite.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-[#0d0d13]/92 p-6">
            <h3 className="font-mono text-[1rem] text-white">Recommended traffic flow</h3>
            <div className="mt-4 space-y-3 text-[14px] leading-7 text-white/70">
              <p><strong>Step 1:</strong> Capture broad searches with the landing page and blog.</p>
              <p><strong>Step 2:</strong> Answer the question with concise, snippet-friendly copy.</p>
              <p><strong>Step 3:</strong> Route the visitor to the live module that completes the job.</p>
              <p><strong>Step 4:</strong> Keep the root dashboard as the canonical home for the flagship experience.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Core search themes"
          title="Bitcoin price today, nodes map, merchant coverage, and free BTC tools in one content funnel"
          body="These are the search themes with the strongest fit for the current product. Each one connects naturally to a live module, which means the SEO pages can rank for discovery while still feeding real product usage."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[24px] border border-white/8 bg-[#101018]/90 p-6">
            <h3 className="font-mono text-[1.1rem] text-white">Live Bitcoin price and chart intent</h3>
            <p className="mt-3 text-[14px] leading-8 text-white/72 sm:text-[15px]">
              Queries around price dominate the top of funnel. Users search for price today, live Bitcoin chart, BTC price in real time, or how to monitor price without paying for a trading terminal. The root dashboard and the dedicated chart module answer those requests directly, while the price blog post handles comparative and conversational phrasing.
            </p>
          </article>
          <article className="rounded-[24px] border border-white/8 bg-[#101018]/90 p-6">
            <h3 className="font-mono text-[1.1rem] text-white">Bitcoin nodes and decentralization intent</h3>
            <p className="mt-3 text-[14px] leading-8 text-white/72 sm:text-[15px]">
              Node queries are highly relevant because they attract researchers, developers, journalists, and long-term investors. They also map perfectly to a visual tool. The nodes module answers the live count and distribution question, while the nodes article explains what the map means and why the metric matters.
            </p>
          </article>
          <article className="rounded-[24px] border border-white/8 bg-[#101018]/90 p-6">
            <h3 className="font-mono text-[1.1rem] text-white">Free Bitcoin tools and analysis intent</h3>
            <p className="mt-3 text-[14px] leading-8 text-white/72 sm:text-[15px]">
              Many users search for a free Bitcoin dashboard because they want a focused tool, not a broad crypto terminal. That makes tool-intent keywords valuable. The landing page frames the product, the tools post gives the monitoring workflow, and the modules provide the concrete utility that turns curiosity into repeated usage.
            </p>
          </article>
          <article className="rounded-[24px] border border-white/8 bg-[#101018]/90 p-6">
            <h3 className="font-mono text-[1.1rem] text-white">Bitcoin merchant and point-of-sale intent</h3>
            <p className="mt-3 text-[14px] leading-8 text-white/72 sm:text-[15px]">
              Merchant and POS intent may be smaller in volume, but it is highly qualified. Users searching for Bitcoin point of sale, Bitcoin merchant dashboard, or how to accept BTC are closer to action. The merchant map, Lightning stats, and POS blog page support that journey with stronger transactional relevance.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Keyword map"
          title="Keyword clusters aligned to search intent and destination pages"
          body="The table below mixes high-volume informational keywords, niche tool phrases, AI-style conversational prompts, and long-tail searches in Spanish and English. Each cluster is connected to the page that should answer it best."
        />
        <div className="overflow-x-auto rounded-[24px] border border-white/8 bg-[#0f0f16]/92">
          <table className="min-w-full border-collapse text-left text-[13px] text-white/72 sm:text-[14px]">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
              <tr>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Keyword</th>
                <th className="px-4 py-4">Lang</th>
                <th className="px-4 py-4">Intent</th>
                <th className="px-4 py-4">Target page</th>
              </tr>
            </thead>
            <tbody>
              {SEO_KEYWORD_ROWS.map((row) => (
                <tr key={row.keyword} className="border-t border-white/6 align-top">
                  <td className="px-4 py-4">{row.category}</td>
                  <td className="px-4 py-4 text-white">{row.keyword}</td>
                  <td className="px-4 py-4">{row.language}</td>
                  <td className="px-4 py-4">{row.intent}</td>
                  <td className="px-4 py-4">
                    <Link to={row.pagePath} className="text-[color:var(--accent-bitcoin)] underline-offset-4 hover:underline">
                      {row.pageLabel}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="People also ask"
          title="Questions users ask in Google, ChatGPT, Perplexity, and Gemini"
          body="These questions reflect the conversational phrasing that matters more and more in AI-led discovery. Each one should have a clear destination page so the site becomes easier to quote, summarize, and navigate."
        />
        <div className="overflow-x-auto rounded-[24px] border border-white/8 bg-[#0f0f16]/92">
          <table className="min-w-full border-collapse text-left text-[13px] text-white/72 sm:text-[14px]">
            <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
              <tr>
                <th className="px-4 py-4">Intent</th>
                <th className="px-4 py-4">Question</th>
                <th className="px-4 py-4">Best page</th>
              </tr>
            </thead>
            <tbody>
              {SEO_QUESTION_ROWS.map((row) => (
                <tr key={row.question} className="border-t border-white/6 align-top">
                  <td className="px-4 py-4">{row.intent}</td>
                  <td className="px-4 py-4 text-white">{row.question}</td>
                  <td className="px-4 py-4">
                    <Link to={row.pagePath} className="text-[color:var(--accent-bitcoin)] underline-offset-4 hover:underline">
                      {row.pageLabel}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 rounded-[28px] border border-white/8 bg-[#101018]/90 p-6 sm:p-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions about the free Bitcoin dashboard"
          body="This FAQ section is written to support featured snippets, AI answer extraction, and faster user orientation. Each answer is short enough to summarize and specific enough to direct the next click."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {SEO_HUB_FAQS.map((item) => (
            <article key={item.question} className="rounded-[22px] border border-white/8 bg-black/20 p-5">
              <h3 className="font-mono text-[1rem] text-white">{item.question}</h3>
              <p className="mt-3 text-[14px] leading-7 text-white/70">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading
          eyebrow="SEO blog"
          title="Use the blog to target broader search demand, then move visitors into the modules"
          body="The blog extends the acquisition surface with higher-context pages for price tracking, node monitoring, free tools, and merchant workflows. Each article is linked to the live dashboard or the relevant module so traffic can move naturally from research to action."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="rounded-[24px] border border-white/8 bg-[#101018]/90 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
                <span>{post.readTime}</span>
                <span className="text-white/28">/</span>
                <span>{post.publishedDate}</span>
              </div>
              <h3 className="mt-3 font-mono text-[1.15rem] text-white">{post.title}</h3>
              <p className="mt-3 text-[14px] leading-7 text-white/70">{post.excerpt}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-white/60">
                    {keyword}
                  </span>
                ))}
              </div>
              <Link
                to={`${SEO_BLOG_PATH}/${post.slug}`}
                className="mt-6 inline-flex rounded-full border border-[color:var(--border-active)] bg-[rgba(247,147,26,0.14)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.22)] sm:text-[12px]"
              >
                Read article
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SeoChrome>
  );
}
