/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import type { Auction } from "../../types/auction";
import { mapAuctionStatus, getHighestBid } from "../../types/auction";
import AuctionCountdown from "./AuctionCountdown";
import { getImageUrl } from "../../utils/imageHelper";

export default function AuctionCard({ a }: { a: Auction }) {
  // listingId có thể là object hoặc string, ưu tiên object
  const listing =
    typeof a.listingId === "object" ? a.listingId : (a as any).listing;

  // Tiêu đề: từ listing.make + model + year
  const title = listing
    ? `${listing.make} ${listing.model} ${listing.year}`
    : typeof a.listingId === "string"
    ? a.listingId
    : "Xem chi tiết";

  // Địa điểm: hỗ trợ cả string và object { district, city }
  const locationRaw = listing?.location;
  const locationText =
    typeof locationRaw === "string"
      ? locationRaw
      : [locationRaw?.district, locationRaw?.city].filter(Boolean).join(", ");

  // Giá hiện tại: ưu tiên currentPrice, fallback highest(bids) hoặc startingPrice
  const currentPrice =
    typeof a.currentPrice === "number" ? a.currentPrice : getHighestBid(a);

  // Map status API -> UI cho Countdown + badge LIVE
  // Nhưng cần check thời gian thực tế để override nếu cần
  let uiStatus = mapAuctionStatus(a.status);

  // Override status dựa trên thời gian thực tế
  const now = Date.now();
  const startTime = new Date(a.startAt).getTime();
  const endTime = new Date(a.endAt).getTime();

  if (a.status === "cancelled") {
    uiStatus = "CANCELLED";
  } else if (now >= endTime) {
    uiStatus = "ENDED";
  } else if (now >= startTime && now < endTime) {
    uiStatus = "RUNNING";
  } else if (now < startTime) {
    uiStatus = "PENDING";
  }

  // Prepare listing image: use getImageUrl helper for consistent URL handling
  const listingImageRaw =
    listing?.thumbnail ||
    (Array.isArray(listing?.photos) && listing.photos[0]) ||
    undefined;

  const listingImage = listingImageRaw
    ? getImageUrl(listingImageRaw)
    : undefined;

  return (
    <Link
      to={`/auctions/${a._id}`}
      className="group block overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
      aria-label={`Xem chi tiết đấu giá ${title}`}
    >
      {/* Media */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {listingImage ? (
          <img
            src={listingImage}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            alt={title}
            loading="lazy"
          />
        ) : null}

        {/* Status badges */}
        {uiStatus === "RUNNING" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white shadow">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            LIVE
          </span>
        )}
        {uiStatus === "CANCELLED" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white shadow">
            ĐÃ HỦY
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        {/* Location */}
        {locationText && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {/* pin icon (inline SVG để không thêm dependency) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 4.418 7 13 7 13s7-8.582 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
            </svg>
            <span className="line-clamp-1">{locationText}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-gray-900 group-hover:text-gray-950">
          {title}
        </h3>

        {/* Price & countdown row */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-1 text-sm text-gray-600">
            <span>Giá hiện tại:</span>
            <span className="text-[15px] font-bold text-gray-900">
              {currentPrice.toLocaleString()}₫
            </span>
          </div>

          <div className="shrink-0 text-right">
            <AuctionCountdown
              startAt={a.startAt}
              endAt={a.endAt}
              status={uiStatus}
            />
          </div>
        </div>

        {/* subtle divider */}
        <div className="mt-1 h-px w-full bg-gray-100" />

        {/* Footer hint */}
        <div className="flex items-center justify-between text-[11px] text-gray-500">
          <span className="opacity-90">Nhấn để xem chi tiết</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            <path d="M13.172 12 8.222 7.05l1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
