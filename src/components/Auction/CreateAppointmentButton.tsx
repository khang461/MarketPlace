import { useState } from "react";
import { Calendar, CheckCircle } from "lucide-react";
import { createAppointmentFromAuction } from "../../config/appointmentAPI";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

interface CreateAppointmentButtonProps {
  auctionId: string;
  isWinner: boolean;
  winningPrice: number;
}

export default function CreateAppointmentButton({
  auctionId,
  isWinner,
  winningPrice,
}: CreateAppointmentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const navigate = useNavigate();

  const handleCreateAppointment = async () => {
    // Hiển thị dialog để nhập thông tin lịch hẹn
    const { value: formValues } = await Swal.fire({
      title: "Tạo lịch hẹn ký hợp đồng",
      html: `
        <div class="text-left space-y-4">
          <p class="text-sm text-gray-600 mb-4">
            Bạn đã thắng đấu giá với giá <b class="text-green-600">${winningPrice.toLocaleString(
              "vi-VN"
            )}₫</b>
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ngày hẹn <span class="text-gray-400">(Tùy chọn - Mặc định: +7 ngày)</span>
            </label>
            <input
              id="swal-scheduledDate"
              type="datetime-local"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm <span class="text-gray-400">(Tùy chọn)</span>
            </label>
            <input
              id="swal-location"
              type="text"
              placeholder="Văn phòng công ty"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú <span class="text-gray-400">(Tùy chọn)</span>
            </label>
            <textarea
              id="swal-notes"
              rows="3"
              placeholder="Mang theo CMND và bằng lái xe..."
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p>
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
              </svg>
              Tiền cọc 1,000,000 VNĐ từ đấu giá sẽ được sử dụng cho lịch hẹn này
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Tạo lịch hẹn",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      width: "600px",
      preConfirm: () => {
        const scheduledDate = (
          document.getElementById("swal-scheduledDate") as HTMLInputElement
        )?.value;
        const location = (
          document.getElementById("swal-location") as HTMLInputElement
        )?.value;
        const notes = (
          document.getElementById("swal-notes") as HTMLTextAreaElement
        )?.value;

        return {
          scheduledDate: scheduledDate || undefined,
          location: location || undefined,
          notes: notes || undefined,
        };
      },
    });

    if (!formValues) return;

    setLoading(true);
    try {
      const response = await createAppointmentFromAuction(auctionId, {
        scheduledDate: formValues.scheduledDate,
        location: formValues.location,
        notes: formValues.notes,
      });

      if (response.success) {
        setCreated(true);

        await Swal.fire({
          icon: "success",
          title: "Tạo lịch hẹn thành công!",
          html: `
            <div class="text-left">
              <p class="mb-3">Lịch hẹn đã được tạo và gửi đến người bán.</p>
              <div class="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div><b>Ngày hẹn:</b> ${new Date(
                  response.appointment.scheduledDate
                ).toLocaleString("vi-VN")}</div>
                <div><b>Địa điểm:</b> ${response.appointment.location}</div>
                <div><b>Trạng thái:</b> <span class="text-yellow-600">Chờ xác nhận</span></div>
              </div>
              <p class="mt-3 text-sm text-gray-600">
                Cả hai bên cần xác nhận lịch hẹn để hoàn tất giao dịch.
              </p>
            </div>
          `,
          confirmButtonColor: "#10b981",
          confirmButtonText: "Xem lịch hẹn",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(`/appointments/${response.appointment._id}`);
          }
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };

      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          err?.response?.data?.message ||
          "Không thể tạo lịch hẹn. Vui lòng thử lại.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isWinner) return null;

  if (created) {
    return (
      <div className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Đã tạo lịch hẹn</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreateAppointment}
      disabled={loading}
      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Đang tạo...</span>
        </>
      ) : (
        <>
          <Calendar className="w-5 h-5" />
          <span>Tạo lịch hẹn ký hợp đồng</span>
        </>
      )}
    </button>
  );
}
