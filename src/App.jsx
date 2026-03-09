import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ToastProvider } from '@/shared/components/common/Toast.jsx';
import { FIRST_MODULE } from '@/features/module-registry/modules.js';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import ModulePage from '@/features/module-player/ModulePage.jsx';

const SeoLandingPage = lazy(() => import('@/features/seo/pages/SeoLandingPage.jsx'));
const SeoBlogIndexPage = lazy(() => import('@/features/seo/pages/SeoBlogIndexPage.jsx'));
const SeoBlogPostPage = lazy(() => import('@/features/seo/pages/SeoBlogPostPage.jsx'));

function AppShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <div className="skeleton h-4 w-24 rounded-full self-center" />
        <div className="skeleton h-24 w-full rounded-3xl" />
        <div className="skeleton h-4 w-40 rounded-full self-center" />
      </div>
    </div>
  );
}

function LegacyBlogRedirect() {
  const { slug } = useParams();
  return <Navigate to={slug ? `${SEO_BLOG_PATH}/${slug}` : SEO_BLOG_PATH} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950">
        <Suspense fallback={<AppShellFallback />}>
          <Routes>
            <Route path="/" element={<ModulePage forcedSlug={FIRST_MODULE.slug} />} />
            <Route path={SEO_HUB_PATH} element={<SeoLandingPage />} />
            <Route path={SEO_BLOG_PATH} element={<SeoBlogIndexPage />} />
            <Route path={`${SEO_BLOG_PATH}/:slug`} element={<SeoBlogPostPage />} />
            <Route path="/bitcoin-dashboard" element={<Navigate to={SEO_HUB_PATH} replace />} />
            <Route path="/bitcoin-dashboard/blog" element={<Navigate to={SEO_BLOG_PATH} replace />} />
            <Route path="/bitcoin-dashboard/blog/:slug" element={<LegacyBlogRedirect />} />
            <Route path="/module/:slug" element={<ModulePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ToastProvider>
  );
}
