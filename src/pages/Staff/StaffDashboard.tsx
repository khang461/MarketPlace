import React, { useEffect, useMemo, useState } from "react";
import StaffLayout from "../../components/Layout/StaffLayout";
import {
  Calendar,
  Users as UsersIcon,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../config/api";

// Kiểu dữ liệu (tối thiểu) dựa theo code bạn đã dùng trước đó
type AptStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
interface Appointment {
  _id: string;
  scheduledDate?: string;
  createdAt?: string;
  status: AptStatus;
  location?: string;
}

type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
interface IUser {
  _id: string;
  fullName?: string;
  name?: string;
  email: string;
  createdAt?: string;
  status?: UserStatus;
}

const StaffDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErr(null);

      // Lịch hẹn dành cho staff
      const aptRes = await api.get("/appointments/staff");
      // Có thể backend của bạn trả { success, data } hay trả thẳng mảng -> xử lý mềm
      const aptList: Appointment[] = Array.isArray(aptRes.data)
        ? aptRes.data
        : aptRes.data?.data || aptRes.data?.appointments || [];

      // Users
      const userRes = await api.get("/users");
      const userList: IUser[] = Array.isArray(userRes.data)
        ? userRes.data
        : userRes.data?.data || userRes.data?.users || [];

      setAppointments(aptList || []);
      setUsers(userList || []);
    } catch (e) {
      console.error(e);
      setErr("Không thể tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== TÍNH TOÁN SỐ LIỆU ======
  const totalAppointments = appointments.length;
  const totalUsers = users.length;

  const countByStatus = useMemo(() => {
    const map = { CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 } as Record<
      "CONFIRMED" | "COMPLETED" | "CANCELLED",
      number
    >;
    for (const a of appointments) {
      if (a.status === "CONFIRMED") map.CONFIRMED++;
      if (a.status === "COMPLETED") map.COMPLETED++;
      if (a.status === "CANCELLED") map.CANCELLED++;
    }
    return map;
  }, [appointments]);

  const usersNew7d = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    return users.filter((u) => {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      return d ? d >= sevenDaysAgo : false;
    }).length;
  }, [users]);

  // ====== HOẠT ĐỘNG GẦN ĐÂY ======
  // Gộp 2 nguồn: appointment created & user created. Lấy max 8 dòng gần nhất.
  // Sắp xếp theo thời gian desc.
  type ActivityItem =
    | { type: "appointment"; when: Date; label: string; color: string }
    | { type: "user"; when: Date; label: string; color: string };

  const activities: ActivityItem[] = useMemo(() => {
    const aptActs: ActivityItem[] = (appointments || [])
      .map((a) => ({
        type: "appointment" as const,
        when: new Date(a.createdAt || a.scheduledDate || Date.now()),
        label: `Lịch hẹn ${a.status === "CONFIRMED" ? "mới" : a.status?.toLowerCase() || "mới"} được tạo`,
        color:
          a.status === "CONFIRMED"
            ? "bg-blue-600"
            : a.status === "COMPLETED"
            ? "bg-green-600"
            : a.status === "CANCELLED"
            ? "bg-red-600"
            : "bg-gray-500",
      }))
      .filter(Boolean);

    const userActs: ActivityItem[] = (users || [])
      .map((u) => ({
        type: "user" as const,
        when: new Date(u.createdAt || Date.now()),
        label: `Người dùng mới đăng ký: ${u.fullName || u.name || u.email}`,
        color: "bg-purple-600",
      }))
      .filter(Boolean);

    const sorted = [...aptActs, ...userActs].sort((a, b) => b.when.getTime() - a.when.getTime());
    return sorted.slice(0, 8);
  }, [appointments, users]);

  const timeFromNow = (d?: Date) => {
    if (!d) return "—";
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600">Đang tải dữ liệu…</span>
        </div>
      </StaffLayout>
    );
  }

  if (err) {
    return (
      <StaffLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
              <p className="mt-1 text-sm text-red-700">{err}</p>
            </div>
          </div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Staff</h1>
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

        {/* Stats Cards — CHỈ dùng Users & Appointments, bỏ contract/doanh thu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tổng lịch hẹn */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng lịch hẹn</p>
                <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
              </div>
            </div>
          </div>

          {/* Chờ xử lý (CONFIRMED) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lịch hẹn chờ xử lý</p>
                <p className="text-2xl font-bold text-gray-900">{countByStatus.CONFIRMED}</p>
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
                <p className="text-sm font-medium text-gray-600">Lịch hẹn hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">{countByStatus.COMPLETED}</p>
              </div>
            </div>
          </div>

          {/* Tổng người dùng + mới 7 ngày */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Người dùng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalUsers}
                  <span className="ml-2 text-sm font-medium text-purple-600">
                    +{usersNew7d}/7 ngày
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/staff/appointments"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-blue-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Quản lý lịch hẹn</div>
                <div className="text-sm text-gray-600">Xem và quản lý tất cả lịch hẹn</div>
              </div>
            </Link>

            <Link
              to="/staff/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UsersIcon className="w-5 h-5 text-purple-600 mr-3" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Quản lý người dùng</div>
                <div className="text-sm text-gray-600">Xem & cập nhật trạng thái người dùng</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
            <div className="text-sm text-gray-500">
              {activities.length} mục • cập nhật theo thời gian thực từ API
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có hoạt động nào gần đây.</div>
          ) : (
            <div className="space-y-3">
              {activities.map((act, idx) => (
                <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mr-3 ${act.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{act.label}</p>
                    <p className="text-xs text-gray-500">{timeFromNow(act.when)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
