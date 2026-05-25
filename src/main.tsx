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
      <RouterProvider router={router} />
      <ApiErrorModal />
    </>
  </React.StrictMode>
);