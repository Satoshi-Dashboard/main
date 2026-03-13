import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ToastProvider } from '@/shared/components/common/Toast.jsx';
import { FIRST_MODULE } from '@/features/module-registry/modules.js';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import ModulePage from '@/features/module-player/ModulePage.jsx';

const SeoLandingPage = lazy(() => import('@/features/seo/pages/SeoLandingPage.jsx'));
const SeoBlogIndexPage = lazy(() => import('@/features/seo/pages/SeoBlogIndexPage.jsx'));
const SeoBlogPostPage = lazy(() => import('@/features/seo/pages/SeoBlogPostPage.jsx'));

function SeoRouteFallback() {
  return (
    <div className="min-h-screen bg-gray-950 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-8">
          <div className="skeleton h-3 w-28 rounded-full" />
          <div className="skeleton h-14 w-full max-w-4xl rounded-2xl" />
          <div className="skeleton h-5 w-full max-w-3xl rounded-full" />
          <div className="skeleton h-5 w-full max-w-2xl rounded-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_280px]">
          <div className="space-y-4">
            <div className="skeleton h-8 w-52 rounded-xl" />
            <div className="skeleton h-5 w-full rounded-full" />
            <div className="skeleton h-5 w-[92%] rounded-full" />
            <div className="skeleton h-5 w-[84%] rounded-full" />
          </div>
          <div className="space-y-4 border-t border-white/8 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="skeleton h-16 w-full rounded-2xl" />
            <div className="skeleton h-16 w-full rounded-2xl" />
            <div className="skeleton h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LazyRoute({ children }) {
  return <Suspense fallback={<SeoRouteFallback />}>{children}</Suspense>;
}

function LegacyBlogRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `${SEO_BLOG_PATH}/${slug}` : SEO_BLOG_PATH} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950">
        <Routes>
          <Route path="/" element={<ModulePage forcedSlug={FIRST_MODULE.slug} />} />
          <Route path={SEO_HUB_PATH} element={<LazyRoute><SeoLandingPage /></LazyRoute>} />
          <Route path={SEO_BLOG_PATH} element={<LazyRoute><SeoBlogIndexPage /></LazyRoute>} />
          <Route path={`${SEO_BLOG_PATH}/:slug`} element={<LazyRoute><SeoBlogPostPage /></LazyRoute>} />
          <Route path="/bitcoin-dashboard" element={<Navigate to={SEO_HUB_PATH} replace />} />
          <Route path="/bitcoin-dashboard/blog" element={<Navigate to={SEO_BLOG_PATH} replace />} />
          <Route path="/bitcoin-dashboard/blog/:slug" element={<LegacyBlogRedirect />} />
          <Route path="/module/:slug" element={<ModulePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}
