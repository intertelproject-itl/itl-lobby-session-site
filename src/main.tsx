import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './design/theme/global.css';
import './integrations/http/authInterceptor';
import { ApiLoadingModal } from './design/components/ui/ApiLoadingModal';
import { AmbientAudioPlayer } from './design/components/audio/AmbientAudioPlayer';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <video className="app-background-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src="/mp4/background.mp4" type="video/mp4" />
      </video>
      <div className="app-background-overlay" aria-hidden="true" />
      <RouterProvider router={router} />
      <AmbientAudioPlayer />
      <ApiLoadingModal />
    </>
  </React.StrictMode>
);
