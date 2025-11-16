import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Calendar,
  TrendingUp,
  Package,
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { membershipAPI, CurrentMembership } from "../config/membershipAPI";
import Swal from "sweetalert2";

const MyMembershipPage: React.FC = () => {
  const navigate = useNavigate();
  const [membership, setMembership] = useState<CurrentMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    fetchCurrentMembership();
  }, []);
  useEffect(() => {
    console.log("Membership Data:", membership);
  }, [membership]);

  const fetchCurrentMembership = async () => {
    try {
      setLoading(true);
      const response = await membershipAPI.getCurrentMembership();
      if (response.success) {
        setMembership(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải thông tin gói");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRenew = async () => {
    // Hiển thị dialog chọn số tháng gia hạn
    const { value: months } = await Swal.fire({
      title: "Chọn thời gian gia hạn",
      input: "select",
      inputOptions: {
        "1": "1 tháng",
        "3": "3 tháng (Giảm 5%)",
        "6": "6 tháng (Giảm 10%)",
        "12": "12 tháng (Giảm 15%)",
      },
      inputPlaceholder: "Chọn số tháng",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Tiếp tục",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value) {
          return "Bạn cần chọn thời gian gia hạn!";
        }
        return null;
      },
    });

    if (!months) return;

    const monthsNum = parseInt(months);
    const packagePrice = membership?.packageId.price || 0;
    const basePrice = packagePrice * monthsNum;

    // Tính discount
    let discount = 0;
    if (monthsNum === 3) discount = 5;
    else if (monthsNum === 6) discount = 10;
    else if (monthsNum === 12) discount = 15;

    const finalPrice = basePrice * (1 - discount / 100);

    // Xác nhận thanh toán
    const confirmResult = await Swal.fire({
      title: "Xác nhận gia hạn",
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Gói:</strong> ${
            membership?.packageId.name
          }</p>
          <p class="mb-2"><strong>Thời gian:</strong> ${monthsNum} tháng</p>
          <p class="mb-2"><strong>Giá gốc:</strong> ${basePrice.toLocaleString(
            "vi-VN"
          )}₫</p>
          ${
            discount > 0
              ? `<p class="mb-2 text-green-600"><strong>Giảm giá:</strong> ${discount}%</p>`
              : ""
          }
          <p class="mb-2 text-xl"><strong>Tổng tiền:</strong> ${finalPrice.toLocaleString(
            "vi-VN"
          )}₫</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xác nhận thanh toán",
      cancelButtonText: "Hủy",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      setRenewing(true);
      const response = await membershipAPI.renewMembership({
        months: monthsNum,
      });

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Gia hạn thành công!",
          html: `
            <div class="text-left">
              <p class="mb-2">Gói ${
                membership?.packageId.name
              } đã được gia hạn thêm ${monthsNum} tháng</p>
              <p class="mb-2"><strong>Số dư mới:</strong> ${response.data.payment.newBalance.toLocaleString(
                "vi-VN"
              )}₫</p>
              <p class="mb-2"><strong>Ngày hết hạn mới:</strong> ${formatDate(
                response.data.membership.endDate
              )}</p>
            </div>
          `,
          confirmButtonColor: "#2563eb",
        });

        // Reload lại thông tin membership
        await fetchCurrentMembership();
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gia hạn thất bại",
        text:
          error.response?.data?.message ||
          "Không thể gia hạn gói. Vui lòng kiểm tra số dư ví!",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setRenewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !membership) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bạn chưa có gói membership
          </h2>
          <p className="text-gray-600 mb-6">
            Nâng cấp tài khoản để trải nghiệm nhiều tính năng hơn
          </p>
          <button
            onClick={() => navigate("/membership/upgrade")}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Xem các gói membership
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(membership.endDate);
  const packageData = membership.packageId;
  const isFreePackage = packageData.slug === "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gói membership của tôi
          </h1>
          <p className="text-gray-600">
            Quản lý gói membership và theo dõi sử dụng
          </p>
        </div>

        {/* Current Package Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">{packageData.name}</h2>
                  <span className="text-xl">{packageData.features.badge}</span>
                </div>
                <p className="text-blue-100 text-sm">Gói hiện tại</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  membership.isActive
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {membership.isActive ? "Đang hoạt động" : "Đã hết hạn"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-200" />
                <p className="text-blue-100 text-sm">Ngày bắt đầu</p>
              </div>
              <p className="text-xl font-semibold">
                {formatDate(membership.startDate)}
              </p>
            </div>

            {/* Chỉ hiển thị ngày hết hạn nếu KHÔNG phải gói Free */}
            {!isFreePackage && (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-200" />
                  <p className="text-blue-100 text-sm">Ngày hết hạn</p>
                </div>
                <p className="text-xl font-semibold">
                  {formatDate(membership.endDate)}
                </p>
              </div>
            )}

            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-200" />
                <p className="text-blue-100 text-sm">
                  {isFreePackage ? "Thời hạn" : "Còn lại"}
                </p>
              </div>
              <p className="text-xl font-semibold">
                {isFreePackage
                  ? "Vĩnh viễn"
                  : daysRemaining > 0
                  ? `${daysRemaining} ngày`
                  : "Đã hết hạn"}
              </p>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100">Số bài đã đăng</p>
              <p className="text-xl font-semibold">
                {membership.listingsUsed} /{" "}
                {packageData.features.maxListings === -1
                  ? "Không giới hạn"
                  : packageData.features.maxListings}
              </p>
            </div>
            {packageData.features.maxListings !== -1 && (
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{
                    width: `${Math.min(
                      (membership.listingsUsed /
                        packageData.features.maxListings) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Package className="w-6 h-6 text-blue-600 mr-2" />
              Tính năng của gói
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">
                  {packageData.features.maxListings === -1
                    ? "Đăng tin không giới hạn"
                    : `Đăng tối đa ${packageData.features.maxListings} tin/tháng`}
                </span>
              </div>
              {packageData.features.featuredListing && (
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Tin nổi bật</span>
                </div>
              )}
              {packageData.features.prioritySupport && (
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Hỗ trợ ưu tiên</span>
                </div>
              )}
              {packageData.features.autoRenew && (
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Tự động gia hạn</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Thông tin thanh toán
            </h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between">
                <span>Mã giao dịch:</span>
                <span className="font-medium">{membership.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Phương thức:</span>
                <span className="font-medium">Ví điện tử</span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {membership.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/membership/upgrade")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center space-x-2 shadow-lg"
          >
            <Crown className="w-5 h-5" />
            <span>Nâng cấp gói</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleRenew}
            disabled={renewing || !membership?.isActive}
            className="bg-white text-blue-600 border-2 border-blue-600 py-4 px-6 rounded-xl hover:bg-blue-50 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {renewing ? (
              <>
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Gia hạn gói hiện tại</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyMembershipPage;
