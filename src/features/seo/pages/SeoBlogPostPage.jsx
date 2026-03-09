import { Link, Navigate, useParams } from 'react-router-dom';
import SeoChrome from '@/features/seo/components/SeoChrome.jsx';
import { getModulePath, MODULES_BY_CODE } from '@/features/module-registry/modules.js';
import { BLOG_POSTS, getBlogPostBySlug, getBlogPostPath, SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoContent.js';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL, usePageSEO } from '@/shared/hooks/usePageSEO.js';

function buildFaqSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function buildBlogSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedDate,
    dateModified: post.publishedDate,
    mainEntityOfPage: absoluteUrl(getBlogPostPath(post.slug)),
    url: absoluteUrl(getBlogPostPath(post.slug)),
    image: DEFAULT_OG_IMAGE,
    author: { '@type': 'Organization', name: 'Satoshi Dashboard' },
    publisher: {
      '@type': 'Organization',
      name: 'Satoshi Dashboard',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
    },
    keywords: post.keywords.join(', '),
  };
}

function buildBreadcrumbSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Landing', item: absoluteUrl(SEO_HUB_PATH) },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl(SEO_BLOG_PATH) },
      { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(getBlogPostPath(post.slug)) },
    ],
  };
}

export default function SeoBlogPostPage() {
  const { slug } = useParams();
  const post = getBlogPostBySlug(slug);
  const activePost = post || BLOG_POSTS[0];

  usePageSEO({
    title: activePost.metaTitle,
    description: activePost.metaDescription,
    canonicalPath: post ? getBlogPostPath(activePost.slug) : SEO_BLOG_PATH,
    keywords: activePost.keywords,
    image: DEFAULT_OG_IMAGE,
    imageAlt: activePost.title,
    robots: post ? undefined : 'noindex, follow',
    schema: post ? [buildBlogSchema(activePost), buildFaqSchema(activePost), buildBreadcrumbSchema(activePost)] : [],
  });

  if (!post) return <Navigate to={SEO_BLOG_PATH} replace />;

  const relatedModules = post.relatedModuleCodes.map((code) => MODULES_BY_CODE[code]).filter(Boolean);
  const relatedPosts = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <SeoChrome>
      <article className="mx-auto max-w-4xl">
        <header className="border-b border-white/8 pb-12 sm:pb-14 lg:pb-16">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white/42 sm:text-[12px]">
            <Link to={SEO_HUB_PATH} className="transition hover:text-white">Landing</Link>
            <span>/</span>
            <Link to={SEO_BLOG_PATH} className="transition hover:text-white">Blog</Link>
            <span>/</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="mt-5 font-mono text-[clamp(2rem,5vw,4rem)] leading-[1.05] text-white">{post.title}</h1>
          <p className="mt-6 max-w-3xl text-[16px] leading-8 text-white/66 sm:text-[18px]">{post.metaDescription}</p>

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-white/40">
            {post.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        </header>

        <section className="border-b border-white/8 py-10 sm:py-12 lg:py-14">
          {post.intro.map((paragraph) => (
            <p key={paragraph} className="text-[16px] leading-8 text-white/68 [&:not(:first-child)]:mt-5">
              {paragraph}
            </p>
          ))}

          <div className="mt-8 border-l-2 border-[color:var(--accent-bitcoin)] pl-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)]">{post.snippetTitle}</div>
            <p className="mt-3 text-[16px] leading-8 text-white/80">{post.snippetText}</p>
          </div>
        </section>

        <section className="py-10 sm:py-12 lg:py-14">
          <div className="space-y-12">
            {post.sections.map((section) => (
              <section key={section.heading} className="border-b border-white/8 pb-10 last:border-b-0 last:pb-0">
                <h2 className="font-mono text-[1.45rem] text-white sm:text-[1.7rem]">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-[15px] leading-8 text-white/66 sm:text-[16px]">
                    {paragraph}
                  </p>
                ))}
                {section.subheading ? <h3 className="mt-6 font-mono text-[1.05rem] text-white">{section.subheading}</h3> : null}
                {section.subparagraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-[15px] leading-8 text-white/66 sm:text-[16px]">
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <div key={bullet} className="border-t border-white/8 pt-3 text-[14px] leading-7 text-white/58">
                        {bullet}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </section>

        <section className="border-t border-white/8 py-10 sm:py-12 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)]">Related modules</div>
              <h2 className="mt-3 font-mono text-[1.35rem] text-white">Go from article to live data.</h2>
              <div className="mt-6 divide-y divide-white/8 border-t border-white/8">
                {relatedModules.map((module) => (
                  <Link key={module.code} to={getModulePath(module)} className="grid gap-3 py-5 transition hover:text-[color:var(--accent-bitcoin)] md:grid-cols-[80px_minmax(0,1fr)]">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/42">{module.code}</div>
                    <div>
                      <div className="font-mono text-[1rem] text-white">{module.title}</div>
                      <div className="mt-2 text-[14px] leading-7 text-white/56">Open the module directly after reading the explainer.</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="border-t border-white/8 pt-6 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-8">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)]">FAQ</div>
              <div className="mt-5 space-y-5">
                {post.faq.map((item) => (
                  <article key={item.question} className="border-t border-white/8 pt-4">
                    <h3 className="font-mono text-[0.95rem] text-white">{item.question}</h3>
                    <p className="mt-2 text-[14px] leading-7 text-white/58">{item.answer}</p>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-t border-white/8 py-10 sm:py-12 lg:py-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)]">More reading</div>
          <div className="mt-6 divide-y divide-white/8 border-t border-white/8">
            {relatedPosts.map((item) => (
              <article key={item.slug} className="grid gap-4 py-6 md:grid-cols-[minmax(0,1fr)_160px] md:items-start">
                <div>
                  <h2 className="font-mono text-[1.1rem] text-white">{item.title}</h2>
                  <p className="mt-3 text-[14px] leading-7 text-white/60">{item.excerpt}</p>
                </div>
                <div className="md:text-right">
                  <Link to={getBlogPostPath(item.slug)} className="border-b border-[color:var(--accent-bitcoin)] pb-1 text-[12px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:text-white">
                    Read next
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </article>
    </SeoChrome>
  );
}
