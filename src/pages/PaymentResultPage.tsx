import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  const isSuccess = searchParams.get("success") === "true";
  const message = searchParams.get("message") || "";

  useEffect(() => {
    // Giả lập xử lý
    setTimeout(() => {
      setProcessing(false);
    }, 1500);
  }, []);

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
};

export default PaymentResultPage;
