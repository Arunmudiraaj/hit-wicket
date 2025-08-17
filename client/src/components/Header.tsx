import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const isActive = (path: string) =>
    location.pathname === path;

  const navLinks = [
    { path: '/about', label: 'About' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          bg-primary-dark border-b border-gray-800
          transition-all duration-300 ease-out
          ${isScrolled 
            ? 'bg-gray-900/95 backdrop-blur-lg shadow-2xl border-gray-700' 
            : 'bg-gray-900'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center space-x-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-primary-light rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <span className="text-sm sm:text-base lg:text-lg font-black text-white">H</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="group-hover:text-indigo-300 transition-colors duration-300">
                HitWicket
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    relative px-4 py-2.5 lg:px-6 lg:py-3 rounded-xl text-sm lg:text-base font-semibold
                    transition-all duration-300 ease-out transform
                    hover:scale-105 hover:-translate-y-0.5
                    ${isActive(link.path)
                      ? 'text-white bg-secondary shadow-lg shadow-indigo-500/25' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800 hover:shadow-lg'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className={`
                md:hidden relative p-3 rounded-xl text-white 
                hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900
                transition-all duration-300 ease-out
                ${isOpen ? 'bg-gray-800 scale-95' : 'hover:scale-105'}
              `}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
            >
              <div className="relative w-6 h-6">
                <Menu
                  size={24}
                  className={`absolute inset-0 transition-all duration-500 ${
                    isOpen ? 'rotate-180 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'
                  }`}
                />
                <X
                  size={24}
                  className={`absolute inset-0 transition-all duration-500 ${
                    isOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-180 opacity-0 scale-75'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <div
        className={`
          md:hidden fixed inset-0 z-40 transition-all duration-300 ease-out
          ${isOpen ? 'visible' : 'invisible'}
        `}
      >
        {/* Backdrop */}
        <div
          className={`
            absolute inset-0 bg-black transition-opacity duration-300
            ${isOpen ? 'opacity-60' : 'opacity-0'}
          `}
          onClick={() => setIsOpen(false)}
        />
        
        {/* Slide-in Menu */}
        <div
          className={`
            absolute top-0 right-0 h-full w-80 max-w-[85vw]
            bg-gray-900 border-l border-gray-800
            shadow-2xl transform transition-transform duration-500 ease-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-sm font-black text-white">H</span>
              </div>
              <span className="text-lg font-bold text-white">Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Menu Links */}
          <div className="px-6 py-8 space-y-2">
            {navLinks.map((link, index) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  group flex items-center justify-between px-4 py-4 rounded-xl text-base font-semibold
                  transition-all duration-300 ease-out transform hover:scale-[0.98]
                  ${isActive(link.path)
                    ? 'text-white bg-secondary shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }
                `}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  opacity: isOpen ? 1 : 0,
                  transform: `translateX(${isOpen ? 0 : '20px'})`
                }}
                onClick={() => setIsOpen(false)}
              >
                <span>{link.label}</span>
                {isActive(link.path) && (
                  <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Footer */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="text-center text-xs text-gray-500 border-t border-gray-800 pt-4">
              © 2024 HitWicket. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-16 sm:h-18 lg:h-20"></div>
    </>
  );
};

export default Header;