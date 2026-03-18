import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import DeferredTelemetry from '@/shared/components/common/DeferredTelemetry.jsx';
import { hydrate as hydrateBootstrap } from '@/shared/stores/bootstrapStore.js';
import './index.css';

/**
 * Espera el bootstrap (datos cacheados en Redis) antes del primer render.
 * Si el servidor no responde en 400ms, se renderiza igual (sin datos de bootstrap).
 * Esto garantiza que getModuleData() tenga datos disponibles en el primer render
 * para todos los módulos con bootstrapKey.
 */
const BOOTSTRAP_TIMEOUT_MS = 400;

Promise.race([
  hydrateBootstrap(),
  new Promise((resolve) => setTimeout(resolve, BOOTSTRAP_TIMEOUT_MS)),
]).finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        <DeferredTelemetry />
      </BrowserRouter>
    </React.StrictMode>,
  );
});
