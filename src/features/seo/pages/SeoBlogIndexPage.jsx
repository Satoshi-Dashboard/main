import SeoChrome from '@/features/seo/components/SeoChrome.jsx';
import { SeoEyebrow, SeoRoutePill } from '@/features/seo/components/SeoPrimitives.jsx';
import { BLOG_POSTS } from '@/features/seo/content/seoContent.js';
import { getBlogPostPath, SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import { absoluteUrl, usePageSEO } from '@/shared/hooks/usePageSEO.js';
import { AppSection } from '@/shared/components/layout/AppLayout.jsx';

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
      <AppSection className="pt-0">
        <SeoEyebrow>Blog index</SeoEyebrow>
        <h1 className="mt-4 max-w-4xl text-safe-wrap font-mono text-[clamp(2.1rem,5vw,4.5rem)] leading-[1.03] text-white">
          Articles that explain the dashboard without getting in the way of it.
        </h1>
        <p className="mt-6 max-w-3xl text-safe-wrap text-[16px] leading-8 text-white/66 sm:text-[18px]">
          This index is intentionally restrained. It reads more like an editorial archive than a marketing wall, with each article mapped to a clear Bitcoin topic and a clear product destination.
        </p>
      </AppSection>

      <AppSection className="border-b-0 py-0">
        <div className="divide-y divide-white/8 border-t border-white/8 pt-2">
          {BLOG_POSTS.map((post) => (
            <article key={post.slug} className="grid gap-6 py-8 lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:items-start">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">
                <div>{post.publishedDate}</div>
                <div className="mt-2">{post.readTime}</div>
              </div>

              <div className="min-w-0">
                <h2 className="text-safe-wrap font-mono text-[1.35rem] text-white">{post.title}</h2>
                <p className="mt-3 max-w-3xl text-safe-wrap text-[15px] leading-8 text-white/62">{post.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.keywords.map((keyword) => (
                    <span key={keyword} className="text-[12px] text-white/42">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start lg:justify-end">
                <SeoRoutePill to={getBlogPostPath(post.slug)} tone="accent">
                  Read article
                </SeoRoutePill>
              </div>
            </article>
          ))}
        </div>
      </AppSection>
    </SeoChrome>
  );
}
