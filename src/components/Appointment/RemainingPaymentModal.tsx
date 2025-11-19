import React from "react";
import { X } from "lucide-react";

interface RemainingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl?: string;
  qrCodeUrl?: string;
  amount: number;
}

const RemainingPaymentModal: React.FC<RemainingPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentUrl,
  qrCodeUrl,
  amount,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán phần còn lại
          </h2>
        </div>

        {/* Amount */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Số tiền còn lại</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(amount)}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 min-h-[280px] min-w-[280px] flex items-center justify-center">
            {(() => {
              // Nếu backend đã trả sẵn ảnh (data URI hoặc file ảnh) thì dùng trực tiếp
              const isImageUrl =
                (paymentUrl ?? "").startsWith("data:image") ||
                /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(paymentUrl || "");

              // Nếu chỉ có link VNPay (qrCodeUrl/paymentUrl) -> FE tự generate QR qua dịch vụ QR public
              const qrData = qrCodeUrl || paymentUrl || "";
              const generatedQrSrc =
                qrData && !isImageUrl
                  ? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
                      qrData
                    )}`
                  : "";

              const finalSrc = isImageUrl
                ? paymentUrl
                : generatedQrSrc || undefined;

              return finalSrc ? (
                <img
                  src={finalSrc}
                  alt="QR Code thanh toán"
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <p className="text-center text-sm text-gray-500 px-4">
                  Không có ảnh QR. Vui lòng mở cổng thanh toán để xem mã QR.
                </p>
              );
            })()}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 text-center">
            Vui lòng quét mã QR hoặc mở cổng thanh toán để hoàn thành giao dịch.
          </p>
        </div>

        {/* Action button */}
        <div className="space-y-3">
          {paymentUrl && (
            <button
              onClick={() => window.open(paymentUrl, "_blank")}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Mở cổng thanh toán
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemainingPaymentModal;

