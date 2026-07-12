import { RouterProvider } from 'react-router-dom';
import './App.css';
import router from './routes/router';
import { useSocketConnection } from './hooks/useSocketConnection';
import { useAuth } from './hooks/useAuth';
import { useAppSelector } from './hooks/useTypedRedux';
import { AlertCircle } from 'lucide-react';

function GlobalToast() {
  const globalError = useAppSelector(state => state.session.globalError);
  
  if (!globalError) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <p className="font-medium">{globalError}</p>
      </div>
    </div>
  );
}

function App() {
  useAuth();            // syncs Better Auth session → Redux (authSlice + sessionSlice)
  useSocketConnection(); // connects socket with auth token
  return (
    <>
      <RouterProvider router={router} />
      <GlobalToast />
    </>
  );
}

export default App;
