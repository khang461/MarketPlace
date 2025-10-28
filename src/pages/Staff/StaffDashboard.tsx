import React from 'react';
import StaffLayout from '../../components/Layout/StaffLayout';
import { Calendar, FileText, Users, BarChart3 } from 'lucide-react';

const StaffDashboard: React.FC = () => {
  const stats = [
    { title: 'Tổng lịch hẹn', value: '24', icon: Calendar, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Hợp đồng chờ ký', value: '8', icon: FileText, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Người dùng mới', value: '156', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'Doanh thu tháng', value: '2.4M', icon: BarChart3, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Staff</h1>
          <p className="text-gray-600 mt-1">Tổng quan hệ thống quản lý</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="w-5 h-5 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Quản lý lịch hẹn</div>
                <div className="text-sm text-gray-600">Xem và quản lý tất cả lịch hẹn</div>
              </div>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="w-5 h-5 text-green-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Hợp đồng</div>
                <div className="text-sm text-gray-600">Quản lý hợp đồng và tài liệu</div>
              </div>
            </button>
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-5 h-5 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Người dùng</div>
                <div className="text-sm text-gray-600">Quản lý tài khoản người dùng</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Lịch hẹn mới được tạo</p>
                <p className="text-xs text-gray-500">2 phút trước</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Hợp đồng đã được ký</p>
                <p className="text-xs text-gray-500">15 phút trước</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Người dùng mới đăng ký</p>
                <p className="text-xs text-gray-500">1 giờ trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
