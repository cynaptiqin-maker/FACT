import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { ReliabilityProvider } from './providers/ReliabilityProvider.jsx';
import App from './App.jsx';
import './index.css';

// ReliabilityProvider owns the QueryClient (configured with enterprise retry/stale settings),
// global error boundary, offline detection, and submission-lock registry.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ReliabilityProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#f1f5f9' } },
          }}
        />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </ReliabilityProvider>
    </BrowserRouter>
  </React.StrictMode>
);
