import { RouterProvider } from 'react-router-dom';
import './App.css';
import router from './routes/router';
import { useSocketConnection } from './hooks/useSocketConnection';
import { useAuth } from './hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';

function App() {
  useAuth();            // syncs Better Auth session → Redux (authSlice + sessionSlice)
  useSocketConnection(); // connects socket with auth token
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
