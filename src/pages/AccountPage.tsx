import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../config/api";
import { UserData, Transaction } from "../types/account";
import { mockTransactions } from "../data/mockData";
import AccountLayout from "../components/Account/AccountLayout";
import ProfileTab from "../components/Account/ProfileTab";
import ListingsTab from "../components/Account/ListingsTab";
import ChatTab from "../components/Account/ChatTab";
import FavoritesTab from "../components/Account/FavoritesTab";
import TransactionsTab from "../components/Account/TransactionsTab";

const AccountPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "profile"
  );
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Debug log
  console.log("AccountPage - isAuthenticated:", isAuthenticated);
  console.log("AccountPage - user:", user);
  console.log("AccountPage - user.role:", user?.role);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        navigate("/signin");
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get("/profiles");
        setUserData(response.data);
      } catch (error: unknown) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, navigate]);

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

  const userTransactions: Transaction[] = mockTransactions.filter(
    (t) => t.buyerId === (userData?._id || user?.id)
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab userData={userData} onUpdate={setUserData} />;

      case "listings":
        return <ListingsTab />;

      case "chat":
        return <ChatTab />;

      case "favorites":
        return <FavoritesTab />;

      case "transactions":
        return <TransactionsTab transactions={userTransactions} />;

      default:
        return null;
    }
  };

  return (
    <AccountLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTabContent()}
    </AccountLayout>
  );
};

export default AccountPage;
