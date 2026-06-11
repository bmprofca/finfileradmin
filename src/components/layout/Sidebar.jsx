import React, { useState, useEffect } from 'react';
import { 
  House, 
  Users, 
  ConciergeBell, 
  LifeBuoy, 
  BarChart3, 
  Settings,
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = ({ isMobile, sidebarOpen, toggleSidebar, onHover, isExpanded }) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      icon: House,
      label: 'Dashboard',
      path: '/',
    },
    {
      icon: Users,
      label: 'Users',
      path: '/users',
    },
    {
      icon: ConciergeBell,
      label: 'Services',
      path: '/services',
    },
    {
      icon: BarChart3,
      label: 'Reports',
      path: '/reports',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
    },
  ];

  const isActiveRoute = (itemPath) => {
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  useEffect(() => {
    if (onHover && !isMobile) {
      onHover(isHovered);
    }
  }, [isHovered, onHover, isMobile]);

  // ================= MOBILE SIDEBAR =================
  if (isMobile) {
    return (
      <>
        <div className={`
          fixed left-0 top-16 z-30 w-72 h-[calc(100vh-4rem)]
          bg-white transform transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          overflow-y-auto overflow-x-hidden shadow-2xl
        `}>
          <div className="p-4">
            {/* User Profile Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Admin User</p>
                  <p className="text-xs text-gray-500">admin@oomsadmin.com</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const isActive = isActiveRoute(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => toggleSidebar()}
                    className={`
                      flex items-center px-3 py-3 rounded-xl transition-all duration-200 mb-1
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg mr-3
                      ${isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <LifeBuoy className="text-blue-600 mb-2" size={20} />
                <p className="text-xs font-semibold text-gray-700 mb-1">Need Help?</p>
                <p className="text-xs text-gray-500">Contact our support team</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ================= DESKTOP SIDEBAR =================
  const isSidebarExpanded = isExpanded;

  const renderMenuItem = (item, isExpandedState) => {
    const isActive = isActiveRoute(item.path);
    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        to={item.path}
        className={`
          flex items-center rounded-xl transition-all duration-200 group
          ${isExpandedState ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'}
          ${isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }
        `}
        title={!isExpandedState ? item.label : ''}
      >
        <div className={`
          p-2 rounded-lg transition-all duration-200
          ${isExpandedState ? '' : 'mx-auto'}
          ${isActive
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'
          }
        `}>
          <Icon className="w-4 h-4" />
        </div>
        {isExpandedState && (
          <>
            <span className={`flex-1 text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            )}
          </>
        )}
        {!isExpandedState && isActive && (
          <span className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></span>
        )}
      </Link>
    );
  };

  const handleMouseEnter = () => {
    if (!isSidebarExpanded) {
      setIsHovered(true);
      if (onHover) onHover(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onHover) onHover(false);
  };

  return (
    <div
      className={`
        fixed left-0 top-16 z-20 bg-white
        transition-all duration-300 ease-out
        ${isSidebarExpanded ? 'w-64' : 'w-16'}
        h-[calc(100vh-4rem)]
        shadow-lg border-r border-gray-200
        overflow-y-auto overflow-x-hidden
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">


        <nav className="flex-1 py-6 px-2">
          {menuItems.map((item) => renderMenuItem(item, isSidebarExpanded))}
        </nav>

        {/* Footer Section */}
        {isSidebarExpanded && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gray-50 rounded-xl p-3">
              <LifeBuoy className="text-blue-600 mb-2" size={16} />
              <p className="text-xs font-semibold text-gray-700">Need Help?</p>
              <p className="text-xs text-gray-500">Support</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;