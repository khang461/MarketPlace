import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Calendar,
} from "lucide-react";
import { getUserAuctions } from "../../config/auctionAPI";
import { getImageUrl } from "../../utils/imageHelper";

type AuctionStatus =
  | "pending"
  | "approved"
  | "upcoming"
  | "ongoing"
  | "ended"
  | "completed"
  | "cancelled";

interface AuctionData {
  _id: string;
  listingId: {
    _id: string;
    make: string;
    model: string;
    year: number;
    photos: Array<{ url: string; kind: string; publicId?: string }>;
    priceListed: number;
    sellerId?: string;
    status?: string;
  };
  startAt: string;
  endAt: string;
  startingPrice: number;
  currentBid?: number;
  totalBids?: number;
  bids?: unknown[];
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  cancellationReason?: string;
  depositAmount: number;
  minParticipants?: number;
  maxParticipants?: number;
  depositCount?: number;
  currentBidCount?: number;
  highestBid?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AuctionsTab() {
  const navigate = useNavigate();

  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | AuctionStatus>("all");

  const loadUserAuctions = async () => {
    setLoading(true);
    try {
      const filter = activeTab === "all" ? undefined : activeTab;
      const response = await getUserAuctions({
        limit: 100,
        filter: filter as
          | "pending"
          | "approved"
          | "upcoming"
          | "ongoing"
          | "ended"
          | "rejected"
          | undefined,
      });
      const data = response.data?.data || [];
      console.log("📊 User auctions:", data);
      setAuctions(data);
    } catch (error) {
      console.error("❌ Error loading user auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const getAuctionStatus = (auction: AuctionData): AuctionStatus => {
    if (auction.approvalStatus === "pending") return "pending";
    if (auction.approvalStatus === "rejected") return "cancelled";

    const now = new Date().getTime();
    const start = new Date(auction.startAt).getTime();
    const end = new Date(auction.endAt).getTime();

    if (auction.status === "completed") return "completed";
    if (auction.status === "cancelled") return "cancelled";
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "ongoing";
    if (now > end) return "ended";
    return "completed";
  };

  const filteredAuctions =
    activeTab === "all"
      ? auctions
      : auctions.filter((auction) => getAuctionStatus(auction) === activeTab);

  const countByStatus = (status: AuctionStatus) =>
    auctions.filter((auction) => getAuctionStatus(auction) === status).length;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: AuctionStatus) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
        label: "Chờ duyệt",
      },
      approved: {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: CheckCircle,
        label: "Đã duyệt",
      },
      upcoming: {
        color: "bg-purple-100 text-purple-800 border-purple-300",
        icon: Calendar,
        label: "Sắp diễn ra",
      },
      ongoing: {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: PlayCircle,
        label: "Đang diễn ra",
      },
      ended: {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: CheckCircle,
        label: "Kết thúc",
      },
      completed: {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: CheckCircle,
        label: "Đã kết thúc",
      },
      cancelled: {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
        label: "Đã hủy/Bị từ chối",
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const renderAuctionCard = (auction: AuctionData) => {
    const status = getAuctionStatus(auction);
    const vehicleTitle = `${auction.listingId.make} ${auction.listingId.model} ${auction.listingId.year}`;
    const mainImage = auction.listingId.photos?.[0];
    const isDisabled =
      auction.status === "cancelled" ||
      auction.approvalStatus === "rejected" ||
      auction.approvalStatus === "pending";

    return (
      <div
        key={auction._id}
        className={`border border-gray-200 rounded-lg p-4 transition-shadow bg-white ${
          isDisabled
            ? "cursor-not-allowed opacity-75"
            : "hover:shadow-lg cursor-pointer"
        }`}
        onClick={() => {
          if (!isDisabled) {
            navigate(`/auctions/${auction._id}`);
          }
        }}
      >
        <div className="flex gap-4">
          {/* Image */}
          <div className="flex-shrink-0 w-32 h-24">
            <img
              src={getImageUrl(mainImage)}
              alt={vehicleTitle}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  {vehicleTitle}
                </h3>
                <p className="text-sm text-gray-500">
                  Giá niêm yết: {formatPrice(auction.listingId.priceListed)}
                </p>
              </div>
              {getStatusBadge(status)}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs text-gray-500">Giá khởi điểm</p>
                <p className="font-semibold text-green-600">
                  {formatPrice(auction.startingPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Giá hiện tại</p>
                <p className="font-semibold text-blue-600">
                  {auction.highestBid
                    ? formatPrice(auction.highestBid)
                    : formatPrice(auction.startingPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Bắt đầu</p>
                <p className="text-sm text-gray-900">
                  {formatDate(auction.startAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Kết thúc</p>
                <p className="text-sm text-gray-900">
                  {formatDate(auction.endAt)}
                </p>
              </div>
            </div>

            {auction.currentBidCount !== undefined &&
              auction.currentBidCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <Trophy className="inline w-4 h-4 text-yellow-500 mr-1" />
                    {auction.currentBidCount} lượt đấu giá
                  </p>
                </div>
              )}

            {auction.approvalStatus === "rejected" &&
              auction.rejectionReason && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <strong>Lý do từ chối:</strong> {auction.rejectionReason}
                </div>
              )}

            {auction.status === "cancelled" && auction.cancellationReason && (
              <div className="mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show SweetAlert2 modal with cancellation reason
                    import("sweetalert2").then((Swal) => {
                      Swal.default.fire({
                        icon: "warning",
                        title: "Lý do hủy phiên đấu giá",
                        text: auction.cancellationReason,
                        confirmButtonText: "Đóng",
                        confirmButtonColor: "#3b82f6",
                      });
                    });
                  }}
                  className="w-full px-3 py-2 bg-orange-50 border border-orange-300 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors"
                >
                  🔔 Xem lý do hủy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Đấu giá của tôi</h2>
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-yellow-500" />
          Đấu giá của tôi
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap relative ${
              activeTab === "all"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tất cả
              {auctions.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {auctions.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap relative ${
              activeTab === "pending"
                ? "text-yellow-600 border-b-2 border-yellow-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Chờ duyệt
              {countByStatus("pending") > 0 && (
                <span className="bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {countByStatus("pending")}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap relative ${
              activeTab === "approved"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Đã duyệt
              {countByStatus("approved") > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {countByStatus("approved")}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap relative ${
              activeTab === "upcoming"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Sắp diễn ra
              {countByStatus("upcoming") > 0 && (
                <span className="bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {countByStatus("upcoming")}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("ongoing")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap relative ${
              activeTab === "ongoing"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              Đang diễn ra
              {countByStatus("ongoing") > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {countByStatus("ongoing")}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("ended")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap relative ${
              activeTab === "ended"
                ? "text-gray-600 border-b-2 border-gray-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Kết thúc
              {countByStatus("ended") > 0 && (
                <span className="bg-gray-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {countByStatus("ended")}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {filteredAuctions.length > 0 ? (
            filteredAuctions.map((auction) => renderAuctionCard(auction))
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold">
                {activeTab === "all"
                  ? "Chưa có phiên đấu giá nào"
                  : activeTab === "pending"
                  ? "Không có phiên đấu giá nào đang chờ duyệt"
                  : activeTab === "approved"
                  ? "Không có phiên đấu giá nào đã duyệt"
                  : activeTab === "upcoming"
                  ? "Không có phiên đấu giá nào sắp diễn ra"
                  : activeTab === "ongoing"
                  ? "Không có phiên đấu giá nào đang diễn ra"
                  : "Không có phiên đấu giá nào đã kết thúc"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Tạo phiên đấu giá mới để bắt đầu
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
