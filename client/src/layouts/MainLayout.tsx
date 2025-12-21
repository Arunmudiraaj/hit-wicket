// layouts/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-base-bg">
      <Header />
      
      <main className="flex-1 pt-16 sm:pt-18 lg:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;