import React from "react";
import { XCircle } from "lucide-react";
import type { Appointment } from "../../pages/Staff/AppointmentManagement";

interface VehicleInspectionModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onHoldVehicle: () => void;
  onBuyNow: () => void;
  renderConfirmationSection: (
    appointment?: Appointment | null
  ) => React.ReactNode;
  formatDate: (dateString: string) => string;
  staffLoading?: boolean;
}

const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onHoldVehicle,
  onBuyNow,
  renderConfirmationSection,
  formatDate,
  staffLoading = false,
}) => {
  if (!isOpen) return null;

  const inspectionPrice =
    appointment.transaction?.vehiclePrice || appointment.vehicle?.price || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Chi tiết lịch hẹn xem xe
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Thông tin xe
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Xe:</span>{" "}
                  {appointment.vehicle?.make || "N/A"}{" "}
                  {appointment.vehicle?.model || ""}{" "}
                  {appointment.vehicle?.year || ""}
                </p>
                <p>
                  <span className="font-medium">Giá trị tham khảo:</span>{" "}
                  {inspectionPrice.toLocaleString("vi-VN")} VNĐ
                </p>
                <p>
                  <span className="font-medium">Thời gian:</span>{" "}
                  {formatDate(appointment.scheduledDate)}
                </p>
                <p>
                  <span className="font-medium">Địa điểm:</span>{" "}
                  {appointment.location}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Thông tin giá & cọc
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Giá xe:</span>{" "}
                  {inspectionPrice.toLocaleString("vi-VN")} VNĐ
                </p>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-700">Đặt cọc: 0 VNĐ</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Số tiền còn lại: {inspectionPrice.toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Buổi xem xe chỉ xác nhận tình trạng xe. Giao dịch sẽ diễn ra sau
                  khi hai bên đồng ý.
                </p>
              </div>
            </div>
          </div>

          {renderConfirmationSection(appointment)}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-orange-700 mb-3">
                🟠 Bên Bán
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Tên:</span>{" "}
                  {appointment.seller?.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {appointment.seller?.email || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {appointment.seller?.phone || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3">
                🟢 Bên Mua
              </h3>
              <div className="bg-green-50 rounded-lg p-4 space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">Tên:</span>{" "}
                  {appointment.buyer?.name || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {appointment.buyer?.email || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {appointment.buyer?.phone || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {appointment.status === "CONFIRMED" && (
            <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={onHoldVehicle}
                  className="px-4 py-3 border border-yellow-500 text-yellow-600 rounded-lg font-semibold hover:bg-yellow-50 transition-colors"
                >
                  Giữ xe
                </button>
                <button
                  onClick={onBuyNow}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Mua ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleInspectionModal;

