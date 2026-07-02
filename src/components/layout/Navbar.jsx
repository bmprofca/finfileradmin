import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = ({
  toggleSidebar,
  isMobile,
  sidebarOpen,
  isDesktopSidebarExpanded,
}) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSidebarOpen = isMobile ? sidebarOpen : isDesktopSidebarExpanded;

  return (
    <>
      <nav className="sticky top-0 z-40 h-16 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-950/50 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="px-4 h-full">
          <div className="flex items-center justify-between h-full">

            {/* Left section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none flex-shrink-0
                  ${isSidebarOpen ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 rounded-lg transition-opacity duration-200 hover:opacity-90 focus:outline-none"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">FF</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                    FinFiler<span className="font-light text-gray-600 dark:text-gray-400">Admin</span>
                  </span>
                </div>
              </button>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 group focus:outline-none
                  bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                  border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500
                  hover:shadow-md active:scale-95"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                id="theme-toggle-btn"
              >
                {theme === 'dark' ? (
                  <Sun className="w-[18px] h-[18px] text-amber-400 group-hover:text-amber-300 transition-colors duration-200" />
                ) : (
                  <Moon className="w-[18px] h-[18px] text-slate-600 group-hover:text-indigo-600 transition-colors duration-200" />
                )}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex items-center space-x-3 p-1.5 pr-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
                      <span className="text-white font-bold text-sm">{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                    </div>
                    {/* Online dot */}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.user_type || "Administrator"}
                    </p>
                  </div>

                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors hidden md:block" />
                </button>

                {/* Dropdown Menu */}
                {openDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-sm shadow-xl dark:shadow-gray-950/50 border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                      {/* Mobile user info */}
                      <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold">{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || "Admin"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.user_type || "Administrator"}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => { setOpenDropdown(false); navigate('/profile'); }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                      >
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        My Profile
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;