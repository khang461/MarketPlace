import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWonAuctionsPendingAppointment,
  type WonAuctionPendingAppointment,
} from "../../config/auctionAPI";
import { getImageUrl } from "../../utils/imageHelper";
import { Trophy, Calendar, ChevronRight } from "lucide-react";

export default function PendingAppointmentsSection() {
  const navigate = useNavigate();
  const [wonAuctions, setWonAuctions] = useState<
    WonAuctionPendingAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWonAuctions();
  }, []);

  const loadWonAuctions = async () => {
    setLoading(true);
    try {
      const response = await getWonAuctionsPendingAppointment({
        page: 1,
        limit: 10,
      });

      // Filter chỉ lấy phiên chưa có lịch hẹn (hasAppointment = false hoặc appointment = null)
      const pendingAuctions = (response.data || []).filter(
        (auction) => !auction.hasAppointment || auction.appointment === null
      );

      setWonAuctions(pendingAuctions);
    } catch (error) {
      console.error("❌ Error loading won auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Phiên đấu giá đã thắng
        </h2>
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (wonAuctions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Phiên đấu giá đã thắng
        </h2>
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Bạn chưa thắng phiên đấu giá nào cần tạo lịch hẹn
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Tham gia đấu giá và thắng cuộc để tạo lịch hẹn với người bán
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Phiên đấu giá đã thắng
        </h2>
        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
          {wonAuctions.length} phiên chưa tạo lịch hẹn
        </span>
      </div>

      <div className="space-y-4">
        {wonAuctions.map((auction) => (
          <div
            key={auction._id}
            className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/auctions/${auction._id}`)}
          >
            <div className="flex gap-4">
              {/* Vehicle Image */}
              <div className="flex-shrink-0">
                <img
                  src={getImageUrl(auction.listingId.photos?.[0])}
                  alt={`${auction.listingId.make} ${auction.listingId.model}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      {auction.listingId.make} {auction.listingId.model}{" "}
                      {auction.listingId.year}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      {auction.listingId.batteryCapacity && (
                        <span>
                          Pin: {auction.listingId.batteryCapacity} kWh
                        </span>
                      )}
                      {auction.listingId.range && (
                        <span>Quãng đường: {auction.listingId.range} km</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Winning Bid */}
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Giá thắng cuộc</p>
                      <p className="text-lg font-bold text-green-600">
                        {auction.winningBid.price.toLocaleString("vi-VN")} VNĐ
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/auctions/${auction._id}`);
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      Tạo lịch hẹn
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* End Date */}
            <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-gray-500">
              Kết thúc: {new Date(auction.endAt).toLocaleString("vi-VN")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
