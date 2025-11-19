import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAppointmentById,
  confirmAppointment,
  rejectAppointment,
  cancelAppointment,
  getStaffAppointmentDetail,
  type Appointment,
} from "../config/appointmentAPI";
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import RemainingPaymentButton from "../components/Appointment/RemainingPaymentButton";

type StaffInfo = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
};

export default function AppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId =
    (user as { _id?: string; id?: string })?._id ||
    (user as { _id?: string; id?: string })?.id;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [staffLoading, setStaffLoading] = useState(false);

  const extractStaffInfo = (source: unknown): StaffInfo | null => {
    if (!source || typeof source !== "object") return null;
    const data = source as Record<string, unknown>;
    const rawStaff = (data.staff ||
      data.assignedStaff ||
      data.staffInfo ||
      data.completionStaff ||
      data.completionStaffInfo) as Record<string, unknown> | undefined;

    const name =
      (rawStaff?.name as string | undefined) ||
      (rawStaff?.fullName as string | undefined) ||
      (data.completedByStaffName as string | undefined) ||
      (data.staffName as string | undefined);
    const email =
      (rawStaff?.email as string | undefined) ||
      (data.completedByStaffEmail as string | undefined) ||
      (rawStaff?.contactEmail as string | undefined);
    const phone =
      (rawStaff?.phone as string | undefined) ||
      (data.completedByStaffPhone as string | undefined) ||
      (rawStaff?.contactPhone as string | undefined);
    const id =
      (rawStaff?._id as string | undefined) ||
      (rawStaff?.id as string | undefined) ||
      (data.completedByStaffId as string | undefined);

    if (name || email || phone) {
      return { id, name, email, phone };
    }

    return null;
  };

  const fetchStaffInfo = async (id: string) => {
    setStaffLoading(true);
    try {
      const response = await getStaffAppointmentDetail(id);
      const detail =
        response?.data ||
        response?.appointment ||
        response?.assignment ||
        response;
      const info = extractStaffInfo(detail);
      setStaffInfo(info);
    } catch (error) {
      console.error("Error fetching staff detail:", error);
    } finally {
      setStaffLoading(false);
    }
  };

  const loadAppointment = async () => {
    if (!appointmentId) return;
    setLoading(true);
    setStaffInfo(null);
    try {
      const response = await getAppointmentById(appointmentId);
      const appointmentData = response.data.appointment || response.data;
      setAppointment(appointmentData);
      const localStaff = extractStaffInfo(appointmentData);
      if (localStaff) {
        setStaffInfo(localStaff);
      }
      const resolvedId =
        (appointmentData && (appointmentData._id || appointmentData.id)) ||
        appointmentId;
      if (resolvedId) {
        void fetchStaffInfo(resolvedId);
      }
    } catch (error) {
      console.error("Error loading appointment:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải thông tin lịch hẹn",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const isBuyer =
    appointment?.buyerId?._id === userId || appointment?.buyerId === userId;
  const isSeller =
    appointment?.sellerId?._id === userId || appointment?.sellerId === userId;

  // Debug logs
  console.log("🔍 Appointment detail debug:", {
    userId,
    buyerId: appointment?.buyerId,
    buyerIdExtracted: appointment?.buyerId?._id,
    sellerId: appointment?.sellerId,
    sellerIdExtracted: appointment?.sellerId?._id,
    isBuyer,
    isSeller,
    status: appointment?.status,
    buyerConfirmed: appointment?.buyerConfirmed,
    sellerConfirmed: appointment?.sellerConfirmed,
  });

  const canConfirm =
    appointment?.status === "PENDING" ||
    appointment?.status === "RESCHEDULED" ||
    appointment?.status === "CONFIRMED"; // Thêm CONFIRMED để vẫn có thể xác nhận
  const canReject = canConfirm;
  const canCancel =
    appointment?.status !== "COMPLETED" && appointment?.status !== "CANCELLED";

  const handleConfirm = async () => {
    if (!appointmentId || actionLoading) return;

    const result = await Swal.fire({
      title: "Xác nhận lịch hẹn?",
      text: "Bạn xác nhận sẽ tham gia lịch hẹn này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await confirmAppointment(appointmentId);
      await loadAppointment();
      Swal.fire({
        icon: "success",
        title: "Đã xác nhận!",
        text: "Bạn đã xác nhận lịch hẹn thành công.",
        confirmButtonColor: "#10b981",
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.response?.data?.message || "Không thể xác nhận lịch hẹn",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!appointmentId || actionLoading) return;

    const { value: reason } = await Swal.fire({
      title: "Từ chối lịch hẹn",
      text: "Lịch hẹn sẽ tự động dời sang 1 tuần sau",
      input: "textarea",
      inputLabel: "Lý do từ chối (tùy chọn)",
      inputPlaceholder: "Nhập lý do...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
    });

    if (reason === undefined) return;

    setActionLoading(true);
    try {
      await rejectAppointment(appointmentId, reason);
      await loadAppointment();
      Swal.fire({
        icon: "info",
        title: "Đã từ chối!",
        text: "Lịch hẹn đã được dời sang 1 tuần sau.",
        confirmButtonColor: "#10b981",
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.response?.data?.message || "Không thể từ chối lịch hẹn",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointmentId || actionLoading) return;

    const { value: reason } = await Swal.fire({
      title: "Hủy lịch hẹn?",
      text: "Tiền cọc sẽ được hoàn lại",
      input: "textarea",
      inputLabel: "Lý do hủy (tùy chọn)",
      inputPlaceholder: "Nhập lý do...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Hủy lịch hẹn",
      cancelButtonText: "Đóng",
      icon: "warning",
    });

    if (reason === undefined) return;

    setActionLoading(true);
    try {
      await cancelAppointment(appointmentId, reason);
      await loadAppointment();
      Swal.fire({
        icon: "success",
        title: "Đã hủy!",
        text: "Lịch hẹn đã được hủy và tiền cọc sẽ được hoàn lại.",
        confirmButtonColor: "#10b981",
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: err?.response?.data?.message || "Không thể hủy lịch hẹn",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy lịch hẹn</h2>
          <button
            onClick={() => navigate("/account")}
            className="text-blue-600 hover:underline"
          >
            Quay lại trang cá nhân
          </button>
        </div>
      </div>
    );
  }

  const awaitingStatuses = [
    "WAITING_REMAINING_PAYMENT",
    "AWAITING_REMAINING_PAYMENT",
  ];

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-green-100 text-green-800",
    RESCHEDULED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    WAITING_REMAINING_PAYMENT: "bg-orange-100 text-orange-800",
    AWAITING_REMAINING_PAYMENT: "bg-orange-100 text-orange-800",
  };

  const statusLabels = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    RESCHEDULED: "Đã dời lịch",
    CANCELLED: "Đã hủy",
    COMPLETED: "Đã hoàn thành",
    WAITING_REMAINING_PAYMENT: "Chờ thanh toán phần còn lại",
    AWAITING_REMAINING_PAYMENT: "Chờ thanh toán phần còn lại",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:underline mb-4 flex items-center gap-2"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold">Chi tiết lịch hẹn</h1>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-block px-4 py-2 rounded-full font-semibold ${
              statusColors[appointment.status]
            }`}
          >
            {statusLabels[appointment.status]}
          </span>
        </div>

        {/* Remaining Payment Button - Nổi bật ngay dưới status */}
        {awaitingStatuses.includes(appointment.status) && isBuyer && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  Thanh toán phần còn lại
                </h3>
                <p className="text-sm text-gray-600">
                  Vui lòng thanh toán số tiền còn lại để hoàn tất giao dịch
                </p>
              </div>
              <RemainingPaymentButton
                appointmentId={appointmentId || ""}
                onPaymentSuccess={loadAppointment}
              />
            </div>
          </div>
        )}

        {/* Main Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Buyer Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Người mua</h3>
              <p className="text-gray-700">{appointment.buyerId.fullName}</p>
              <p className="text-gray-600 text-sm">
                {appointment.buyerId.email}
              </p>
              <p className="text-gray-600 text-sm">
                {appointment.buyerId.phone}
              </p>
              {isBuyer && (
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Bạn
                </span>
              )}
            </div>

            {/* Seller Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Người bán</h3>
              <p className="text-gray-700">{appointment.sellerId.fullName}</p>
              <p className="text-gray-600 text-sm">
                {appointment.sellerId.email}
              </p>
              <p className="text-gray-600 text-sm">
                {appointment.sellerId.phone}
              </p>
              {isSeller && (
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Bạn
                </span>
              )}
            </div>
          </div>

          <div className="border-t mt-6 pt-6 space-y-4">
            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="font-semibold">Thời gian</p>
                <p className="text-gray-700">
                  {new Date(appointment.scheduledDate).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-1" />
              <div>
                <p className="font-semibold">Địa điểm</p>
                <p className="text-gray-700">{appointment.location}</p>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <p className="font-semibold">Ghi chú</p>
                  <p className="text-gray-700">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Confirmation Status */}
          <div className="border-t mt-6 pt-6">
            <h3 className="font-semibold mb-3">Trạng thái xác nhận</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div
                className={`p-3 rounded-lg ${
                  appointment.buyerConfirmed
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <p className="font-medium">Người mua</p>
                <p className="text-sm">
                  {appointment.buyerConfirmed ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Đã xác nhận
                    </span>
                  ) : (
                    <span className="text-gray-500">Chưa xác nhận</span>
                  )}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  appointment.sellerConfirmed
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <p className="font-medium">Người bán</p>
                <p className="text-sm">
                  {appointment.sellerConfirmed ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Đã xác nhận
                    </span>
                  ) : (
                    <span className="text-gray-500">Chưa xác nhận</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Staff in charge */}
          {appointment.type === "INSPECTION" ||
          appointment.type === "VEHICLE_INSPECTION" ? (
            <div className="border-t mt-6 pt-6">
              <h3 className="font-semibold mb-3">Nhân viên phụ trách</h3>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                {staffLoading ? (
                  <p className="text-sm text-gray-600">
                    Đang tải thông tin nhân viên...
                  </p>
                ) : staffInfo ? (
                  <>
                    <p className="text-lg font-semibold text-indigo-900">
                      {staffInfo.name || "Chưa cập nhật"}
                    </p>
                    {staffInfo.email && (
                      <p className="text-sm text-gray-700">{staffInfo.email}</p>
                    )}
                    {staffInfo.phone && (
                      <p className="text-sm text-gray-700">{staffInfo.phone}</p>
                    )}
                    {!(staffInfo.email || staffInfo.phone) && (
                      <p className="text-sm text-gray-600">
                        Chưa có thông tin liên hệ.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    Chưa phân công nhân viên phụ trách.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {(isBuyer || isSeller) &&
          appointment.status !== "CANCELLED" &&
          appointment.status !== "COMPLETED" && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Hành động</h3>
              <div className="flex flex-wrap gap-3">
                {/* Buyer and Seller can independently confirm if they haven't yet */}
                {canConfirm && isBuyer && !appointment.buyerConfirmed && (
                  <button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Xác nhận tham gia
                  </button>
                )}

                {canConfirm && isSeller && !appointment.sellerConfirmed && (
                  <button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Xác nhận tham gia
                  </button>
                )}

                {canReject && (
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Từ chối (dời lịch)
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    Hủy lịch hẹn
                  </button>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
