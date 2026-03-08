import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { FIRST_MODULE } from './config/modules';
import ModulePage from './pages/ModulePage';
import SeoBlogIndexPage from './pages/SeoBlogIndexPage';
import SeoBlogPostPage from './pages/SeoBlogPostPage';
import SeoLandingPage from './pages/SeoLandingPage';

function AppShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-center font-mono text-sm tracking-[0.18em] text-white/60">
      Loading module...
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950">
        <Suspense fallback={<AppShellFallback />}>
          <Routes>
            <Route path="/" element={<ModulePage forcedSlug={FIRST_MODULE.slug} />} />
            <Route path="/bitcoin-dashboard" element={<SeoLandingPage />} />
            <Route path="/bitcoin-dashboard/blog" element={<SeoBlogIndexPage />} />
            <Route path="/bitcoin-dashboard/blog/:slug" element={<SeoBlogPostPage />} />
            <Route path="/module/:slug" element={<ModulePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ToastProvider>
  );
}
