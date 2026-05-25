import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './design/theme/global.css';
import './integrations/http/authInterceptor';
import { ApiErrorModal } from './design/components/ui/ApiErrorModal';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <video className="app-background-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/mp4/background.mp4" type="video/mp4" />
      </video>
      <div className="app-background-overlay" aria-hidden="true" />
      <RouterProvider router={router} />
      <ApiErrorModal />
    </>
  </React.StrictMode>
);
