import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";

const DepositPaymentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  const isSuccess = searchParams.get("success") === "true";
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("orderId");
  const message = searchParams.get("message") || "";

  useEffect(() => {
    // Giả lập xử lý
    setTimeout(() => {
      setProcessing(false);

      if (isSuccess) {
        Swal.fire({
          icon: "success",
          title: "Thanh toán thành công! 🎉",
          html: `
            <div class="text-left space-y-2">
              ${amount ? `<p>Số tiền: <strong>${parseInt(amount || "0").toLocaleString("vi-VN")} VNĐ</strong></p>` : ""}
              ${orderId ? `<p class="text-sm text-gray-600">Mã đơn hàng: ${orderId}</p>` : ""}
              <p class="mt-3">Yêu cầu đặt cọc của bạn đã được xử lý thành công!</p>
            </div>
          `,
          confirmButtonColor: "#2563eb",
        }).then(() => {
          // Redirect về trang account hoặc transaction
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
    }, 1500);
  }, [isSuccess, amount, orderId, message, navigate]);

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

  return null;
};

export default DepositPaymentResultPage;

