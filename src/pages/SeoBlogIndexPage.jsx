import { Link } from 'react-router-dom';
import SeoChrome from '../components/seo/SeoChrome';
import { BLOG_POSTS, getBlogPostPath, SEO_BLOG_PATH, SEO_HUB_PATH } from '../config/seoContent';
import { absoluteUrl, usePageSEO } from '../lib/usePageSEO';

const BLOG_TITLE = 'Satoshi Dashboard Blog | Bitcoin Price, Nodes, Tools and Merchant Guides';
const BLOG_DESCRIPTION = 'A minimal blog index for Satoshi Dashboard articles about Bitcoin price tracking, node monitoring, free tools, and merchant workflows.';

const BLOG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Satoshi Dashboard blog',
  url: absoluteUrl(SEO_BLOG_PATH),
  description: BLOG_DESCRIPTION,
};

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Landing', item: absoluteUrl(SEO_HUB_PATH) },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl(SEO_BLOG_PATH) },
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
      <section className="border-b border-white/8 pb-12 sm:pb-14 lg:pb-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
          Blog index
        </div>
        <h1 className="mt-4 max-w-4xl font-mono text-[clamp(2.1rem,5vw,4.5rem)] leading-[1.03] text-white">
          Articles that explain the dashboard without getting in the way of it.
        </h1>
        <p className="mt-6 max-w-3xl text-[16px] leading-8 text-white/66 sm:text-[18px]">
          This index is intentionally restrained. It reads more like an editorial archive than a marketing wall, with each article mapped to a clear Bitcoin topic and a clear product destination.
        </p>
      </section>

      <section className="divide-y divide-white/8 border-t border-white/8 pt-2">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="grid gap-6 py-8 lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:items-start">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">
              <div>{post.publishedDate}</div>
              <div className="mt-2">{post.readTime}</div>
            </div>

            <div>
              <h2 className="font-mono text-[1.35rem] text-white">{post.title}</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-8 text-white/62">{post.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="text-[12px] text-white/42">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start lg:justify-end">
              <Link to={getBlogPostPath(post.slug)} className="border-b border-[color:var(--accent-bitcoin)] pb-1 text-[12px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:text-white">
                Read article
              </Link>
            </div>
          </article>
        ))}
      </section>
    </SeoChrome>
  );
}
