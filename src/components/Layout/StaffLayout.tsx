import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  Calendar,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Moon,
  Sun,
  Gavel,
  DollarSign,
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

  // Active: match chính xác cho trang chủ, match route con cho các trang khác
  const isActive = (path: string) => {
    if (path === "/staff") {
      // Trang chủ chỉ active khi pathname chính xác là "/staff"
      return location.pathname === "/staff";
    }
    // Các trang khác match với route con
    return location.pathname.startsWith(path);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sidebar menu items (KHÔNG CÒN CONTRACT)
  const sidebarItems = [
    { path: "/staff", icon: Home, label: "Trang chủ" },
    { path: "/staff/appointments", icon: Calendar, label: "Quản lý lịch hẹn" },
    {
      path: "/staff/auction-management",
      icon: Gavel,
      label: "Phê duyệt đấu giá",
    },
    { path: "/staff/contracts", icon: FileText, label: "Hợp đồng" },
    {
      path: "/staff/deal-management",
      icon: DollarSign,
      label: "Tiến trình giao dịch",
    },
    { path: "/staff/users", icon: Users, label: "Quản lý người dùng" },
  ];

  const displayName = user?.fullName || user?.name || "Staff";

  return (
    <div
      className={`min-h-screen ${darkMode ? "dark" : ""} ${
        sidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-30 h-14">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white ml-4  ">
                Staff Portal
              </span>
            </div>

            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || "S"}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role === "admin"
                      ? "Admin"
                      : user?.role === "staff"
                      ? "Staff"
                      : ""}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {/* Shortcut to Users */}
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
      <div className={"flex pt-14"}>
        {/* Sidebar */}
        <aside
          className={`bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex-shrink-0 ${
            sidebarOpen ? "w-[20%]" : "w-0"
          } ${
            sidebarOpen ? "overflow-visible" : "overflow-hidden"
          } min-h-screen`}
        >
          <div className="p-6 h-full flex flex-col">
            <nav className="space-y-4 flex-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chế độ tối
                </span>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`transition-all duration-300 flex-shrink-0 ${
            sidebarOpen ? "w-[80%]" : "w-full"
          }`}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
