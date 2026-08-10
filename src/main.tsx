import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fetches the server's API key once at startup and attaches it to every
// subsequent same-origin /api request, so the rest of the app's existing
// fetch("/api/...") calls keep working unmodified against the new
// x-jarvis-api-key requirement added in server.ts. See the comment on
// GET /api/session-key in server.ts for the threat model this relies on.
async function bootstrapApiKey(): Promise<void> {
  try {
    const res = await fetch('/api/session-key');
    if (!res.ok) throw new Error(`session-key request failed: ${res.status}`);
    const { apiKey } = await res.json();
    if (!apiKey) throw new Error('server returned no apiKey');

    const originalFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
      const url = typeof input === 'string' ? input : input.toString();
      const isApiCall = url.startsWith('/api');
      const isExempt = url.startsWith('/api/agent/download') || url.startsWith('/api/session-key');
      if (isApiCall && !isExempt) {
        init = {
          ...init,
          headers: { ...(init.headers || {}), 'x-jarvis-api-key': apiKey },
        };
      }
      return originalFetch(input as any, init);
    };
  } catch (err) {
    console.error('[Jarvis] Failed to bootstrap API key - API calls will likely 401:', err);
  }
}

bootstrapApiKey().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
