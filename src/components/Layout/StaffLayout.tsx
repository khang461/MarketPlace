/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";

interface StaffLayoutProps {
  children: React.ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const toggleDarkMode = () => setDarkMode((d) => !d);
  const toggleDropdown = () => setDropdownOpen((o) => !o);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  // Active: match cả route con
  const isActive = (path: string) => location.pathname.startsWith(path);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sidebar menu items (KHÔNG CÒN CONTRACT)
  const sidebarItems = [
    { path: "/staff", icon: Home, label: "Trang chủ" },
    { path: "/staff/appointments", icon: Calendar, label: "Quản lý lịch hẹn" },
    { path: "/staff/users", icon: Users, label: "Quản lý người dùng" },
  ];

  const initials =
    (user?.fullName?.[0] || user?.name?.[0] || user?.email?.[0] || "S").toUpperCase();
  const displayName = user?.fullName || user?.name || "Staff";

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-30 h-14">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-4">
            <span className="text-xl font-bold text-gray-900 dark:text-white ml-4">
              Staff Portal
            </span>

            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{initials}</span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Staff</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {/* Shortcut to Users */}
                  <button
                    onClick={() => {
                      navigate("/staff/users");
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Users className="w-4 h-4 mr-3" />
                    Quản lý người dùng
                  </button>

                  <button
                    onClick={() => {
                      navigate("/staff/settings");
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Cài đặt
                  </button>

                  <hr className="my-1 border-gray-200 dark:border-gray-700" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex pt-14">
        {/* Sidebar */}
        <aside
          className={`bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-0"
          } overflow-hidden min-h-screen`}
        >
          <div className="p-6 h-full flex flex-col">
            <nav className="space-y-4 flex-1">
            <nav className="space-y-4 flex-1">
  <NavLink
    to="/staff"
    end   // CHỈ TRANG ROOT /staff MỚI CÓ end
    className={({ isActive }) =>
      `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`
    }
  >
    <Home className="w-5 h-5" />
    <span>Trang chủ</span>
  </NavLink>

  <NavLink
    to="/staff/appointments"
    className={({ isActive }) =>
      `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`
    }
  >
    <Calendar className="w-5 h-5" />
    <span>Quản lý lịch hẹn</span>
  </NavLink>

  <NavLink
    to="/staff/users"
    className={({ isActive }) =>
      `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`
    }
  >
    <Users className="w-5 h-5" />
    <span>Quản lý người dùng</span>
  </NavLink>
</nav>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
