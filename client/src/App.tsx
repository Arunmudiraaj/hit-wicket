import { RouterProvider } from 'react-router-dom';
import './App.css';
import router from './routes/router';
import { useSocketConnection } from './hooks/useSocketConnection';

function App() {
  useSocketConnection();
  return (
    <RouterProvider router={router} />
  );
}

export default App;
