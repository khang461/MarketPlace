import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserAppointments,
  type Appointment,
} from "../../config/appointmentAPI";
import { useAuth } from "../../contexts/AuthContext";
import { Calendar, MapPin, User, Store, Filter } from "lucide-react";

export default function AppointmentsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId =
    (user as { _id?: string; id?: string })?._id ||
    (user as { _id?: string; id?: string })?.id;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<
    "all" | "AUCTION" | "DEPOSIT" | "OTHER"
  >("all");
  const [filterRole, setFilterRole] = useState<"all" | "buyer" | "seller">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await getUserAppointments({ page: 1, limit: 100 });
      const allAppointments = response.data || response.appointments || [];
      setAppointments(allAppointments);
    } catch (error) {
      console.error("❌ Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const buyerIdValue =
      typeof apt.buyerId === "object" ? apt.buyerId._id : apt.buyerId;
    const sellerIdValue =
      typeof apt.sellerId === "object" ? apt.sellerId._id : apt.sellerId;

    const isBuyer = buyerIdValue === userId;
    const isSeller = sellerIdValue === userId;

    // Filter by type (AUCTION, DEPOSIT, OTHER)
    if (filterType !== "all" && apt.appointmentType !== filterType)
      return false;

    // Filter by role
    if (filterRole === "buyer" && !isBuyer) return false;
    if (filterRole === "seller" && !isSeller) return false;

    // Filter by status
    if (filterStatus !== "all" && apt.status !== filterStatus) return false;

    return true;
  });

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-green-100 text-green-800 border-green-200",
    RESCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    COMPLETED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const statusLabels = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    RESCHEDULED: "Đã dời lịch",
    CANCELLED: "Đã hủy",
    COMPLETED: "Đã hoàn thành",
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const buyerIdValue =
      typeof appointment.buyerId === "object"
        ? appointment.buyerId._id
        : appointment.buyerId;
    const isBuyer = buyerIdValue === userId;

    // Icon and label based on appointment type
    const typeConfig = {
      AUCTION: {
        icon: "🏆",
        label: "Đấu giá",
        bgColor: "bg-yellow-50 border-yellow-200",
      },
      DEPOSIT: {
        icon: "💰",
        label: "Đặt cọc",
        bgColor: "bg-blue-50 border-blue-200",
      },
      OTHER: {
        icon: "📋",
        label: "Khác",
        bgColor: "bg-gray-50 border-gray-200",
      },
    };

    const typeInfo =
      typeConfig[appointment.appointmentType] || typeConfig.OTHER;

    return (
      <div
        key={appointment._id}
        className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${typeInfo.bgColor}`}
        onClick={() => navigate(`/appointments/${appointment._id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{typeInfo.icon}</span>
              <h3 className="font-bold text-lg">
                {isBuyer ? "Mua xe" : "Bán xe"} - {typeInfo.label}
              </h3>
              {isBuyer ? (
                <User className="w-4 h-4 text-blue-600" />
              ) : (
                <Store className="w-4 h-4 text-purple-600" />
              )}
            </div>

            {isBuyer ? (
              <div>
                <p className="text-sm text-gray-600">
                  Người bán:{" "}
                  <span className="font-semibold">
                    {appointment.sellerId.fullName}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {appointment.sellerId.phone}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  Người mua:{" "}
                  <span className="font-semibold">
                    {appointment.buyerId.fullName}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {appointment.buyerId.phone}
                </p>
              </div>
            )}
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              statusColors[appointment.status]
            }`}
          >
            {statusLabels[appointment.status]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>
              {new Date(appointment.scheduledDate).toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="truncate">{appointment.location}</span>
          </div>
        </div>

        {appointment.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">Ghi chú:</p>
            <p className="text-sm">{appointment.notes}</p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span
              className={
                appointment.buyerConfirmed ? "text-green-600" : "text-gray-400"
              }
            >
              {appointment.buyerConfirmed ? "✓" : "○"} Buyer
            </span>
            <span
              className={
                appointment.sellerConfirmed ? "text-green-600" : "text-gray-400"
              }
            >
              {appointment.sellerConfirmed ? "✓" : "○"} Seller
            </span>
          </div>
          <span className="text-gray-500">ID: {appointment._id.slice(-6)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Lịch hẹn của tôi</h2>
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-blue-600" />
          Lịch hẹn của tôi
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Loại:</span>
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(
                  e.target.value as "all" | "AUCTION" | "DEPOSIT" | "OTHER"
                )
              }
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="AUCTION">🏆 Đấu giá</option>
              <option value="DEPOSIT">💰 Đặt cọc</option>
              <option value="OTHER">📋 Khác</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Vai trò:
            </span>
            <select
              value={filterRole}
              onChange={(e) =>
                setFilterRole(e.target.value as "all" | "buyer" | "seller")
              }
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="buyer">Người mua</option>
              <option value="seller">Người bán</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              Trạng thái:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="RESCHEDULED">Đã dời lịch</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="COMPLETED">Đã hoàn thành</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            <span className="font-semibold">{filteredAppointments.length}</span>{" "}
            lịch hẹn
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) =>
              renderAppointmentCard(appointment)
            )
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">
                Không có lịch hẹn nào
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Các lịch hẹn của bạn sẽ hiển thị ở đây
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
