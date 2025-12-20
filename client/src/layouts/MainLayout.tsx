import Header from '../components/Header';
import { Outlet } from 'react-router-dom';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-base-bg">
      {/* Header - Fixed positioning is handled inside Header component */}
      <Header />

      {/* Main Content - Add padding for header */}
      <main className="bg-base-bg pt-16 sm:pt-18 lg:pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default MainLayout