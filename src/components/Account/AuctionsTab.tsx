import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuctionAppointments,
  type Appointment,
} from "../../config/appointmentAPI";
import {
  Trophy,
  Calendar,
  ChevronRight,
  CheckCircle,
  Store,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function AuctionsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId =
    (user as { _id?: string; id?: string })?._id ||
    (user as { _id?: string; id?: string })?.id;

  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [buyerAppointments, setBuyerAppointments] = useState<Appointment[]>([]);
  const [sellerAppointments, setSellerAppointments] = useState<Appointment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "buyer" | "seller">(
    "all"
  );

  useEffect(() => {
    loadAuctionAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAuctionAppointments = async () => {
    setLoading(true);
    try {
      const response = await getAuctionAppointments({ page: 1, limit: 100 });

      const allData = response.data || response.appointments || [];

      console.log("📊 All auction appointments:", allData);

      // Filter appointments where user is buyer (winner)
      const asBuyer = allData.filter((apt: Appointment) => {
        const buyerIdValue =
          typeof apt.buyerId === "object" ? apt.buyerId._id : apt.buyerId;
        return buyerIdValue === userId;
      });

      // Filter appointments where user is seller
      const asSeller = allData.filter((apt: Appointment) => {
        const sellerIdValue =
          typeof apt.sellerId === "object" ? apt.sellerId._id : apt.sellerId;
        return sellerIdValue === userId;
      });

      console.log("👤 As Buyer:", asBuyer.length, asBuyer);
      console.log("🏪 As Seller:", asSeller.length, asSeller);

      setAllAppointments(allData);
      setBuyerAppointments(asBuyer);
      setSellerAppointments(asSeller);
    } catch (error) {
      console.error("❌ Error loading auction appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const buyerIdValue =
      typeof appointment.buyerId === "object"
        ? appointment.buyerId._id
        : appointment.buyerId;
    const isBuyer = buyerIdValue === userId;

    const statusColors = {
      PENDING: "border-yellow-200 bg-yellow-50",
      CONFIRMED: "border-green-200 bg-green-50",
      RESCHEDULED: "border-blue-200 bg-blue-50",
      CANCELLED: "border-red-200 bg-red-50",
      COMPLETED: "border-gray-200 bg-gray-50",
    };

    const statusLabels = {
      PENDING: "Chờ xác nhận",
      CONFIRMED: "Đã xác nhận",
      RESCHEDULED: "Đã dời lịch",
      CANCELLED: "Đã hủy",
      COMPLETED: "Đã hoàn thành",
    };

    return (
      <div
        key={appointment._id}
        className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
          statusColors[appointment.status]
        }`}
        onClick={() => navigate(`/appointments/${appointment._id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg">
                {isBuyer ? "Lịch hẹn mua xe" : "Lịch hẹn bán xe"}
              </h3>
              {isBuyer ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <Store className="w-5 h-5 text-purple-600" />
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
              appointment.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : appointment.status === "CONFIRMED"
                ? "bg-green-100 text-green-800"
                : appointment.status === "RESCHEDULED"
                ? "bg-blue-100 text-blue-800"
                : appointment.status === "CANCELLED"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
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
            <span className="text-gray-500">📍 {appointment.location}</span>
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
                appointment.buyerConfirmed
                  ? "text-green-600 font-semibold"
                  : "text-gray-400"
              }
            >
              {appointment.buyerConfirmed ? "✓ Buyer" : "○ Buyer"}
            </span>
            <span
              className={
                appointment.sellerConfirmed
                  ? "text-green-600 font-semibold"
                  : "text-gray-400"
              }
            >
              {appointment.sellerConfirmed ? "✓ Seller" : "○ Seller"}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Lịch hẹn đấu giá</h2>
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-500" />
          Lịch hẹn đấu giá
        </h2>

        {/* Sub Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveSubTab("all")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeSubTab === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tất cả
              {allAppointments.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {allAppointments.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab("buyer")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeSubTab === "buyer"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Người mua
              {buyerAppointments.length > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {buyerAppointments.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveSubTab("seller")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeSubTab === "seller"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Người bán
              {sellerAppointments.length > 0 && (
                <span className="bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {sellerAppointments.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeSubTab === "all" ? (
            allAppointments.length > 0 ? (
              allAppointments.map((appointment) =>
                renderAppointmentCard(appointment)
              )
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">
                  Chưa có lịch hẹn đấu giá nào
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Các lịch hẹn từ đấu giá sẽ hiển thị ở đây
                </p>
              </div>
            )
          ) : activeSubTab === "buyer" ? (
            buyerAppointments.length > 0 ? (
              buyerAppointments.map((appointment) =>
                renderAppointmentCard(appointment)
              )
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">
                  Chưa có lịch hẹn nào với tư cách người mua
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Các lịch hẹn từ phiên đấu giá bạn thắng sẽ hiển thị ở đây
                </p>
              </div>
            )
          ) : sellerAppointments.length > 0 ? (
            sellerAppointments.map((appointment) =>
              renderAppointmentCard(appointment)
            )
          ) : (
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">
                Chưa có lịch hẹn nào với tư cách người bán
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Các lịch hẹn từ xe bạn bán sẽ hiển thị ở đây
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
