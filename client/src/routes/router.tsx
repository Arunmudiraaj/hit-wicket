import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy, type JSX } from 'react';
import Loader from '../components/shared/Loader';
import MainLayout from '../layouts/MainLayout';
import { APP_ROUTES, EXTRA_ROUTES } from '../constants/constants';

// Lazy-loaded route components
const Home = lazy(() => import('../pages/Home'));
const About = lazy(() => import('../pages/About'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Game = lazy(() => import('../pages/Game'));

const withSuspense = (Component: React.LazyExoticComponent<() => JSX.Element>) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(Home) },
      { path: APP_ROUTES.ABOUT.path, element: withSuspense(About) },
      { path: '*', element: withSuspense(NotFound) },
    ],
  },
  { path: EXTRA_ROUTES.GAME.path, element: withSuspense(Game) }
]);

export default router;
