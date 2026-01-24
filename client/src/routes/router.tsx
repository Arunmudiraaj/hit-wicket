import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy, type JSX } from 'react';
import Loader from '../components/Loader';
import { APP_ROUTES, EXTRA_ROUTES } from '../constants/constants';

// Lazy-loaded route components
const Home = lazy(() => import('../pages/Home/Home'));
const About = lazy(() => import('../pages/About/About'));
const NotFound = lazy(() => import('../pages/NotFound/NotFound'));
const Game = lazy(() => import('../pages/Game/Game'));
const SettingsScreen = lazy(() => import('../pages/Settings/Settings'));
const Result = lazy(() => import('../pages/Result/Result'));

const withSuspense = (Component: React.LazyExoticComponent<() => JSX.Element>) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  { path: '/', element: withSuspense(Home) },
  { path: EXTRA_ROUTES.RESULT.path, element: withSuspense(Result) },
  { path: EXTRA_ROUTES.GAME.path, element: withSuspense(Game) },
  { path: APP_ROUTES.ABOUT.path, element: withSuspense(About) },
  { path: APP_ROUTES.SETTINGS.path, element: withSuspense(SettingsScreen) },
  { path: '*', element: withSuspense(NotFound) },
]);

export default router;
