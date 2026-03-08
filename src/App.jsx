import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import ModulePage from './pages/ModulePage';
import { MODULES } from './config/modules';

function AppShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-center font-mono text-sm tracking-[0.18em] text-white/60">
      Loading module...
    </div>
  );
}

export default function App() {
  const firstModule = MODULES[0];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950">
        <Suspense fallback={<AppShellFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to={`/module/${firstModule.slug}`} replace />} />
            <Route path="/module/:slug" element={<ModulePage />} />
            <Route path="*" element={<Navigate to={`/module/${firstModule.slug}`} replace />} />
          </Routes>
        </Suspense>
      </div>
    </ToastProvider>
  );
}
