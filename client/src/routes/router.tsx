import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy, type JSX } from 'react';
import MainLayout from '../layouts/MainLayout';
import Loader from '../components/shared/Loader';

// Lazy-loaded route components
const Home = lazy(() => import('../pages/Home'));
const About = lazy(() => import('../pages/About'));
const NotFound = lazy(() => import('../pages/NotFound'));

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
      { path: 'about', element: withSuspense(About) },
      { path: '*', element: withSuspense(NotFound) },
    ],
  },
]);

export default router;
