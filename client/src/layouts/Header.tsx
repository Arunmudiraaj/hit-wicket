import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? 'text-blue-400 font-semibold' : 'text-white';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className=" text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-white hover:text-blue-400 transition-colors"
          >
            HitWicket
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            <Link
              to="/about"
              className={`hover:text-blue-400 transition ${isActive('/about')}`}
            >
              About
            </Link>
            <Link
              to="/leaderboard"
              className={`hover:text-blue-400 transition ${isActive('/leaderboard')}`}
            >
              Leaderboard
            </Link>
          </nav>

          {/* Hamburger */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <div
          className={`md:hidden px-4 pt-2 pb-4 bg-gray-800 transition-all duration-300 ease-in-out ${
            isOpen ? 'block' : 'hidden'
          }`}
        >
          <Link
            to="/about"
            className="block py-2 text-white hover:text-blue-400"
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          <Link
            to="/leaderboard"
            className="block py-2 text-white hover:text-blue-400"
            onClick={() => setIsOpen(false)}
          >
            Leaderboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Header;
