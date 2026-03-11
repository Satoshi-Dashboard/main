import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { queryClient } from './shared/lib/queryClient.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Analytics mode={import.meta.env.PROD ? 'production' : 'development'} />
        <SpeedInsights />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
