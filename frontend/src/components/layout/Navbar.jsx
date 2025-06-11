import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Settings, Menu, X } from 'lucide-react';
import Button from '../ui/Button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">FriendScore</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                to="/dashboard"
                className="text-gray-900 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/groups"
                className="text-gray-500 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Groups
              </Link>
              <Link
                to="/events"
                className="text-gray-500 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Events
              </Link>
              <Link
                to="/leaderboard"
                className="text-gray-500 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          {/* Right side - Profile and mobile menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={toggleProfile}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </button>

              {/* Profile dropdown menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={16} className="mr-3" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings size={16} className="mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                Dashboard
              </Link>
              <Link
                to="/groups"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                Groups
              </Link>
              <Link
                to="/events"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                Events
              </Link>
              <Link
                to="/leaderboard"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                Leaderboard
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;