import React, { useState, useEffect } from "react";
import {
  House,
  Users,
  ConciergeBell,
  Briefcase,
  ClipboardList,
  FileBox,
  BrickWall,
  IndianRupee,
  Newspaper,
  ShieldCheck,
  ChartBar,
  Settings,
  Calculator,
  Banknote,
  Wallet
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { usePermissions } from "../../contexts/PermissionsContext";

const Sidebar = ({
  isMobile,
  sidebarOpen,
  toggleSidebar,
  onHover,
  isExpanded,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasModuleAccess } = usePermissions();

  const userDataStr = localStorage.getItem("user_data");
  let userType = "admin"; // default fallback
  if (userDataStr) {
    try {
      const parsed = JSON.parse(userDataStr);
      if (parsed && parsed.user_type) {
        userType = parsed.user_type;
      }
    } catch (e) { }
  }

  const allMenuItems = [
    {
      icon: House,
      label: "Dashboard",
      path: "/",
    },
    {
      icon: Users,
      label: "Clients",
      path: "/clients",
      modules: ["client"],
    },
    {
      icon: Briefcase,
      label: "Staffs",
      path: "/staffs",
      modules: ["staff"],
    },
    {
      icon: Calculator,
      label: "CA",
      path: "/cas",
      modules: ["ca"],
    },
    {
      icon: ClipboardList,
      label: "My Orders",
      path: "/my-orders",
      modules: ["my_order"],
      roles: ["staff"],
    },
    {
      icon: FileBox,
      label: "Orders",
      path: "/orders",
      modules: ["order"],
    },
    {
      icon: ConciergeBell,
      label: "Services",
      path: "/services",
      modules: ["service"],
    },
    {
      icon: BrickWall,
      label: "Firms",
      path: "/firms",
      modules: ["firm"],
    },
    {
      icon: IndianRupee,
      label: "Payments",
      path: "/payments",
      modules: ["payment"],
    },
    {
      icon: Banknote,
      label: "Withdrawals",
      path: "/withdrawals",
      modules: ["payment"],
    },
    {
      icon: Wallet,
      label: "Wallet",
      path: "/wallet",
      modules: ["payment"],
    },
    {
      icon: Newspaper,
      label: "Blogs",
      path: "/blogs",
      modules: ["blog"],
    },
    {
      icon: ShieldCheck,
      label: "Permissions",
      path: "/permissions",
      modules: ["permission", "permissions", "permission_package"],
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      modules: ["setting"],
    },
    {
      icon: ChartBar,
      label: "Reports",
      path: "/report",
      modules: ["report"]
    }

  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.roles && !item.roles.includes(userType)) return false;
    if (!item.modules?.length) return true;
    return item.modules.some((module) => hasModuleAccess(module));
  });

  const isActiveRoute = (itemPath) => {
    return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
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
        <div
          className={`
          fixed left-0 top-16 z-30 w-72 h-[calc(100vh-4rem)]
          bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          overflow-y-auto overflow-x-hidden shadow-2xl dark:shadow-gray-950/50
        `}
        >
          <div className="p-4">
            {/* User Profile Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  A
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    admin@oomsadmin.com
                  </p>
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
                      flex items-center px-3 py-3 rounded-lg transition-all duration-200 mb-1
                      ${isActive
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
                      }
                    `}
                  >
                    <div
                      className={`
                      p-2 rounded-lg mr-3
                      ${isActive
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }
                    `}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
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
          flex items-center rounded-lg transition-all duration-200 group
          ${isExpandedState ? "px-3 py-2.5 gap-3" : "px-0 py-2.5 justify-center"}
          ${isActive
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
          }
        `}
        title={!isExpandedState ? item.label : ""}
      >
        <div
          className={`
          p-2 rounded-lg transition-all duration-200
          ${isExpandedState ? "" : "mx-auto"}
          ${isActive
              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400"
            }
        `}
        >
          <Icon className="w-4 h-4" />
        </div>
        {isExpandedState && (
          <>
            <span
              className={`flex-1 text-sm font-medium ${isActive ? "font-semibold" : ""}`}
            >
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
        fixed left-0 top-16 z-20 bg-white dark:bg-gray-900
        transition-all duration-300 ease-out
        ${isSidebarExpanded ? "w-64" : "w-16"}
        h-[calc(100vh-4rem)]
        shadow-lg dark:shadow-gray-950/50 border-r border-gray-200 dark:border-gray-700
        overflow-y-auto overflow-x-hidden
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 py-6 px-2">
          {menuItems.map((item) => renderMenuItem(item, isSidebarExpanded))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
