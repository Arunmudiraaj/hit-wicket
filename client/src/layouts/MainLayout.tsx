import React from 'react'
import Header from '../components/Header';
import { Link, Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header - Fixed positioning is handled inside Header component */}
      <Header />
      
      {/* Main Content - Now properly positioned */}
     <main className="flex-1 bg-primary pt-16 sm:pt-18 lg:pt-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
    <Outlet />
  </div>
</main>


      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} HitWicket. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <Link 
                to="/privacy" 
                className="hover:text-white transition-colors duration-200"
              >
                Privacy
              </Link>
              <span className="text-gray-600">•</span>
              <Link 
                to="/terms" 
                className="hover:text-white transition-colors duration-200"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout