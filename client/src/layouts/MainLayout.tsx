import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen p-4">
      <header>Header Here</header>
      <main className="mt-4">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;