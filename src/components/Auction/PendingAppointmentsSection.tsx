import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWonAuctionsPendingAppointment,
  type WonAuctionPendingAppointment,
} from "../../config/auctionAPI";
import { getImageUrl } from "../../utils/imageHelper";
import {
  Trophy,
  Calendar,
  ChevronRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function PendingAppointmentsSection() {
  const navigate = useNavigate();
  const [wonAuctions, setWonAuctions] = useState<
    WonAuctionPendingAppointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    loadWonAuctions();
  }, []);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
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

  // Calculate countdown for 24h deadline
  const getCountdown = (endAt: string) => {
    const endTime = new Date(endAt).getTime();
    const deadline = endTime + 24 * 60 * 60 * 1000; // 24 hours after auction end
    const remaining = deadline - now;

    if (remaining <= 0) {
      return {
        expired: true,
        text: "Đã hết hạn",
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    return {
      expired: false,
      text: `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      hours,
      minutes,
      seconds,
    };
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
        {wonAuctions.map((auction) => {
          const countdown = getCountdown(auction.endAt);
          const isUrgent = countdown.hours < 6 && !countdown.expired; // Less than 6 hours remaining
          const isExpired = countdown.expired;

          return (
            <div
              key={auction._id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                isExpired
                  ? "border-red-300 bg-red-50"
                  : isUrgent
                  ? "border-orange-300 bg-orange-50"
                  : "border-yellow-200 bg-yellow-50"
              }`}
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

                  {/* Countdown Timer */}
                  <div
                    className={`mt-3 p-3 rounded-lg ${
                      isExpired
                        ? "bg-red-100 border border-red-300"
                        : isUrgent
                        ? "bg-orange-100 border border-orange-300"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-xs font-medium ${
                            isExpired ? "text-red-700" : "text-gray-600"
                          }`}
                        >
                          {isExpired
                            ? "⚠️ Đã quá hạn tạo lịch hẹn"
                            : "Thời gian còn lại để tạo lịch hẹn"}
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            isExpired
                              ? "text-red-600"
                              : isUrgent
                              ? "text-orange-600"
                              : "text-blue-600"
                          }`}
                        >
                          {countdown.text}
                        </p>
                      </div>
                    </div>
                    {isExpired && (
                      <p className="text-xs text-red-600 mt-2">
                        Bạn sẽ bị phạt 50% tiền cọc và xe sẽ được bán lại
                      </p>
                    )}
                    {isUrgent && !isExpired && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠️ Hãy tạo lịch hẹn ngay để tránh bị phạt!
                      </p>
                    )}
                  </div>

                  {/* Winning Bid */}
                  <div className="mt-3 pt-3 border-t ${isExpired ? 'border-red-200' : isUrgent ? 'border-orange-200' : 'border-yellow-200'}">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Giá thắng cuộc</p>
                        <p className="text-lg font-bold text-green-600">
                          {auction.winningBid.price.toLocaleString("vi-VN")} VNĐ
                        </p>
                      </div>
                      <button
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                          isExpired
                            ? "bg-gray-400 cursor-not-allowed"
                            : isUrgent
                            ? "bg-orange-600 hover:bg-orange-700 animate-pulse"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isExpired) {
                            navigate(`/auctions/${auction._id}`);
                          }
                        }}
                        disabled={isExpired}
                      >
                        <Calendar className="w-4 h-4" />
                        {isExpired ? "Đã hết hạn" : "Tạo lịch hẹn ngay"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div
                className={`mt-3 pt-3 border-t text-xs text-gray-500 ${
                  isExpired
                    ? "border-red-200"
                    : isUrgent
                    ? "border-orange-200"
                    : "border-yellow-200"
                }`}
              >
                Kết thúc đấu giá:{" "}
                {new Date(auction.endAt).toLocaleString("vi-VN")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
