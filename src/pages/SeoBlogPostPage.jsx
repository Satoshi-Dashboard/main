import { Link, Navigate, useParams } from 'react-router-dom';
import SeoChrome from '../components/seo/SeoChrome';
import { getModulePath, MODULES_BY_CODE } from '../config/modules';
import { BLOG_POSTS, getBlogPostBySlug, getBlogPostPath, SEO_BLOG_PATH, SEO_HUB_PATH } from '../config/seoContent';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_URL, usePageSEO } from '../lib/usePageSEO';

function buildFaqSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
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
    author: {
      '@type': 'Organization',
      name: 'Satoshi Dashboard',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Satoshi Dashboard',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.svg`,
      },
    },
    keywords: post.keywords.join(', '),
    articleSection: post.sections.map((section) => section.heading),
  };
}

function buildBreadcrumbSchema(post) {
  return {
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
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: absoluteUrl(getBlogPostPath(post.slug)),
      },
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

  if (!post) {
    return <Navigate to={SEO_BLOG_PATH} replace />;
  }

  const relatedModules = post.relatedModuleCodes
    .map((code) => MODULES_BY_CODE[code])
    .filter(Boolean);
  const relatedPosts = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 2);

  return (
    <SeoChrome>
      <article className="mx-auto max-w-4xl">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(247,147,26,0.12),rgba(255,255,255,0.03)_55%,rgba(0,0,0,0.2))] px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
            <Link to={SEO_HUB_PATH} className="hover:text-white">SEO Hub</Link>
            <span className="text-white/30">/</span>
            <Link to={SEO_BLOG_PATH} className="hover:text-white">Blog</Link>
            <span className="text-white/30">/</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="mt-4 font-mono text-[clamp(1.9rem,4.5vw,3.4rem)] leading-tight text-white">{post.title}</h1>
          <p className="mt-5 text-[15px] leading-8 text-white/76 sm:text-[16px]">{post.metaDescription}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-white/62">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/8 bg-[#101018]/92 p-6 sm:p-8">
          {post.intro.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-8 text-white/72 sm:text-[16px] [&:not(:first-child)]:mt-5">
              {paragraph}
            </p>
          ))}

          <div className="mt-8 rounded-[22px] border border-[color:var(--border-active)] bg-[rgba(247,147,26,0.08)] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
              {post.snippetTitle}
            </div>
            <p className="mt-3 text-[15px] leading-8 text-white/82 sm:text-[16px]">{post.snippetText}</p>
          </div>

          <div className="mt-10 space-y-10">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-mono text-[1.35rem] text-white sm:text-[1.55rem]">{section.heading}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-[15px] leading-8 text-white/72 sm:text-[16px]">
                    {paragraph}
                  </p>
                ))}
                {section.subheading ? <h3 className="mt-6 font-mono text-[1.05rem] text-white">{section.subheading}</h3> : null}
                {section.subparagraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-[15px] leading-8 text-white/72 sm:text-[16px]">
                    {paragraph}
                  </p>
                ))}
                {section.bullets?.length ? (
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="rounded-[18px] border border-white/8 bg-black/18 px-4 py-3 text-[14px] leading-7 text-white/68">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
        </div>

        <section className="mt-8 rounded-[24px] border border-white/8 bg-[#101018]/92 p-6 sm:p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
            Related live modules
          </div>
          <h2 className="mt-3 font-mono text-[1.4rem] text-white">Open the exact module after reading</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {relatedModules.map((module) => (
              <Link key={module.code} to={getModulePath(module)} className="rounded-[20px] border border-white/8 bg-black/18 p-5 transition hover:border-[color:var(--border-active)]">
                <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
                  {module.code}
                </div>
                <div className="mt-2 font-mono text-[1rem] text-white">{module.title}</div>
                <div className="mt-2 text-[14px] text-white/60">Go from explanation to live data.</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[24px] border border-white/8 bg-[#101018]/92 p-6 sm:p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
            FAQ
          </div>
          <h2 className="mt-3 font-mono text-[1.4rem] text-white">Quick answers for search and AI engines</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {post.faq.map((item) => (
              <article key={item.question} className="rounded-[20px] border border-white/8 bg-black/18 p-5">
                <h3 className="font-mono text-[0.98rem] text-white">{item.question}</h3>
                <p className="mt-3 text-[14px] leading-7 text-white/68">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {relatedPosts.map((item) => (
            <article key={item.slug} className="rounded-[24px] border border-white/8 bg-[#101018]/92 p-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] sm:text-[12px]">
                Related article
              </div>
              <h2 className="mt-3 font-mono text-[1.1rem] text-white">{item.title}</h2>
              <p className="mt-3 text-[14px] leading-7 text-white/70">{item.excerpt}</p>
              <Link
                to={getBlogPostPath(item.slug)}
                className="mt-5 inline-flex rounded-full border border-[color:var(--border-active)] bg-[rgba(247,147,26,0.14)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.22)] sm:text-[12px]"
              >
                Read next article
              </Link>
            </article>
          ))}
        </section>
      </article>
    </SeoChrome>
  );
}
