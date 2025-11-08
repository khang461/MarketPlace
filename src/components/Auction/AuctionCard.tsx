/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import type { Auction } from "../../types/auction";
import { mapAuctionStatus, getHighestBid } from "../../types/auction";
import AuctionCountdown from "./AuctionCountdown";

export default function AuctionCard({ a }: { a: Auction }) {
  // Tiêu đề: ưu tiên listing.title, fallback listingId
  const title =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a as any).listing?.title ||
    (typeof a.listingId === "string" ? a.listingId : "Xem chi tiết");

  // Địa điểm: hỗ trợ cả string và object { district, city }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locationRaw = (a as any).listing?.location;
  const locationText =
    typeof locationRaw === "string"
      ? locationRaw
      : [locationRaw?.district, locationRaw?.city].filter(Boolean).join(", ");

  // Giá hiện tại: ưu tiên currentPrice, fallback highest(bids) hoặc startingPrice
  const currentPrice =
    typeof a.currentPrice === "number" ? a.currentPrice : getHighestBid(a);

  // Map status API -> UI cho Countdown + badge LIVE
  const uiStatus = mapAuctionStatus(a.status);

  return (
    <Link
      to={`/auctions/${a._id}`}
      className="block rounded-xl border hover:shadow-md overflow-hidden"
    >
      <div className="aspect-[16/9] bg-gray-100">
        {(a as any).listing?.thumbnail && (
          <img
            src={(a as any).listing.thumbnail}
            className="w-full h-full object-cover"
            alt={title}
          />
        )}
      </div>

      <div className="p-3 space-y-1">
        {locationText && (
          <div className="text-sm text-gray-500">{locationText}</div>
        )}

        <h3 className="font-semibold line-clamp-1">{title}</h3>

        <div className="text-sm">
          Giá hiện tại: <b>{currentPrice.toLocaleString()}₫</b>
        </div>

        <AuctionCountdown startAt={a.startAt} endAt={a.endAt} status={uiStatus} />

        {uiStatus === "RUNNING" && (
          <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700">
            LIVE
          </span>
        )}
      </div>
    </Link>
  );
}
