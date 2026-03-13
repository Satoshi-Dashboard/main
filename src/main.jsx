import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App.jsx';
import { queryClient } from './shared/lib/queryClient.js';
import { SEO_BLOG_PATH, SEO_HUB_PATH } from '@/features/seo/content/seoRoutes.js';
import './index.css';

function getSpeedInsightsRouteLabel(pathname) {
  if (pathname === '/') return '/';
  if (pathname === SEO_HUB_PATH) return '/landingpage';
  if (pathname === SEO_BLOG_PATH) return '/landingpage/blog';
  if (pathname.startsWith(`${SEO_BLOG_PATH}/`)) return '/landingpage/blog/[slug]';
  if (pathname.startsWith('/module/')) return '/module/[slug]';
  return pathname || null;
}

function RouteAwareTelemetry({ Analytics, SpeedInsights }) {
  const location = useLocation();
  const routeLabel = useMemo(
    () => getSpeedInsightsRouteLabel(location.pathname),
    [location.pathname],
  );

  return (
    <>
      <Analytics mode="production" />
      <SpeedInsights route={routeLabel} />
    </>
  );
}

function DeferredTelemetry() {
  const [components, setComponents] = useState(null);

  useEffect(() => {
    if (!import.meta.env.PROD || typeof window === 'undefined') return undefined;

    let cancelled = false;
    const loadTelemetry = () => {
      Promise.all([
        import('@vercel/analytics/react'),
        import('@vercel/speed-insights/react'),
      ])
        .then(([analyticsModule, speedModule]) => {
          if (cancelled) return;
          setComponents({
            Analytics: analyticsModule.Analytics,
            SpeedInsights: speedModule.SpeedInsights,
          });
        })
        .catch(() => {
          // Keep telemetry loading from affecting product UX.
        });
    };

    const idleCallback = window.requestIdleCallback
      ? window.requestIdleCallback(loadTelemetry, { timeout: 2500 })
      : window.setTimeout(loadTelemetry, 1800);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback && typeof idleCallback === 'number') {
        window.cancelIdleCallback(idleCallback);
        return;
      }
      window.clearTimeout(idleCallback);
    };
  }, []);

  if (!components) return null;

  const { Analytics, SpeedInsights } = components;
  return <RouteAwareTelemetry Analytics={Analytics} SpeedInsights={SpeedInsights} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <DeferredTelemetry />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
