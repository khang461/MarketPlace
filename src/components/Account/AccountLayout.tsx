import React from "react";
import { User, Heart, Clock, Package } from "lucide-react";

interface Tab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AccountLayoutProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "profile", name: "Hồ sơ", icon: User },
  { id: "listings", name: "Tin đăng", icon: Package },
  // { id: "chat", name: "Tin nhắn", icon: MessageCircle },
  { id: "favorites", name: "Yêu thích", icon: Heart },
  { id: "transactions", name: "Giao dịch", icon: Clock },
];

const AccountLayout: React.FC<AccountLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-24">
        {/* Header */}
        <div className="mb-8 ">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tài khoản của tôi
          </h1>
          <p className="text-gray-600 mb-7">
            Quản lý thông tin cá nhân và hoạt động
          </p>
          <div className="lg:w-70">
            <div className="bg-white rounded-lg shadow-md p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
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
        </div>

        {/* Main Content */}
        <div className="flex-1 pb-9">{children}</div>
      </div>
    </div>
  );
};

export default AccountLayout;
