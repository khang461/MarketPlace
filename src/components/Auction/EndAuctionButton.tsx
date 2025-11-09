import { useState } from "react";
import { StopCircle } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../config/api";

interface EndAuctionButtonProps {
  auctionId: string;
  currentBidCount: number;
  onAuctionEnded?: () => void;
}

export default function EndAuctionButton({
  auctionId,
  currentBidCount,
  onAuctionEnded,
}: EndAuctionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleEndAuction = async () => {
    // Hiển thị popup xác nhận
    const result = await Swal.fire({
      title: "Kết thúc phiên đấu giá?",
      html: `
        <div class="text-left">
          <p class="mb-3 text-gray-700">
            Bạn có chắc chắn muốn kết thúc phiên đấu giá này ngay bây giờ?
          </p>
          <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-3">
            <p class="text-sm text-yellow-800">
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              Hành động này không thể hoàn tác!
            </p>
          </div>
          ${
            currentBidCount > 0
              ? `
          <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p class="text-sm text-blue-800">
              <b>Hiện có ${currentBidCount} lượt đấu giá.</b>
              <br/>
              Người đấu giá cao nhất sẽ được xác định là người thắng.
              <br/>
              Những người khác sẽ được hoàn lại tiền cọc.
            </p>
          </div>
          `
              : `
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-700">
              Chưa có lượt đấu giá nào. Phiên sẽ kết thúc mà không có người thắng.
            </p>
          </div>
          `
          }
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Đồng ý, kết thúc phiên",
      cancelButtonText: "Hủy",
      width: "600px",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      // Gọi API kết thúc phiên đấu giá
      const response = await api.post(`/auctions/${auctionId}/end`);

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Đã kết thúc phiên đấu giá",
          html: `
            <div class="text-left">
              <p class="mb-3">Phiên đấu giá đã được kết thúc thành công.</p>
              ${
                response.data.winner
                  ? `
              <div class="bg-green-50 p-3 rounded-lg border border-green-200">
                <p class="text-sm text-green-800">
                  <b>Người thắng:</b> ${response.data.winner.name || "N/A"}
                  <br/>
                  <b>Giá thắng:</b> ${response.data.winningBid?.toLocaleString(
                    "vi-VN"
                  )}₫
                </p>
              </div>
              `
                  : `
              <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p class="text-sm text-gray-700">
                  Không có người thắng cuộc. Tất cả tiền cọc đã được hoàn lại.
                </p>
              </div>
              `
              }
              <p class="mt-3 text-sm text-gray-600">
                ${
                  response.data.winner
                    ? "Vui lòng chờ người mua tạo lịch hẹn để hoàn tất giao dịch."
                    : ""
                }
              </p>
            </div>
          `,
          confirmButtonColor: "#10b981",
        });

        // Callback để refresh trang
        if (onAuctionEnded) {
          onAuctionEnded();
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };

      await Swal.fire({
        icon: "error",
        title: "Lỗi",
        text:
          err?.response?.data?.message ||
          "Không thể kết thúc phiên đấu giá. Vui lòng thử lại.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEndAuction}
      disabled={loading}
      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Đang xử lý...</span>
        </>
      ) : (
        <>
          <StopCircle className="w-5 h-5" />
          <span>Kết thúc phiên đấu giá</span>
        </>
      )}
    </button>
  );
}
