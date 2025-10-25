import React, { useState, useEffect } from "react";
import { User, Heart, Clock, Edit, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../config/api";
import { mockVehicles, mockTransactions } from "../data/mockData";

interface UserData {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  role?: string;
  status?: string;
  stats?: {
    soldCount?: number;
    buyCount?: number;
    cancelRate?: number;
    responseTime?: number;
    completionRate?: number;
  };
}

const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      // Lấy userId từ localStorage
      const userId = localStorage.getItem("userId");

      if (!isAuthenticated || !userId) {
        navigate("/signin");
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching user data for ID:", userId);
        const token = localStorage.getItem("token");
        console.log("Token:", token ? "exists" : "not found");

        const response = await api.get(`/users/${userId}`);
        console.log("User data response:", response.data);

        // Backend có thể trả về data trực tiếp hoặc trong một object
        const userData = response.data.user || response.data;
        setUserData(userData);
      } catch (error: unknown) {
        console.error("Error fetching user data:", error);
        const axiosError = error as {
          response?: { status?: number; data?: unknown };
        };
        console.error("Error response:", axiosError.response?.data);

        // Nếu lỗi 401 (Unauthorized), redirect về trang đăng nhập
        if (axiosError.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userId");
          navigate("/signin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, user, navigate]);

  const userListings = mockVehicles.filter(
    (v) => v.sellerId === (userData?._id || user?.id)
  );
  const userTransactions = mockTransactions.filter(
    (t) => t.buyerId === (userData?._id || user?.id)
  );

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đăng nhập tài khoản
            </h1>
            <p className="text-gray-600">
              Đăng nhập để quản lý tin đăng và giao dịch
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/signin"
              className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              Đăng nhập
            </Link>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const currentUser: UserData = userData || {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    avatar: user?.avatar,
  };

  const tabs = [
    { id: "profile", name: "Hồ sơ", icon: User },
    { id: "listings", name: "Tin đăng", icon: Package },
    { id: "favorites", name: "Yêu thích", icon: Heart },
    { id: "transactions", name: "Giao dịch", icon: Clock },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName || currentUser.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-600">
                      {(
                        currentUser?.fullName ||
                        currentUser?.name ||
                        "U"
                      ).charAt(0)}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {currentUser?.fullName || currentUser?.name}
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <strong>Email:</strong> {currentUser?.email}
                    </p>
                    <p>
                      <strong>Số điện thoại:</strong>{" "}
                      {currentUser?.phone || "Chưa cập nhật"}
                    </p>
                    <p>
                      <strong>Ngày tham gia:</strong>{" "}
                      {currentUser?.createdAt
                        ? new Date(currentUser.createdAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Vai trò:</strong>{" "}
                      {currentUser?.role === "ADMIN"
                        ? "Quản trị viên"
                        : "Người dùng"}
                    </p>
                    <p>
                      <strong>Trạng thái:</strong>{" "}
                      <span
                        className={
                          currentUser?.status === "ACTIVE"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {currentUser?.status === "ACTIVE"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {currentUser?.stats?.soldCount || 0}
                </h3>
                <p className="text-gray-600">Đã bán</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {currentUser?.stats?.buyCount || 0}
                </h3>
                <p className="text-gray-600">Đã mua</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <User className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {currentUser?.stats?.cancelRate || 0}%
                </h3>
                <p className="text-gray-600">Tỷ lệ hủy</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {currentUser?.stats?.responseTime || 0}
                </h3>
                <p className="text-gray-600">Thời gian phản hồi</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Package className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {currentUser?.stats?.completionRate || 0}%
                </h3>
                <p className="text-gray-600">Tỷ lệ hoàn thành</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <User className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {currentUser?.role === "ADMIN"
                    ? "Quản trị viên"
                    : "Người dùng"}
                </h3>
                <p className="text-gray-600">Vai trò</p>
              </div>
            </div>
          </div>
        );

      case "listings":
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Tin đăng của tôi</h2>
              <span className="text-sm text-gray-600">
                {userListings.length} tin đăng
              </span>
            </div>

            {userListings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Bạn chưa có tin đăng nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="border rounded-lg p-4 flex items-center space-x-4"
                  >
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-20 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{listing.title}</h3>
                      <p className="text-blue-600 font-medium">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(listing.price)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Đăng ngày{" "}
                        {new Date(listing.postedDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          listing.status === "available"
                            ? "bg-green-100 text-green-800"
                            : listing.status === "sold"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {listing.status === "available"
                          ? "Đang bán"
                          : listing.status === "sold"
                          ? "Đã bán"
                          : "Đang xử lý"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "favorites":
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Sản phẩm yêu thích</h2>
            </div>

            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có sản phẩm yêu thích</p>
            </div>
          </div>
        );

      case "transactions":
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Lịch sử giao dịch</h2>
            </div>

            {userTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">
                        {transaction.vehicleTitle}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status === "completed"
                          ? "Hoàn thành"
                          : transaction.status === "pending"
                          ? "Đang xử lý"
                          : "Đã hủy"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Giá trị:</strong>{" "}
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(transaction.amount)}
                      </p>
                      <p>
                        <strong>Phương thức:</strong>{" "}
                        {transaction.paymentMethod}
                      </p>
                      <p>
                        <strong>Ngày giao dịch:</strong>{" "}
                        {new Date(transaction.date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tài khoản của tôi
          </h1>
          <p className="text-gray-600">
            Quản lý thông tin cá nhân và hoạt động
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-md p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
