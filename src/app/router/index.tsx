import { createBrowserRouter } from 'react-router-dom';
import { PrivateRoute } from '../../scripts/guards/PrivateRoute';
import { LoginPage } from '../../pages/auth/LoginPage';
import { RegisterPage } from '../../pages/auth/RegisterPage';
import { PublicSessionsPage } from '../../pages/sessions/PublicSessionsPage';
import { SessionLobbyPage } from '../../pages/sessions/SessionLobbyPage';
import { CharacterCreationPage } from '../../pages/character/CharacterCreationPage';
import { CharacterSheetPage } from '../../pages/character/CharacterSheetPage';
import { InventoryPage } from '../../pages/inventory/InventoryPage';
import { ErrorPage } from '../../pages/error/ErrorPage';
import { NotFoundPage } from '../../pages/error/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/cadastro',
    element: <RegisterPage />,
    errorElement: <ErrorPage />,
  },
  {
    element: <PrivateRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <PublicSessionsPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/sessoes',
        element: <PublicSessionsPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/sessoes/:sessionId',
        element: <SessionLobbyPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/sessoes/:sessionId/personagem/criar',
        element: <CharacterCreationPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/sessoes/:sessionId/personagem',
        element: <CharacterSheetPage />,
        errorElement: <ErrorPage />,
      },
      {
        path: '/sessoes/:sessionId/inventario',
        element: <InventoryPage />,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  }
]);