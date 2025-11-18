import React from "react";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../components/Layout/StaffLayout";
import {
  Calendar,
  FileText,
  Users,
  BarChart3,
  Gavel,
  RefreshCw,
  Clock,
  CheckCircle,
} from "lucide-react";

const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Dummy stats
  const stats = [
    {
      title: "Tổng lịch hẹn",
      value: "24",
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Người dùng",
      value: "156",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Hợp đồng chờ ký",
      value: "8",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Doanh thu tháng",
      value: "2.4M",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const activities = [
    {
      label: "Lịch hẹn mới được tạo",
      when: "2 phút trước",
      color: "bg-blue-600",
    },
    {
      label: "Hợp đồng đã được ký",
      when: "15 phút trước",
      color: "bg-green-600",
    },
    {
      label: "Người dùng mới đăng ký",
      when: "1 giờ trước",
      color: "bg-yellow-600",
    },
  ];

  const fetchData = () => {
    // TODO: sau này gọi API ở đây
    console.log("Refresh dashboard data");
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Staff
            </h1>
            <p className="text-gray-600 mt-1">Tổng quan hệ thống quản lý</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Một số card chi tiết */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chờ xử lý */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Lịch hẹn chờ xử lý
                </p>
                <p className="text-2xl font-bold text-gray-900">10</p>
              </div>
            </div>
          </div>

          {/* Đã hoàn thành */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Lịch hẹn hoàn thành
                </p>
                <p className="text-2xl font-bold text-gray-900">14</p>
              </div>
            </div>
          </div>

          {/* Người dùng mới 7 ngày */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Người dùng mới (7 ngày)
                </p>
                <p className="text-2xl font-bold text-gray-900">32</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/staff/appointments")}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">
                  Quản lý lịch hẹn
                </div>
                <div className="text-sm text-gray-600">
                  Xem và quản lý tất cả lịch hẹn
                </div>
              </div>
            </button>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="w-5 h-5 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Hợp đồng</div>
                <div className="text-sm text-gray-600">
                  Quản lý hợp đồng và tài liệu
                </div>
              </div>
            </button>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-5 h-5 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Người dùng</div>
                <div className="text-sm text-gray-600">
                  Quản lý tài khoản người dùng
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/staff/auction-management")}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors hover:border-blue-300"
            >
              <Gavel className="w-5 h-5 text-indigo-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">
                  Phê duyệt đấu giá
                </div>
                <div className="text-sm text-gray-600">
                  Quản lý phiên đấu giá chờ duyệt
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hoạt động gần đây
          </h2>
          <div className="space-y-3">
            {activities.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-2 h-2 rounded-full mr-3 ${act.color}`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{act.label}</p>
                  <p className="text-xs text-gray-500">{act.when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
