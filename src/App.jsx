import { Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { FIRST_MODULE } from './config/modules';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from './config/seoContent';
import ModulePage from './pages/ModulePage';
import SeoBlogIndexPage from './pages/SeoBlogIndexPage';
import SeoBlogPostPage from './pages/SeoBlogPostPage';
import SeoLandingPage from './pages/SeoLandingPage';

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
