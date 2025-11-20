import React, { useState, useEffect } from "react";
import { X, Calendar, MapPin, FileText, Loader2 } from "lucide-react";
import api from "../../config/api";
import Swal from "sweetalert2";

const DEFAULT_LOCATION = "Showroom EV - 123 Hai Bà Trưng";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  chatId,
}) => {
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default date (+3 days from now)
  useEffect(() => {
    if (isOpen) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      // Format for datetime-local input (YYYY-MM-DDTHH:mm)
      const formattedDate = defaultDate.toISOString().slice(0, 16);
      setScheduledDate(formattedDate);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setScheduledDate("");
      setNotes("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy thông tin cuộc trò chuyện",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert datetime-local format to ISO string
      const dateToSend = scheduledDate
        ? new Date(scheduledDate).toISOString()
        : undefined;

      const requestBody: {
        chatId: string;
        scheduledDate?: string;
        location?: string;
        notes?: string;
      } = {
        chatId,
      };

      if (scheduledDate) {
        requestBody.scheduledDate = dateToSend;
      }
      requestBody.location = DEFAULT_LOCATION;
      if (notes.trim()) {
        requestBody.notes = notes.trim();
      }

      const response = await api.post("/appointments/chat", requestBody);

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: response.data.message || "Đã tạo lịch hẹn xem xe thành công",
          timer: 2000,
          showConfirmButton: false,
        });

        // Close modal
        onClose();
      } else {
        throw new Error(response.data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          axiosError.response?.data?.message ||
          (error instanceof Error ? error.message : undefined) ||
          "Không thể tạo lịch hẹn. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Đóng"
          disabled={isSubmitting}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Đặt lịch xem xe
          </h2>
          <p className="text-sm text-gray-600">
            Tạo lịch hẹn để xem xe trực tiếp
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Scheduled Date */}
          <div>
            <label
              htmlFor="scheduledDate"
              className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Ngày giờ hẹn
            </label>
            <input
              type="datetime-local"
              id="scheduledDate"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              min={new Date().toISOString().slice(0, 16)}
            />
           
          </div>

          {/* Location (fixed) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Địa điểm (cố định)
            </label>
            <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
              {DEFAULT_LOCATION}
            </div>
            <p className="text-xs text-gray-500 mt-1">
               Tất cả lịch xem xe diễn ra tại showroom này.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Ghi chú (tùy chọn)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Mang theo giấy tờ xe gốc, hẹn xem vào buổi sáng..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;

