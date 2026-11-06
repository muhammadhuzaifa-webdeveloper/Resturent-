import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Providers } from './app/providers';
import './index.css';

async function prepareApp() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    try {
      const { worker } = await import('./api/mocks/browser');
      await worker.start({
        onUnhandledRequest: 'bypass',
      });
    } catch {
      // In environments where ServiceWorker is restricted, Axios adapter in apiClient seamlessly handles requests
    }
  }
}

prepareApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </React.StrictMode>
  );
});
