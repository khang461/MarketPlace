import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../config/authAPI";

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "male",
    dateOfBirth: "",
    avatar: "",
    address: {
      fullAddress: "",
      ward: "",
      district: "",
      city: "",
      province: "",
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Handle nested address fields
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateForm = () => {
    // Check all fields
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng nhập đầy đủ thông tin",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    // Name validation
    if (formData.fullName.length < 2) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Họ tên phải có ít nhất 2 ký tự",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Email không hợp lệ",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    // Phone validation
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Số điện thoại không hợp lệ",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Mật khẩu phải có ít nhất 6 ký tự",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Mật khẩu xác nhận không khớp",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    // Terms agreement
    if (!agreeToTerms) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng đồng ý với điều khoản sử dụng",
        confirmButtonColor: "#2563eb",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call API đăng ký với format mới
      const response = await authAPI.signUp({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        avatar: formData.avatar,
        address: {
          fullAddress: formData.address.fullAddress,
          ward: formData.address.ward,
          district: formData.address.district,
          city: formData.address.city,
          province: formData.address.province,
        },
        termsAgreed: agreeToTerms,
      });

      console.log("Sign up response:", response);

      // Lưu user ID (backend trả về user._id)
      const userId = response.user?._id || response._id || response.id;

      if (!userId) {
        throw new Error("User ID not found in response");
      }

      // Lưu accessToken và refreshToken
      if (response.accessToken) {
        localStorage.setItem("token", response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      localStorage.setItem("userId", userId);

      // Auto login after successful signup
      login({
        id: userId,
        name: response.user?.fullName || response.fullName || formData.fullName,
        email: response.user?.email || response.email || formData.email,
        avatar: response.user?.avatar || response.avatar || "",
      });

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Đăng ký thành công! Chào mừng bạn đến với MarketPlace",
        confirmButtonColor: "#2563eb",
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (error: unknown) {
      console.error("Sign up error:", error);

      let errorMessage = "Đăng ký thất bại. Vui lòng thử lại!";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: {
              error?: string;
              message?: string;
            };
          };
        };

        // Lấy error message từ backend
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 400) {
          errorMessage = "Dữ liệu không hợp lệ hoặc email đã tồn tại";
        }
      }

      Swal.fire({
        icon: "error",
        title: "Đăng ký thất bại",
        text: errorMessage,
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" };
    if (password.length < 6)
      return { strength: 1, text: "Yếu", color: "bg-red-500" };
    if (password.length < 10)
      return { strength: 2, text: "Trung bình", color: "bg-yellow-500" };
    return { strength: 3, text: "Mạnh", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Đăng ký tài khoản
          </h2>
          <p className="text-gray-600">
            Tạo tài khoản để bắt đầu mua bán xe điện
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            {/* Email */}
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Số điện thoại
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="0987654321"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Giới tính
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dateOfBirth"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ngày sinh
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address.fullAddress"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Địa chỉ
              </label>
              <input
                id="address.fullAddress"
                name="address.fullAddress"
                type="text"
                value={formData.address.fullAddress}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="123 Đường ABC"
              />
            </div>

            {/* Ward */}
            <div>
              <label
                htmlFor="address.ward"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phường/Xã
              </label>
              <input
                id="address.ward"
                name="address.ward"
                type="text"
                value={formData.address.ward}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Phường 1"
              />
            </div>

            {/* District */}
            <div>
              <label
                htmlFor="address.district"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Quận/Huyện
              </label>
              <input
                id="address.district"
                name="address.district"
                type="text"
                value={formData.address.district}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Quận 1"
              />
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="address.city"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Thành phố
              </label>
              <input
                id="address.city"
                name="address.city"
                type="text"
                value={formData.address.city}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="TP.HCM"
              />
            </div>

            {/* Province */}
            <div>
              <label
                htmlFor="address.province"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tỉnh/Thành
              </label>
              <input
                id="address.province"
                name="address.province"
                type="text"
                value={formData.address.province}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Hồ Chí Minh"
              />
            </div>

            {/* Avatar URL (optional) */}
            <div>
              <label
                htmlFor="avatar"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Avatar URL (tùy chọn)
              </label>
              <input
                id="avatar"
                name="avatar"
                type="url"
                value={formData.avatar}
                onChange={handleChange}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <div className="mt-2 flex items-center space-x-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Mật khẩu khớp</span>
                  </div>
                )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer mt-1"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700 cursor-pointer"
              >
                Tôi đồng ý với{" "}
                <Link
                  to="/terms"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Chính sách bảo mật
                </Link>
              </label>
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
                  <span>Đang đăng ký...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Đăng ký</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Hoặc đăng ký với
                </span>
              </div>
            </div>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Google
              </span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="ml-2 text-sm font-medium text-gray-700">
                Facebook
              </span>
            </button>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                to="/signin"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

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

export default SignUpPage;
