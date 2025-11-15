import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Eye,
  Car,
} from "lucide-react";
import axios from "axios";
import {
  getAllAuctionsAdmin,
  approveAuction,
  rejectAuction,
} from "../../config/auctionAPI";
import { getImageUrl } from "../../utils/imageHelper";
import Swal from "sweetalert2";

interface AuctionData {
  _id: string;
  listingId: {
    _id: string;
    sellerId: string;
    make: string;
    model: string;
    year: number;
    photos: Array<{ url: string; kind: string; publicId: string }>;
    priceListed: number;
    status: string;
  };
  startAt: string;
  endAt: string;
  startingPrice: number;
  depositAmount: number;
  status:
    | "pending"
    | "approved"
    | "upcoming"
    | "ongoing"
    | "ended"
    | "cancelled";
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  bids: unknown[];
  minParticipants?: number;
  maxParticipants?: number;
  depositCount?: number;
  currentBidCount?: number;
  highestBid?: number;
  participants?: unknown[];
  canStart?: boolean;
  cancellationReason?: string;
  rejectionReason?: string;
  __v?: number;
}

type FilterTab =
  | "all"
  | "pending"
  | "approved"
  | "upcoming"
  | "ongoing"
  | "ended"
  | "rejected";

const AuctionManagementPage: React.FC = () => {
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [selectedAuction, setSelectedAuction] = useState<AuctionData | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchAuctions = async () => {
    try {
      setIsLoading(true);
      const params = activeTab === "all" ? {} : { filter: activeTab };
      const response = await getAllAuctionsAdmin(params);
      console.log("API Response:", response);
      // API trả về { success, message, data: [...], pagination }
      setAuctions(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải danh sách phiên đấu giá",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: unknown, defaultMsg: string) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as any;
      if (data?.message) return data.message;
    }
    if (error instanceof Error) return error.message;
    return defaultMsg;
  };

  const handleApprove = async (auction: AuctionData) => {
    // Nếu không còn pending thì thôi, tránh gọi API thừa
    if (auction.approvalStatus !== "pending") {
      Swal.fire({
        icon: "info",
        title: "Thông báo",
        text: "Phiên đấu giá này hiện không ở trạng thái chờ duyệt.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Phê duyệt phiên đấu giá",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Số người tham gia tối thiểu</label>
            <input 
              type="number" 
              id="minParticipants" 
              value="3" 
              min="1" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Số người tham gia tối đa</label>
            <input 
              type="number" 
              id="maxParticipants" 
              value="50" 
              min="1" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Phê duyệt",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      preConfirm: () => {
        const minInput = document.getElementById(
          "minParticipants"
        ) as HTMLInputElement;
        const maxInput = document.getElementById(
          "maxParticipants"
        ) as HTMLInputElement;
        return {
          minParticipants: parseInt(minInput.value),
          maxParticipants: parseInt(maxInput.value),
        };
      },
    });

    if (result.isConfirmed && result.value) {
      try {
        await approveAuction(auction._id, {
          minParticipants: result.value.minParticipants,
          maxParticipants: result.value.maxParticipants,
        });

        Swal.fire({
          icon: "success",
          title: "Đã phê duyệt",
          text: "Phiên đấu giá đã được phê duyệt thành công",
          timer: 2000,
          showConfirmButton: false,
        });

        await fetchAuctions();
      } catch (error: unknown) {
        console.error("Error approving auction:", error);
        const errorMessage = getErrorMessage(
          error,
          "Không thể phê duyệt phiên đấu giá"
        );
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: errorMessage,
        });
      }
    }
  };

  const handleReject = async (auction: AuctionData) => {
    if (auction.approvalStatus !== "pending") {
      Swal.fire({
        icon: "info",
        title: "Thông báo",
        text: "Phiên đấu giá này hiện không ở trạng thái chờ duyệt.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Từ chối phiên đấu giá",
      html: `
        <div class="text-left">
          <label class="block text-sm font-medium text-gray-700 mb-2">Lý do từ chối</label>
          <textarea 
            id="rejectionReason" 
            rows="4" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Nhập lý do từ chối..."
          ></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      preConfirm: () => {
        const reasonInput = document.getElementById(
          "rejectionReason"
        ) as HTMLTextAreaElement;
        const reason = reasonInput.value.trim();

        if (!reason) {
          Swal.showValidationMessage("Vui lòng nhập lý do từ chối");
          return false;
        }

        return { reason };
      },
    });

    if (result.isConfirmed && result.value) {
      try {
        await rejectAuction(auction._id, {
          reason: result.value.reason,
        });

        Swal.fire({
          icon: "success",
          title: "Đã từ chối",
          text: "Phiên đấu giá đã bị từ chối",
          timer: 2000,
          showConfirmButton: false,
        });

        await fetchAuctions();
      } catch (error: unknown) {
        console.error("Error rejecting auction:", error);
        const errorMessage = getErrorMessage(
          error,
          "Không thể từ chối phiên đấu giá"
        );
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: errorMessage,
        });
      }
    }
  };

  const openDetailModal = (auction: AuctionData) => {
    setSelectedAuction(auction);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const tabs = [
    { key: "all" as FilterTab, label: "Tất cả", count: auctions.length },
    { key: "pending" as FilterTab, label: "Chờ duyệt", icon: Clock },
    { key: "approved" as FilterTab, label: "Đã duyệt", icon: CheckCircle },
    { key: "upcoming" as FilterTab, label: "Sắp diễn ra" },
    { key: "ongoing" as FilterTab, label: "Đang diễn ra" },
    { key: "ended" as FilterTab, label: "Đã kết thúc" },
    { key: "rejected" as FilterTab, label: "Bị từ chối", icon: XCircle },
  ];

  const getStatusBadge = (auction: AuctionData) => {
    if (auction.status === "cancelled") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Đã hủy
        </span>
      );
    }

    if (auction.approvalStatus === "rejected") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Bị từ chối
        </span>
      );
    }

    if (auction.status === "ended") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Đã kết thúc
        </span>
      );
    }

    if (auction.status === "ongoing") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Đang diễn ra
        </span>
      );
    }

    if (auction.status === "upcoming") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Sắp diễn ra
        </span>
      );
    }

    if (auction.approvalStatus === "pending") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Chờ duyệt
        </span>
      );
    }

    if (auction.approvalStatus === "approved") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Đã duyệt
        </span>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold mb-1">Quản lý đấu giá</h1>
        <p className="text-slate-300 text-sm">
          Quản lý tất cả phiên đấu giá trong hệ thống
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {auctions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Không có phiên đấu giá nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian & Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auctions.map((auction) => (
                  <tr key={auction._id} className="hover:bg-gray-50">
                    {/* Tên xe */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-24">
                          <img
                            src={getImageUrl(auction.listingId.photos[0])}
                            alt={`${auction.listingId.make} ${auction.listingId.model}`}
                            className="h-16 w-24 object-cover rounded"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <Car className="w-4 h-4 text-blue-600 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {auction.listingId.make}{" "}
                              {auction.listingId.model}{" "}
                              {auction.listingId.year}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Giá niêm yết:{" "}
                            {formatPrice(auction.listingId.priceListed)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Thời gian & Giá */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(auction.startAt)}
                        </div>
                        <div className="font-semibold text-green-600">
                          {formatPrice(auction.startingPrice)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cọc: {formatPrice(auction.depositAmount)}
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(auction)}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(auction)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Xem
                        </button>
                        {auction.approvalStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(auction)}
                              className="inline-flex items-center px-3 py-1.5 border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleReject(auction)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAuction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết phiên đấu giá
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Vehicle Images */}
              <div className="grid grid-cols-2 gap-4">
                {selectedAuction.listingId.photos
                  .slice(0, 4)
                  .map((photo, index) => (
                    <img
                      key={index}
                      src={getImageUrl(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Thông tin xe
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tên xe</p>
                    <p className="font-semibold">
                      {selectedAuction.listingId.make}{" "}
                      {selectedAuction.listingId.model}{" "}
                      {selectedAuction.listingId.year}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Giá niêm yết</p>
                    <p className="font-semibold">
                      {formatPrice(selectedAuction.listingId.priceListed)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Auction Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Thông tin đấu giá
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Giá khởi điểm</p>
                    <p className="font-semibold text-green-600">
                      {formatPrice(selectedAuction.startingPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tiền cọc</p>
                    <p className="font-semibold">
                      {formatPrice(selectedAuction.depositAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Thời gian bắt đầu</p>
                    <p className="font-semibold">
                      {formatDate(selectedAuction.startAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Thời gian kết thúc</p>
                    <p className="font-semibold">
                      {formatDate(selectedAuction.endAt)}
                    </p>
                  </div>
                  {selectedAuction.minParticipants && (
                    <div>
                      <p className="text-sm text-gray-500">
                        Số người tham gia
                      </p>
                      <p className="font-semibold">
                        <Users className="inline w-4 h-4 mr-1" />
                        {selectedAuction.minParticipants} -{" "}
                        {selectedAuction.maxParticipants}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons trong modal – chỉ khi đang pending */}
              {selectedAuction.approvalStatus === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleApprove(selectedAuction);
                    }}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleReject(selectedAuction);
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuctionManagementPage;
