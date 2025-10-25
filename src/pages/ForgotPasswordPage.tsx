import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Email validation
    if (!email) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng nhập email",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Email không hợp lệ",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Password reset email sent to:", email);
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Email đặt lại mật khẩu đã được gửi!",
        confirmButtonColor: "#2563eb",
      });
      setIsLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  const handleResendEmail = () => {
    setIsLoading(true);
    setTimeout(() => {
      console.log("Resending email to:", email);
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Email đã được gửi lại!",
        confirmButtonColor: "#2563eb",
        timer: 1500,
        showConfirmButton: false,
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Quên mật khẩu?
          </h2>
          <p className="text-gray-600">
            {!emailSent
              ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu"
              : "Chúng tôi đã gửi email hướng dẫn đến bạn"}
          </p>
        </div>

        {/* Form or Success Message */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Gửi liên kết đặt lại</span>
                  </>
                )}
              </button>

              {/* Back to Sign In */}
              <div className="text-center">
                <Link
                  to="/signin"
                  className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại đăng nhập</span>
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Email đã được gửi!
                </h3>
                <p className="text-gray-600">
                  Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email:
                </p>
                <p className="font-medium text-blue-600">{email}</p>
                <p className="text-sm text-gray-500">
                  Vui lòng kiểm tra hộp thư của bạn. Email có thể mất vài phút
                  để đến. Nhớ kiểm tra cả thư mục spam nhé!
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Bước tiếp theo:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Kiểm tra email của bạn</li>
                  <li>Nhấp vào liên kết đặt lại mật khẩu</li>
                  <li>Tạo mật khẩu mới</li>
                  <li>Đăng nhập với mật khẩu mới</li>
                </ol>
              </div>

              {/* Resend Email */}
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">Không nhận được email?</p>
                <button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
                >
                  {isLoading ? "Đang gửi lại..." : "Gửi lại email"}
                </button>
              </div>

              {/* Back to Sign In */}
              <div className="text-center pt-4 border-t border-gray-200">
                <Link
                  to="/signin"
                  className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại đăng nhập</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Additional Help */}
        {!emailSent && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Cần trợ giúp?{" "}
              <Link
                to="/support"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Liên hệ hỗ trợ
              </Link>
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
