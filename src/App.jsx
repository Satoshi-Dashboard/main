import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import ModulePage from './pages/ModulePage';
import { MODULES } from './config/modules';

export default function App() {
  const firstModule = MODULES[0];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950">
        <Routes>
          <Route path="/" element={<Navigate to={`/module/${firstModule.slug}`} replace />} />
          <Route path="/module/:slug" element={<ModulePage />} />
          <Route path="*" element={<Navigate to={`/module/${firstModule.slug}`} replace />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}
