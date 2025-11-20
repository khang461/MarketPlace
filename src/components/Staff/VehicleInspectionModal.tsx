import React, { useState, useEffect } from "react";
import { XCircle, Printer, FileText } from "lucide-react";
import type { Appointment } from "../../pages/Staff/AppointmentManagement";
import {
  generateContractPdf,
  getContractInfo,
  createContract,
} from "../../config/contractAPI";
import api from "../../config/api";
import Swal from "sweetalert2";

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
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [hasContract, setHasContract] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  const inspectionPrice =
    appointment.transaction?.vehiclePrice || appointment.vehicle?.price || 0;

  // Helper function để xác định contractType dựa trên transaction data
  const determineContractType = (): "DEPOSIT" | "FULL_PAYMENT" => {
    const vehiclePrice =
      appointment.transaction?.vehiclePrice || appointment.vehicle?.price || 0;
    const depositAmount = appointment.transaction?.depositAmount || 0;
    const remainingAmount = appointment.transaction?.remainingAmount || 0;

    // Nếu đã thanh toán đủ (deposit = total hoặc remaining = 0) → FULL_PAYMENT
    if (
      vehiclePrice > 0 &&
      (depositAmount === vehiclePrice || remainingAmount === 0)
    ) {
      return "FULL_PAYMENT";
    }

    // Ngược lại → DEPOSIT
    return "DEPOSIT";
  };

  // Kiểm tra xem đã có hợp đồng chưa khi component mount
  useEffect(() => {
    const checkContractExists = async () => {
      const appointmentId =
        appointment._id || appointment.id || appointment.appointmentId;
      if (!appointmentId) return;

      try {
        const contractInfoResponse = await getContractInfo(appointmentId);
        const responseData = contractInfoResponse as {
          contractId?: string;
          _id?: string;
        };
        const id = responseData.contractId || responseData._id;
        if (id) {
          setHasContract(true);
          setContractId(id);
        }
      } catch {
        // Chưa có hợp đồng
        setHasContract(false);
        setContractId(null);
      }
    };

    if (isOpen) {
      checkContractExists();
    }
  }, [isOpen, appointment]);

  if (!isOpen) return null;

  const handleCreateContract = async () => {
    const appointmentId =
      appointment._id || appointment.id || appointment.appointmentId;

    if (!appointmentId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy ID lịch hẹn",
        confirmButtonText: "Đóng",
      });
      return;
    }

    setIsCreatingContract(true);
    try {
      // Xác định contractType dựa trên transaction data
      const contractType = determineContractType();

      console.log("Creating contract with type:", contractType, {
        vehiclePrice:
          appointment.transaction?.vehiclePrice || appointment.vehicle?.price,
        depositAmount: appointment.transaction?.depositAmount,
        remainingAmount: appointment.transaction?.remainingAmount,
      });

      const response = await createContract(appointmentId, {
        contractType, // Sử dụng contractType đã xác định
      });

      // Lấy contractId từ response.data (Contract object)
      const contractData = response.data;
      const id = contractData?._id;

      if (id) {
        setHasContract(true);
        setContractId(id);

        const contractTypeLabel =
          contractType === "FULL_PAYMENT" ? "mua ngay" : "đặt cọc";

        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: `Đã tạo hợp đồng ${contractTypeLabel} thành công!`,
          confirmButtonText: "Đóng",
        });
      } else {
        throw new Error("Không nhận được contractId từ response");
      }
    } catch (error: unknown) {
      console.error("Error creating contract:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        "Không thể tạo hợp đồng";

      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
        confirmButtonText: "Đóng",
      });
    } finally {
      setIsCreatingContract(false);
    }
  };

  const handlePrint = async () => {
    // Lấy appointmentId từ appointment
    const appointmentId =
      appointment._id || appointment.id || appointment.appointmentId;

    if (!appointmentId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không tìm thấy ID lịch hẹn",
        confirmButtonText: "Đóng",
      });
      return;
    }

    setIsPrinting(true);
    try {
      // Bước 1: Kiểm tra contractId
      let currentContractId = contractId;

      if (!currentContractId) {
        // Thử lấy lại contractId từ appointmentId
        try {
          const contractInfoResponse = await getContractInfo(appointmentId);
          const responseData = contractInfoResponse as {
            contractId?: string;
            _id?: string;
          };
          const id = responseData.contractId || responseData._id;
          if (id) {
            setContractId(id);
            currentContractId = id;
          } else {
            throw new Error("Không tìm thấy contractId");
          }
        } catch {
          Swal.fire({
            icon: "info",
            title: "Thông báo",
            text: "Lịch hẹn này chưa có hợp đồng. Vui lòng tạo hợp đồng trước khi in.",
            confirmButtonText: "Đóng",
          });
          return;
        }
      }

      if (!currentContractId) {
        Swal.fire({
          icon: "info",
          title: "Thông báo",
          text: "Chưa có hợp đồng cho lịch hẹn này. Vui lòng tạo hợp đồng trước.",
          confirmButtonText: "Đóng",
        });
        return;
      }

      // Bước 2: Kiểm tra PDF đã tồn tại chưa bằng cách thử tải trực tiếp
      // Nếu lỗi 404 thì mới tạo mới
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token");
      }

      // Lấy baseURL và loại bỏ dấu / ở cuối nếu có
      let apiBaseURL = api.defaults.baseURL || "http://localhost:8081/api";
      apiBaseURL = apiBaseURL.replace(/\/+$/, ""); // Loại bỏ tất cả dấu / ở cuối
      const pdfUrl = `${apiBaseURL}/contracts/${currentContractId}/pdf`;

      // Bước 3: Thử tải PDF trước
      let response = await fetch(pdfUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Nếu PDF chưa có (404), tạo mới
      if (response.status === 404) {
        console.log(
          "PDF chưa có, đang tạo mới cho contractId:",
          currentContractId
        );
        try {
          await generateContractPdf(currentContractId);
          console.log("PDF đã được tạo thành công");

          // Đợi một chút để backend xử lý xong
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Thử tải lại sau khi tạo
          response = await fetch(pdfUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (err: unknown) {
          console.error("Error generating PDF:", err);
          const errorMessage =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ||
            (err as { message?: string })?.message ||
            "Không thể tạo file PDF";

          // Nếu lỗi khi tạo PDF, thông báo lỗi
          throw new Error(`Lỗi khi tạo PDF: ${errorMessage}`);
        }
      }

      // Bước 4: Kiểm tra response và tải PDF
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Lỗi khi tải PDF: ${response.status} - ${response.statusText}`
        );
      }

      // Nhận blob từ response
      const blob = await response.blob();
      console.log("PDF blob received, size:", blob.size);

      // Tạo blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Tạo link download với tên file đúng format (theo hướng dẫn: hop-dong-CT-{contractNumber}.pdf)
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `hop-dong-CT-${currentContractId}.pdf`; // Tên file theo format backend
      link.rel = "noopener noreferrer";

      // Thêm vào DOM, click để download, rồi xóa
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup blob URL sau khi download
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      // Sau khi download, mở PDF trong tab mới để có thể in
      setTimeout(() => {
        const printWindow = window.open(blobUrl, "_blank");
        if (printWindow) {
          // Đợi PDF load xong rồi mới in
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              // Cleanup sau khi in
              setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
              }, 1000);
            }, 1000);
          };
        }
      }, 500);
    } catch (err: unknown) {
      console.error("Error printing inspection:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        "Không thể tải file PDF để in";

      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
        confirmButtonText: "Đóng",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Chi tiết lịch hẹn xem xe
          </h2>
          <div className="flex items-center gap-3">
            {!hasContract ? (
              <button
                onClick={handleCreateContract}
                disabled={isCreatingContract}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Tạo hợp đồng"
              >
                {isCreatingContract ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {isCreatingContract ? "Đang tạo..." : "Tạo hợp đồng"}
                </span>
              </button>
            ) : (
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="text-green-600 hover:text-green-800 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="In hợp đồng"
              >
                {isPrinting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                ) : (
                  <Printer className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {isPrinting ? "Đang tải..." : "In hợp đồng"}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
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
                  <p className="text-sm font-medium text-blue-700">
                    Đặt cọc: 0 VNĐ
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Số tiền còn lại: {inspectionPrice.toLocaleString("vi-VN")}{" "}
                    VNĐ
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Buổi xem xe chỉ xác nhận tình trạng xe. Giao dịch sẽ diễn ra
                  sau khi hai bên đồng ý.
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
