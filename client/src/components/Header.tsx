import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { APP_ROUTES } from '../constants/constants';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsOpen(false), [location]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const isActive = (path: string) => location.pathname === path;
  const navLinks = Object.values(APP_ROUTES);

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          shadow-lg backdrop-blur-md
          transition-all duration-500 ease-out
          ${isScrolled ? 'bg-primary-600/90' : 'bg-base-bg/90'}
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center space-x-3 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-base-text"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <span className="text-sm sm:text-base lg:text-lg font-black text-white">H</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="group-hover:text-primary-500 transition-colors duration-300">
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
                    relative px-4 py-2.5 rounded-xl text-sm lg:text-base font-semibold
                    transition-all duration-300 ease-out transform
                    hover:scale-105 hover:-translate-y-0.5
                    ${isActive(link.path)
                      ? 'text-white bg-primary-500 shadow-md'
                      : 'text-muted-text hover:text-base-text hover:bg-elevated-bg'
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
                md:hidden relative p-3 rounded-xl text-base-text 
                hover:bg-elevated-bg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-base-bg
                transition-all duration-300 ease-out
                ${isOpen ? 'bg-elevated-bg scale-95' : 'hover:scale-105'}
              `}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation menu"
            >
              <div className="relative w-6 h-6">
                <Menu
                  size={24}
                  className={`absolute inset-0 transition-all duration-500 ${isOpen ? 'rotate-180 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'}`}
                />
                <X
                  size={24}
                  className={`absolute inset-0 transition-all duration-500 ${isOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-180 opacity-0 scale-75'}`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ease-out ${isOpen ? 'visible' : 'invisible'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-60' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        />

        {/* Slide-in Menu */}
        <div
          className={`
            absolute top-0 right-0 h-full w-80 max-w-[85vw]
            bg-elevated-bg border-l border-muted-bg
            shadow-xl transform transition-transform duration-500 ease-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-muted-bg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-sm font-black text-white">H</span>
              </div>
              <span className="text-lg font-bold text-base-text">Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-muted-text hover:text-base-text hover:bg-muted-bg transition-colors duration-200"
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
                    ? 'text-white bg-primary-500 shadow-md'
                    : 'text-muted-text hover:text-base-text hover:bg-muted-bg'
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
        </div>
      </div>
    </>
  );
};

export default Header;