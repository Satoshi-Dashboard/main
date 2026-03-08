import { Link } from 'react-router-dom';
import SeoChrome from '../components/seo/SeoChrome';
import { BLOG_POSTS, getBlogPostPath, SEO_BLOG_PATH, SEO_HUB_PATH } from '../config/seoContent';
import { absoluteUrl, usePageSEO } from '../lib/usePageSEO';

const BLOG_TITLE = 'Bitcoin SEO Blog | Price, Nodes, Tools and Merchant Guides';
const BLOG_DESCRIPTION = 'Read practical Bitcoin guides about live price tracking, node monitoring, free BTC analysis tools, and Bitcoin point-of-sale workflows.';

const BLOG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Satoshi Dashboard Bitcoin SEO Blog',
  url: absoluteUrl(SEO_BLOG_PATH),
  description: BLOG_DESCRIPTION,
  hasPart: BLOG_POSTS.map((post) => ({
    '@type': 'BlogPosting',
    headline: post.title,
    url: absoluteUrl(getBlogPostPath(post.slug)),
    datePublished: post.publishedDate,
    description: post.metaDescription,
  })),
};

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'SEO Hub',
      item: absoluteUrl(SEO_HUB_PATH),
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: absoluteUrl(SEO_BLOG_PATH),
    },
  ],
};

export default function SeoBlogIndexPage() {
  usePageSEO({
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    canonicalPath: SEO_BLOG_PATH,
    keywords: ['bitcoin blog', 'bitcoin price guide', 'bitcoin nodes guide', 'free bitcoin tools'],
    schema: [BLOG_SCHEMA, BREADCRUMB_SCHEMA],
  });

  return (
    <SeoChrome>
      <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(247,147,26,0.12),rgba(255,255,255,0.03)_55%,rgba(0,0,0,0.22))] px-5 py-8 sm:px-8 sm:py-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
          Editorial cluster
        </div>
        <h1 className="mt-4 max-w-4xl font-mono text-[clamp(1.9rem,4.5vw,3.5rem)] leading-tight text-white">
          Bitcoin blog pages built to answer price, nodes, tools, and merchant questions
        </h1>
        <p className="mt-5 max-w-3xl text-[15px] leading-8 text-white/74 sm:text-[16px]">
          This blog is designed to capture broader Bitcoin search intent, answer conversational queries cleanly, and send readers into the live dashboard or the most relevant module. Each article targets a specific problem instead of generic crypto commentary.
        </p>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="rounded-[24px] border border-white/8 bg-[#101018]/92 p-6 shadow-[0_16px_44px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
              <span>{post.publishedDate}</span>
              <span className="text-white/28">/</span>
              <span>{post.readTime}</span>
            </div>
            <h2 className="mt-3 font-mono text-[1.2rem] text-white">{post.title}</h2>
            <p className="mt-3 text-[14px] leading-7 text-white/70">{post.excerpt}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {post.keywords.map((keyword) => (
                <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-white/60">
                  {keyword}
                </span>
              ))}
            </div>
            <Link
              to={getBlogPostPath(post.slug)}
              className="mt-6 inline-flex rounded-full border border-[color:var(--border-active)] bg-[rgba(247,147,26,0.14)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.22)] sm:text-[12px]"
            >
              Read article
            </Link>
          </article>
        ))}
      </section>
    </SeoChrome>
  );
}
