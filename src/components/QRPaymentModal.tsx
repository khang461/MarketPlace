import React from "react";
import { X, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string; // base64 image hoặc URL
paymentUrl?: string
  amount: number;
  title: string;
  description?: string;
  orderId?: string;
}

const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  isOpen,
  onClose,
  qrCode,
  paymentUrl,
  amount,
  title,
  description,
  orderId,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const handlePaymentClick = () => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          {description && (
            <p className="text-gray-600 text-sm">{description}</p>
          )}
        </div>

        {/* Amount */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Số tiền thanh toán</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(amount)}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 flex items-center justify-center">
            {qrCode.startsWith("data:image") ||
            (qrCode.startsWith("http") &&
              (qrCode.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i) ||
                qrCode.includes("/qr") ||
                qrCode.includes("qrcode"))) ? (
              // Nếu là base64 image hoặc URL ảnh QR code, hiển thị bằng img tag
              <img
                src={qrCode}
                alt="QR Code thanh toán"
                className="w-64 h-64 object-contain"
              />
            ) : (
              // Nếu là URL thanh toán, tạo QR code từ paymentUrl hoặc qrCode
              <QRCodeSVG
                value={paymentUrl || qrCode}
                size={256}
                level="H"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 font-semibold mb-2">
            Hướng dẫn thanh toán:
          </p>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Mở ứng dụng ngân hàng trên điện thoại</li>
            <li>Quét mã QR trên màn hình</li>
            <li>Xác nhận thanh toán</li>
            <li>Chờ hệ thống xử lý (tự động chuyển hướng)</li>
          </ol>
        </div>

        {/* Order ID (if available) */}
        {orderId && (
          <div className="mb-4 text-center">
            <p className="text-xs text-gray-500">
              Mã đơn hàng: <span className="font-mono">{orderId}</span>
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {paymentUrl && (
            <button
              onClick={handlePaymentClick}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Thanh toán qua VNPay
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

export default QRPaymentModal;
