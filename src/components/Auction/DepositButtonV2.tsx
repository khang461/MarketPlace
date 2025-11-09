import React, { useState } from "react";
import { Wallet } from "lucide-react";
import { createDeposit, DepositResponse } from "../../config/auctionAPI";
import Swal from "sweetalert2";

interface DepositButtonV2Props {
  auctionId: string;
  depositAmount: number;
  onDepositSuccess?: () => void;
}

const DepositButtonV2: React.FC<DepositButtonV2Props> = ({
  auctionId,
  depositAmount,
  onDepositSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleDeposit = async () => {
    try {
      setIsLoading(true);

      const response: DepositResponse = await createDeposit(auctionId);

      if (response.success) {
        // Đặt cọc thành công
        await Swal.fire({
          icon: "success",
          title: "Đặt cọc thành công!",
          text:
            response.message ||
            "Bạn đã đặt cọc thành công. Có thể tham gia đấu giá.",
          confirmButtonColor: "#10b981",
          confirmButtonText: "Đóng",
        });

        if (onDepositSuccess) {
          onDepositSuccess();
        }
      } else if (response.vnpayUrl) {
        // Số dư không đủ, hiển thị popup thông báo
        await Swal.fire({
          icon: "warning",
          title: "Số dư không đủ",
          html: `
            <div class="text-left">
              <p class="mb-4 text-gray-700">${response.message}</p>
              <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg space-y-3 border border-gray-200">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Phí đặt cọc:</span>
                  <span class="font-semibold text-lg">${formatCurrency(
                    response.requiredAmount || depositAmount
                  )}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Số dư hiện tại:</span>
                  <span class="font-semibold text-lg">${formatCurrency(
                    response.currentBalance || 0
                  )}</span>
                </div>
                <div class="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                  <span class="text-gray-700 font-medium">Cần nạp thêm:</span>
                  <span class="font-bold text-xl text-red-600">${formatCurrency(
                    (response.requiredAmount || depositAmount) -
                      (response.currentBalance || 0)
                  )}</span>
                </div>
              </div>
              <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-sm text-blue-800">
                  <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  Vui lòng nạp tiền vào ví để có thể đặt cọc tham gia đấu giá
                </p>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#6b7280",
          confirmButtonText:
            '<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> Nạp tiền vào ví',
          cancelButtonText: "Để sau",
          width: "500px",
        }).then((result) => {
          if (result.isConfirmed) {
            // Chuyển đến trang nạp tiền (wallet/deposit page)
            window.location.href = "/account?tab=wallet";
          }
        });
      } else {
        // Lỗi khác
        await Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: response.message || "Không thể đặt cọc. Vui lòng thử lại.",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      console.error("Error creating deposit:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.";

      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDeposit}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5" />
          <span>Đặt cọc {formatCurrency(depositAmount)}</span>
        </>
      )}
    </button>
  );
};

export default DepositButtonV2;
