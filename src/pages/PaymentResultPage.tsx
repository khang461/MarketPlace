import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  const isSuccess = searchParams.get("success") === "true";
  const type = searchParams.get("type"); // "remaining" | "full" | undefined (membership)
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("orderId");
  const message = searchParams.get("message") || "";

  useEffect(() => {
    // Giả lập xử lý
    setTimeout(() => {
      setProcessing(false);

      // Nếu là payment cho transaction (remaining hoặc full)
      if (type === "remaining" || type === "full") {
        if (isSuccess) {
          Swal.fire({
            icon: "success",
            title: "Thanh toán thành công! 🎉",
            html: `
              <div class="text-left space-y-2">
                ${amount ? `<p>Số tiền: <strong>${parseInt(amount || "0").toLocaleString("vi-VN")} VNĐ</strong></p>` : ""}
                ${orderId ? `<p class="text-sm text-gray-600">Mã đơn hàng: ${orderId}</p>` : ""}
                <p class="mt-3">${type === "remaining" ? "Thanh toán số tiền còn lại" : "Thanh toán toàn bộ"} đã được xử lý thành công!</p>
              </div>
            `,
            confirmButtonColor: "#2563eb",
          }).then(() => {
            navigate("/account", { state: { activeTab: "transactions" } });
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Thanh toán thất bại",
            html: `
              <div class="text-left space-y-2">
                ${message ? `<p>${message}</p>` : "<p>Đã có lỗi xảy ra trong quá trình thanh toán</p>"}
                ${orderId ? `<p class="text-sm text-gray-600">Mã đơn hàng: ${orderId}</p>` : ""}
              </div>
            `,
            confirmButtonColor: "#2563eb",
          }).then(() => {
            navigate(-1); // Quay lại trang trước
          });
        }
      }
      // Nếu không có type, giữ nguyên logic cũ cho membership
    }, 1500);
  }, [isSuccess, type, amount, orderId, message, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  // Nếu là membership payment (không có type), hiển thị UI cũ
  if (!type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          {isSuccess ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Thanh toán thành công! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                {message || "Gói membership của bạn đã được kích hoạt"}
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Thanh toán thất bại
              </h2>
              <p className="text-gray-600 mb-6">
                {message || "Đã có lỗi xảy ra trong quá trình thanh toán"}
              </p>
            </>
          )}

          <button
            onClick={() => navigate("/membership")}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Về trang membership
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentResultPage;
