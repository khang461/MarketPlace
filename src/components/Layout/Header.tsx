import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  User,
  MessageSquare,
  Plus,
  LogOut,
  Wallet,
  FileText,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../config/api";

interface SearchSuggestion {
  query: string;
  count: number;
  lastSearched: string;
}

interface SearchHistoryItem {
  _id: string;
  searchQuery: string;
  searchDate: string;
  resultsCount: number;
}

interface PopularSearch {
  query: string;
  count: number;
  category: string;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  // Reset search query khi chuyển trang (trừ trang search)
  useEffect(() => {
    if (!location.pathname.startsWith("/search")) {
      setSearchQuery("");
      setShowSuggestions(false);
    }
  }, [location.pathname]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search history when component mounts (nếu user đã đăng nhập)
  useEffect(() => {
    const fetchSearchHistory = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await api.get("/search/history", {
          params: { limit: "5" },
        });
        setSearchHistory(response.data.data || []);
      } catch (error) {
        console.error("Error fetching search history:", error);
      }
    };

    fetchSearchHistory();
  }, [isAuthenticated]);

  // Fetch popular searches
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await api.get("/search/popular", {
          params: { limit: "5" },
        });
        setPopularSearches(response.data.data || []);
      } catch (error) {
        console.error("Error fetching popular searches:", error);
      }
    };

    fetchPopularSearches();
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await api.get("/notifications/unread-count");
        if (response.data.success) {
          setUnreadNotifications(response.data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
        // Mock data for demo
      }
    };

    fetchUnreadNotifications();
  }, [isAuthenticated]);

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        // Chỉ sử dụng API /search/suggestions
        const response = await api.get("/search/suggestions", {
          params: {
            keyword: searchQuery.trim(),
            limit: "8",
          },
        });

        setSuggestions(response.data.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce 300ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Lưu lịch sử tìm kiếm nếu user đã đăng nhập
      if (isAuthenticated) {
        saveSearchToHistory(searchQuery.trim());
      }
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const query = suggestion.query;
    setSearchQuery(query);

    // Lưu lịch sử tìm kiếm nếu user đã đăng nhập
    if (isAuthenticated) {
      saveSearchToHistory(query);
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
  };

  // Lưu lịch sử tìm kiếm vào backend
  const saveSearchToHistory = async (query: string) => {
    try {
      await api.post("/search/history/save", {
        searchQuery: query,
        searchType: "listing",
      });

      // Refresh search history
      const response = await api.get("/search/history", {
        params: { limit: "5" },
      });
      setSearchHistory(response.data.data || []);
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              MarketPlace
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    setShowSuggestions(true);
                  } else if (searchQuery.length === 0) {
                    // Hiển thị search history và popular searches khi chưa gõ gì
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Tìm kiếm xe, pin, phụ kiện..."
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {searchQuery.length === 0 ? (
                    // Hiển thị search history và popular searches khi chưa gõ
                    <div>
                      {/* Search History */}
                      {isAuthenticated && searchHistory.length > 0 && (
                        <div className="border-b border-gray-200">
                          <div className="px-4 py-2 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                              Lịch sử tìm kiếm
                            </p>
                          </div>
                          <ul>
                            {searchHistory.map((item) => (
                              <li
                                key={item._id}
                                onClick={() =>
                                  handleHistoryClick(item.searchQuery)
                                }
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                              >
                                <span className="text-gray-700">
                                  {item.searchQuery}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.resultsCount} kết quả
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Popular Searches */}
                      {popularSearches.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                              Tìm kiếm phổ biến
                            </p>
                          </div>
                          <ul>
                            {popularSearches.map((item, index) => (
                              <li
                                key={index}
                                onClick={() => handleHistoryClick(item.query)}
                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                              >
                                <span className="text-gray-700">
                                  {item.query}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                                  {item.category === "popular"
                                    ? "Phổ biến"
                                    : item.category === "trending"
                                    ? "Xu hướng"
                                    : "Mới"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Empty state */}
                      {(!isAuthenticated || searchHistory.length === 0) &&
                        popularSearches.length === 0 && (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">Bắt đầu tìm kiếm...</p>
                          </div>
                        )}
                    </div>
                  ) : isLoadingSuggestions ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="mt-2 text-sm">Đang tìm kiếm...</p>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul className="py-2">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {suggestion.query}
                              </p>
                              <p className="text-sm text-gray-500">
                                {suggestion.count} lần tìm kiếm
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(
                                suggestion.lastSearched
                              ).toLocaleDateString("vi-VN")}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">Không tìm thấy kết quả</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Trang chủ
            </Link>
            <Link
              to="/search"
              className="text-gray-700 hover:text-blue-600 font-medium"
            >
              Tìm kiếm
            </Link>
            <Link
              to="/post-listing"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng tin</span>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <div className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 cursor-pointer">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>

                {/* Dropdown Menu - Shows on hover */}
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="font-medium text-gray-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Tài khoản
                  </Link>
                  <Link
                    to="/wallet"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Ví của tôi</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2 relative"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Yêu cầu đặt cọc</span>
                    {unreadNotifications > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      Swal.fire({
                        icon: "success",
                        title: "Đã đăng xuất!",
                        text: "Đăng xuất thành công!",
                        confirmButtonColor: "#2563eb",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                      setTimeout(() => navigate("/signin"), 1500);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/signin" className="text-gray-700 hover:text-blue-600">
                <User className="w-6 h-6" />
              </Link>
            )}


            <Link to="/support" className="text-gray-700 hover:text-blue-600">
              <MessageSquare className="w-6 h-6" />
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              <Link
                to="/"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                to="/search"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Tìm kiếm
              </Link>
              <Link
                to="/post-listing"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng tin
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 border-t border-gray-200 mt-2 pt-2">
                    <p className="font-medium text-gray-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <Link
                    to="/account"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Tài khoản
                  </Link>
                  <Link
                    to="/wallet"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Ví của tôi</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center space-x-2 relative"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Yêu cầu đặt cọc</span>
                    {unreadNotifications > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/support"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hỗ trợ
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                      Swal.fire({
                        icon: "success",
                        title: "Đã đăng xuất!",
                        text: "Đăng xuất thành công!",
                        confirmButtonColor: "#2563eb",
                        timer: 1500,
                        showConfirmButton: false,
                      });
                      setTimeout(() => navigate("/"), 1500);
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-lg flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/support"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Hỗ trợ
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
