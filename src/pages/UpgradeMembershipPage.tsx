import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Zap, Star, ArrowLeft, Loader2 } from "lucide-react";
import {
  membershipAPI,
  MembershipPackage,
  CurrentMembership,
  UpgradeConfirmation,
} from "../config/membershipAPI";
import Swal from "sweetalert2";

const UpgradeMembershipPage: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [currentMembership, setCurrentMembership] =
    useState<CurrentMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packagesRes, membershipRes] = await Promise.all([
        membershipAPI.getPackages(),
        membershipAPI.getCurrentMembership().catch(() => null),
      ]);

      if (packagesRes.success) {
        setPackages(packagesRes.data);
      }

      if (membershipRes?.success) {
        setCurrentMembership(membershipRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string, packageName: string) => {
    try {
      setPurchasing(packageId);

      // Bước 1: Gọi API không có confirm
      const response = await membershipAPI.purchaseMembership({
        packageId,
        confirm: false,
      });

      // Bước 2: Kiểm tra có cần confirm không
      if (response.data?.confirmRequired) {
        const confirmData = response.data as UpgradeConfirmation;

        // Hiển thị modal xác nhận nâng cấp
        const result = await Swal.fire({
          title: "⚠️ Xác nhận nâng cấp",
          html: `
            <div class="text-left space-y-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="font-semibold text-gray-900 mb-2">📦 Gói hiện tại:</p>
                <p class="text-gray-700">${confirmData.currentPackage.name} ${
            confirmData.currentPackage.features.badge
          }</p>
                <p class="text-sm text-gray-600">Còn lại: ${
                  confirmData.currentPackage.daysRemaining
                } ngày</p>
              </div>

              <div class="flex justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              <div class="bg-green-50 p-4 rounded-lg">
                <p class="font-semibold text-gray-900 mb-2">🎁 Gói mới:</p>
                <p class="text-gray-700">${confirmData.newPackage.name} ${
            confirmData.newPackage.features.badge
          }</p>
                <p class="text-sm text-gray-600">Thời hạn: ${
                  confirmData.newPackage.duration
                } ngày</p>
              </div>

              <div class="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <p class="font-semibold text-red-900 mb-2">⚠️ Lưu ý:</p>
                <div class="text-sm text-red-700 whitespace-pre-line">${
                  confirmData.warning
                }</div>
              </div>

              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="font-semibold text-gray-900 mb-2">💰 Chi phí:</p>
                <p class="text-2xl font-bold text-green-600">${confirmData.newPackage.price.toLocaleString(
                  "vi-VN"
                )}₫</p>
              </div>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#2563eb",
          cancelButtonColor: "#6b7280",
          confirmButtonText: `Xác nhận ${confirmData.actionType}`,
          cancelButtonText: "Hủy",
          width: "600px",
        });

        if (!result.isConfirmed) {
          setPurchasing(null);
          return;
        }

        // Bước 3: User xác nhận, gọi lại API với confirm=true
        const confirmedResponse = await membershipAPI.purchaseMembership({
          packageId,
          confirm: true,
        });

        // Bước 4: Xử lý response
        if (confirmedResponse.success) {
          // Trường hợp có paymentUrl (cần thanh toán qua VNPay)
          if (confirmedResponse.data?.paymentUrl) {
            await Swal.fire({
              icon: "info",
              title: "Chuyển hướng thanh toán",
              text: "Bạn sẽ được chuyển đến trang thanh toán VNPay",
              confirmButtonColor: "#2563eb",
              timer: 2000,
            });

            // Redirect sang VNPay
            window.location.href = confirmedResponse.data.paymentUrl;
            return;
          }

          // Trường hợp đã thanh toán bằng ví thành công
          if (confirmedResponse.data?.membership) {
            await Swal.fire({
              icon: "success",
              title: "Thành công! 🎉",
              html: `
                <div class="text-left space-y-2">
                  <p>${confirmedResponse.message}</p>
                  <p class="text-gray-600">Số dư mới: <strong>${confirmedResponse.data.payment?.newBalance.toLocaleString(
                    "vi-VN"
                  )}₫</strong></p>
                </div>
              `,
              confirmButtonColor: "#2563eb",
            });

            // Redirect về trang membership
            navigate("/membership");
          }
        }
      } else {
        // Không cần confirm (mua gói mới lần đầu)
        if (response.data?.paymentUrl) {
          await Swal.fire({
            icon: "info",
            title: "Chuyển hướng thanh toán",
            text: "Bạn sẽ được chuyển đến trang thanh toán VNPay",
            confirmButtonColor: "#2563eb",
            timer: 2000,
          });

          window.location.href = response.data.paymentUrl;
          return;
        }

        if (response.data?.membership) {
          await Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: response.message || "Đã mua gói thành công!",
            confirmButtonColor: "#2563eb",
          });

          navigate("/membership");
        }
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          error.response?.data?.message ||
          "Không thể mua gói. Vui lòng thử lại!",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (slug: string) => {
    switch (slug) {
      case "free":
        return <Zap className="w-8 h-8" />;
      case "basic":
        return <Check className="w-8 h-8" />;
      case "premium":
        return <Star className="w-8 h-8" />;
      case "vip":
        return <Crown className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  const getPackageColor = (slug: string) => {
    switch (slug) {
      case "free":
        return "from-gray-500 to-gray-600";
      case "basic":
        return "from-blue-500 to-blue-600";
      case "premium":
        return "from-purple-500 to-purple-600";
      case "vip":
        return "from-yellow-500 to-yellow-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách gói...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/membership")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nâng cấp trải nghiệm của bạn
          </h1>
          <p className="text-xl text-gray-600">
            Chọn gói membership phù hợp để tham gia nhiều sự kiện hơn
          </p>
        </div>

        {/* Current Package Banner */}
        {currentMembership && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-green-100">Gói hiện tại của bạn</p>
                  <p className="text-xl font-bold">
                    {currentMembership.packageId.name}{" "}
                    {currentMembership.packageId.features.badge}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-100">Còn lại</p>
                <p className="text-xl font-bold">
                  {Math.ceil(
                    (new Date(currentMembership.endDate).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  ngày
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((pkg) => {
              const isCurrentPackage =
                currentMembership?.packageId._id === pkg._id;
              const isActive = currentMembership?.isActive && isCurrentPackage;

              return (
                <div
                  key={pkg._id}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${
                    isCurrentPackage ? "ring-4 ring-green-500" : ""
                  }`}
                >
                  {/* Package Header */}
                  <div
                    className={`bg-gradient-to-br ${getPackageColor(
                      pkg.slug
                    )} p-6 text-white relative`}
                  >
                    {isCurrentPackage && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Đang dùng
                      </div>
                    )}
                    <div className="flex items-center justify-center mb-4">
                      {getPackageIcon(pkg.slug)}
                    </div>
                    <h3 className="text-2xl font-bold text-center mb-2">
                      {pkg.name}
                    </h3>
                    <div className="text-center">
                      <span className="text-3xl font-bold">
                        {pkg.price.toLocaleString("vi-VN")}₫
                      </span>
                      {!pkg.isPermanent && (
                        <span className="text-sm text-white/80">
                          /{pkg.duration} ngày
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Package Body */}
                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-6 text-center">
                      {pkg.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {pkg.features.maxListings === -1
                            ? "Không giới hạn số tin"
                            : `${pkg.features.maxListings} tin/tháng`}
                        </span>
                      </div>

                      {pkg.features.featuredListing && (
                        <div className="flex items-start space-x-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            Tin nổi bật
                          </span>
                        </div>
                      )}

                      {pkg.features.prioritySupport && (
                        <div className="flex items-start space-x-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            Hỗ trợ ưu tiên
                          </span>
                        </div>
                      )}

                      {pkg.features.autoRenew && (
                        <div className="flex items-start space-x-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            Tự động gia hạn
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handlePurchase(pkg._id, pkg.name)}
                      disabled={isActive || purchasing === pkg._id}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                        isActive
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : pkg.slug === "free"
                          ? "bg-gray-600 text-white hover:bg-gray-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {purchasing === pkg._id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Đang xử lý...</span>
                        </>
                      ) : isActive ? (
                        <span>Đã kích hoạt</span>
                      ) : (
                        <>
                          <span>Mua ngay</span>
                          <ArrowLeft className="w-5 h-5 rotate-180" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Câu hỏi thường gặp
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Làm sao để nâng cấp?
              </h3>
              <p className="text-gray-600 text-sm">
                Chọn gói phù hợp và nhấn "Mua ngay". Thanh toán sẽ được thực
                hiện qua ví điện tử của bạn.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Có thể hủy gói không?
              </h3>
              <p className="text-gray-600 text-sm">
                Bạn có thể tắt tự động gia hạn bất kỳ lúc nào. Gói sẽ hết hạn
                sau thời gian sử dụng.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Chuyển gói như thế nào?
              </h3>
              <p className="text-gray-600 text-sm">
                Bạn có thể nâng cấp lên gói cao hơn bất kỳ lúc nào. Thời gian
                còn lại sẽ được quy đổi.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Hỗ trợ thanh toán?
              </h3>
              <p className="text-gray-600 text-sm">
                Chúng tôi hỗ trợ thanh toán qua ví điện tử, chuyển khoản ngân
                hàng và thẻ tín dụng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMembershipPage;
