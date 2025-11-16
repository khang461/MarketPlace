/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Auction/AuctionDetailPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuctionById } from "../../config/auctionAPI";
import type { Auction, Bid } from "../../types/auction";
import {
  AuctionCountdown,
  DepositButton,
  BidBox,
  AuctionHistory,
  EndAuctionButton,
} from "../../components/Auction";
import CreateAppointmentButton from "../../components/Auction/CreateAppointmentButton";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../config/api";
import { getImageUrl } from "../../utils/imageHelper";

/** =================== Utils =================== */
type UIStatus = "PENDING" | "RUNNING" | "ENDED" | "CANCELLED";

function topBid(a: Auction | null): Bid | null {
  if (!a?.bids?.length) return null;
  return [...a.bids].sort((x, y) => y.price - x.price)[0];
}

function safeText(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string" || typeof val === "number") return String(val);
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    return (
      (o.fullName as string) ||
      (o.name as string) ||
      (o.title as string) ||
      (o._id as string) ||
      (o.id as string) ||
      (o.userId as string) ||
      JSON.stringify(o)
    );
  }
  try {
    return String(val);
  } catch {
    return "";
  }
}

const fmtVND = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n)
    ? n.toLocaleString("vi-VN") + "₫"
    : "0₫";

const StatusBadge = ({
  status,
}: {
  status: UIStatus | "ENDED" | "CANCELLED";
}) => {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 border border-amber-200",
    RUNNING: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    ENDED: "bg-gray-200 text-gray-700 border border-gray-300",
    CANCELLED: "bg-red-100 text-red-700 border border-red-200",
  };
  const label =
    status === "RUNNING"
      ? "Đang diễn ra"
      : status === "ENDED"
      ? "Đã kết thúc"
      : status === "CANCELLED"
      ? "Đã hủy"
      : "Sắp diễn ra";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${map[status]}`}
    >
      {label}
    </span>
  );
};

/** Lấy userId dạng string từ 1 bid để so sánh */
function extractBidUserId(b: Bid | any): string | null {
  if (!b) return null;
  // userId có thể là string hoặc object
  if (typeof b.userId === "string") return b.userId;
  if (b.userId && typeof b.userId === "object") {
    const u = b.userId as any;
    return (
      u._id?.toString() || u.id?.toString() || u.userId?.toString() || null
    );
  }
  if (b.user && typeof b.user === "object") {
    const u = b.user as any;
    return (
      u._id?.toString() || u.id?.toString() || u.userId?.toString() || null
    );
  }
  return null;
}

export default function AuctionDetailPage() {
  const { auctionId = "" } = useParams();
  const { user } = useAuth();
  const me =
    (user as any)?._id || (user as any)?.id || (user as any)?.userId || null;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerIdLoaded, setSellerIdLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // dùng để yêu cầu BidBox re-check trạng thái cọc sau khi DepositButton thay đổi
  const [depVersion, setDepVersion] = useState(0);

  // Trạng thái “đã xác nhận” để hiển thị nút đặt cọc gốc
  const [confirmedDeposit, setConfirmedDeposit] = useState(false);

  // NEW: modal xác nhận thay cho window.confirm
  const [showConfirm, setShowConfirm] = useState(false);

  const { isConnected, on, off, joinAuction, leaveAuction } = useSocket();

  const load = useCallback(async () => {
    if (!auctionId) return;
    setLoading(true);
    try {
      const { data } = await getAuctionById(auctionId);
      setAuction(data);

      // Lấy sellerId từ response
      let sid: string | null = null;

      if ((data as any)?.seller?.userId) {
        sid = (data as any).seller.userId;
      } else if ((data as any)?.sellerId) {
        sid = (data as any).sellerId;
      } else if ((data as any)?.listingId?.sellerId) {
        sid = (data as any).listingId.sellerId;
      } else {
        sid =
          (data as any)?.ownerId ??
          (data as any)?.createdBy ??
          (data as any)?.listing?.sellerId ??
          (data as any)?.listing?.ownerId ??
          (data as any)?.listing?.userId ??
          null;
      }

      if (!sid) {
        const listingId =
          typeof data.listingId === "string"
            ? data.listingId
            : (data as any)?.listingId?._id;
        if (listingId) {
          try {
            const r = await api.get(`/listings/${listingId}`);
            const L = r?.data || {};
            sid =
              L?.ownerId || L?.userId || L?.sellerId || L?.createdBy || null;
          } catch {
            /* ignore */
          }
        }
      }

      setSellerId(sid ?? null);
      setSellerIdLoaded(true);
    } catch (e) {
      console.error("fetch auction error:", e);
      setAuction(null);
      setSellerId(null);
      setSellerIdLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime đăng ký/unregister
  useEffect(() => {
    if (!auctionId || !isConnected) return;
    joinAuction?.(auctionId);

    // Handler for instant bid updates - update state directly without API call
    const handleBidUpdate = (data: any) => {
      console.log("🔥 Instant bid update:", data);

      // Update auction state immediately from WebSocket data
      setAuction((prev) => {
        if (!prev) return prev;

        const newBid = data.bid || data.newBid;
        if (!newBid) return prev;

        // Add new bid to the list
        const updatedBids = [...(prev.bids || []), newBid];

        // Update current price
        const newCurrentPrice = Math.max(
          newBid.price,
          prev.currentPrice || prev.startingPrice || 0
        );

        return {
          ...prev,
          bids: updatedBids,
          currentPrice: newCurrentPrice,
          // Update other fields if provided
          ...(data.auction && {
            status: data.auction.status || prev.status,
            winnerId: data.auction.winnerId || prev.winnerId,
          }),
        };
      });
    };

    // Handler for auction ended event
    const handleAuctionEnded = (data: any) => {
      console.log("🏁 Auction ended:", data);
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "ended",
          winnerId: data.winnerId || data.auction?.winnerId || prev.winnerId,
        };
      });
    };

    // Handler for auction closed
    const handleAuctionClosed = () => {
      console.log("🔒 Auction closed");
      load(); // Full reload for closed auctions
    };

    // Listen to all bid-related events
    on?.("auction_bid_update", handleBidUpdate);
    on?.("auction:bidPlaced", handleBidUpdate);
    on?.("new_bid", handleBidUpdate);
    on?.("auction:ended", handleAuctionEnded);
    on?.("auction_closed", handleAuctionClosed);

    return () => {
      leaveAuction?.(auctionId);
      off?.("auction_bid_update", handleBidUpdate);
      off?.("auction:bidPlaced", handleBidUpdate);
      off?.("new_bid", handleBidUpdate);
      off?.("auction:ended", handleAuctionEnded);
      off?.("auction_closed", handleAuctionClosed);
    };
  }, [auctionId, isConnected, on, off, joinAuction, leaveAuction, load]);

  // ===== Tính trạng thái UI dựa trên status + thời gian =====
  const uiStatus: UIStatus = useMemo(() => {
    if (!auction) return "PENDING";

    const raw = String(
      (auction as any).displayStatus ?? auction.status ?? ""
    ).toLowerCase();

    const now = Date.now();
    const start = new Date(auction.startAt).getTime();
    const end = new Date(auction.endAt).getTime();

    // Ưu tiên cancelled
    if (raw === "cancelled") return "CANCELLED";

    // Ưu tiên ended / hết giờ
    if (raw === "ended" || raw === "closed") return "ENDED";
    if (now >= end) return "ENDED";

    // Đang diễn ra theo status
    if (raw === "active" || raw === "running" || raw === "ongoing") {
      return "RUNNING";
    }

    // Đang diễn ra theo thời gian (status vẫn là 'approved')
    if (now >= start && now < end) {
      return "RUNNING";
    }

    // Còn lại: chưa đến giờ
    return "PENDING";
  }, [auction]);

  const isSeller = useMemo(
    () => !!me && !!sellerId && String(me) === String(sellerId),
    [me, sellerId]
  );

  const now = Date.now();
  const inWindow =
    !!auction &&
    new Date(auction.startAt).getTime() <= now &&
    now < new Date(auction.endAt).getTime();

  const isEnded =
    uiStatus === "ENDED" ||
    (!!auction && now >= new Date(auction.endAt).getTime());

  const isCancelled =
    uiStatus === "CANCELLED" || auction?.status === "cancelled";

  const canBid =
    !isEnded && !isCancelled && inWindow && uiStatus === "RUNNING" && !isSeller;

  const currentPrice = useMemo(() => {
    if (!auction) return 0;
    if (typeof auction.currentPrice === "number" && auction.currentPrice > 0)
      return auction.currentPrice;
    const bmax = auction.bids?.length
      ? Math.max(...auction.bids.map((b) => b.price))
      : 0;
    return Math.max(bmax, auction.startingPrice || 0);
  }, [auction]);

  // Get listing from auction (listingId can be object or string)
  const listing =
    auction && typeof auction.listingId === "object"
      ? auction.listingId
      : (auction as any)?.listing;

  // Title from listing make + model + year
  const title = listing
    ? `${listing.make} ${listing.model} ${listing.year}`
    : typeof auction?.listingId === "string"
    ? auction.listingId
    : "Chi tiết phiên đấu giá";

  const locationText =
    typeof listing?.location === "string"
      ? listing.location
      : [listing?.location?.district, listing?.location?.city]
          .filter(Boolean)
          .join(", ");

  // Get all photos for gallery
  const photos = Array.isArray(listing?.photos) ? listing.photos : [];

  // Get hero image using getImageUrl helper for consistent URL handling
  const heroThumb =
    photos.length > 0 ? getImageUrl(photos[currentImageIndex]) : undefined;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const winnerBid = useMemo(() => topBid(auction), [auction]);

  // Kiểm tra winner - userId có thể là string hoặc object
  const isMeWinner = useMemo(() => {
    if (!winnerBid || !me) return false;
    const winnerUserId = extractBidUserId(winnerBid);
    return !!winnerUserId && String(winnerUserId) === String(me);
  }, [winnerBid, me]);

  const onAfterBid = (b: Bid) => {
    setAuction((prev) =>
      prev
        ? {
            ...prev,
            currentPrice: Math.max(b.price, prev.currentPrice || 0),
            bids: [b, ...(prev.bids || [])],
          }
        : prev
    );
  };

  /** ====== xử lý lịch sử đấu giá top 10 giá cao nhất ====== */
  const topBids = useMemo(() => {
    if (!auction?.bids?.length) return [];
    // sắp xếp theo giá cao → thấp, lấy 10 người đầu
    const byPrice = [...auction.bids].sort((a, b) => b.price - a.price);
    return byPrice.slice(0, 10);
  }, [auction]);

  const currentTopUserId = useMemo(() => {
    if (!topBids.length) return null;
    return extractBidUserId(topBids[0]);
  }, [topBids]);

  /** ====== Deposit amount & confirmation flow ====== */
  const depositAmount = useMemo(() => {
    // Ưu tiên các field do BE trả về
    const raw =
      (auction as any)?.depositAmount ??
      (auction as any)?.requiredDeposit ??
      (auction as any)?.deposit?.amount;

    if (typeof raw === "number" && raw > 0) {
      return Math.round(raw);
    }
    // Fallback: 10% của max(currentPrice, startingPrice), làm tròn 1,000₫
    const base = Math.max(currentPrice || 0, auction?.startingPrice || 0);
    const est = Math.max(0, Math.round(base * 0.1));
    return Math.round(est / 1000) * 1000;
  }, [auction, currentPrice]);

  const depositWrapRef = useRef<HTMLDivElement | null>(null);

  // Nếu người dùng đã xác nhận, thử auto-click nút bên trong DepositButton (nếu trình duyệt cho phép)
  useEffect(() => {
    if (!confirmedDeposit) return;
    const id = requestAnimationFrame(() => {
      const btn = depositWrapRef.current?.querySelector<HTMLButtonElement>(
        "button, [role='button']"
      );
      btn?.click?.(); // auto click 1 lần; nếu bị chặn, người dùng bấm thủ công
    });
    return () => cancelAnimationFrame(id);
  }, [confirmedDeposit]);

  // NEW: mở/đóng modal xác nhận
  const handleOpenConfirm = () => setShowConfirm(true);
  const handleConfirmDeposit = () => {
    setShowConfirm(false);
    setConfirmedDeposit(true);
  };

  /** =================== Render =================== */
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 rounded-2xl bg-gray-200" />
            <div className="h-40 rounded-2xl bg-gray-200" />
          </div>
          <div className="space-y-4">
            <div className="h-44 rounded-2xl bg-gray-200" />
            <div className="h-80 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="rounded-2xl border bg-white p-6 text-center">
          Không tìm thấy phiên đấu giá.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Hero + History */}
      <div className="lg:col-span-2 space-y-4">
        {/* Hero */}
        <div className="rounded-2xl border overflow-hidden bg-white shadow-sm">
          <div className="relative aspect-[16/9] bg-gray-100">
            {heroThumb ? (
              <img
                src={heroThumb}
                className="w-full h-full object-cover"
                alt={safeText(title)}
              />
            ) : (
              <div className="w-full h-full grid place-content-center text-gray-400">
                Không có ảnh
              </div>
            )}

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Ảnh trước"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Ảnh tiếp theo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                  </svg>
                </button>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {photos.length}
                </div>
              </>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={
                    isCancelled ? "CANCELLED" : isEnded ? "ENDED" : uiStatus
                  }
                />
                <AuctionCountdown
                  startAt={auction.startAt}
                  endAt={auction.endAt}
                  status={
                    isCancelled ? "CANCELLED" : isEnded ? "ENDED" : uiStatus
                  }
                />
              </div>
              <h1 className="mt-2 text-white text-xl md:text-2xl font-semibold drop-shadow">
                {safeText(title)}
              </h1>
              {!!locationText && (
                <div className="text-white/90 text-sm drop-shadow">
                  {safeText(locationText)}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Navigation */}
          {photos.length > 1 && (
            <div className="p-4 flex space-x-2 overflow-x-auto bg-gray-50">
              {photos.map((photo: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? "border-blue-600 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={getImageUrl(photo)}
                    alt={`${safeText(title)} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Price strip */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Giá khởi điểm</div>
              <div className="font-semibold">
                {fmtVND(auction.startingPrice ?? 0)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Giá hiện tại</div>
              <div className="font-semibold text-lg">
                {fmtVND(currentPrice)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Lượt đặt giá</div>
              <div className="font-semibold">{auction.bids?.length ?? 0}</div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl border bg-white shadow-sm p-4">
          <h3 className="font-semibold mb-3">Lịch sử đấu giá</h3>
          {auction.bids?.length ? (
            <AuctionHistory
              bids={topBids as any}
              topUserId={currentTopUserId || undefined}
              meId={me}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">
              Chưa có lượt đấu giá nào.
            </div>
          )}
        </div>

        {/* Result panel on mobile */}
        {isEnded && (
          <div className="lg:hidden rounded-2xl border bg-white shadow-sm p-4 space-y-3">
            <ResultPanel
              auction={auction}
              winnerBid={winnerBid}
              isMeWinner={isMeWinner}
              isSeller={isSeller}
            />
          </div>
        )}
      </div>

      {/* RIGHT: Sticky Actions */}
      <aside className="space-y-4 lg:sticky lg:top-20 self-start">
        {/* Summary card */}
        <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Trạng thái:
              <span className="ml-2">
                <StatusBadge
                  status={
                    isCancelled ? "CANCELLED" : isEnded ? "ENDED" : uiStatus
                  }
                />
              </span>
            </div>
            <AuctionCountdown
              startAt={auction.startAt}
              endAt={auction.endAt}
              status={isCancelled ? "CANCELLED" : isEnded ? "ENDED" : uiStatus}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Giá khởi điểm</div>
              <div className="font-semibold">
                {fmtVND(auction.startingPrice ?? 0)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Giá hiện tại</div>
              <div className="font-semibold text-lg">
                {fmtVND(currentPrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Reason */}
        {isCancelled && auction.cancellationReason && (
          <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Lý do hủy phiên đấu giá
                </h3>
                <p className="text-sm text-red-800">
                  {auction.cancellationReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result panel on desktop */}
        {isEnded && !isCancelled && (
          <div className="hidden lg:block rounded-2xl border bg-white shadow-sm p-4 space-y-3">
            <ResultPanel
              auction={auction}
              winnerBid={winnerBid}
              isMeWinner={isMeWinner}
              isSeller={isSeller}
            />
          </div>
        )}

        {/* Actions */}
        <div className="rounded-2xl border bg-white shadow-sm p-4 space-y-3">
          {isCancelled ? (
            <div className="p-4 text-center">
              <p className="text-red-600 font-medium">
                Phiên đấu giá đã bị hủy
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Không thể thực hiện thao tác
              </p>
            </div>
          ) : !sellerIdLoaded ? (
            <div className="p-3 text-center text-gray-500">
              Đang kiểm tra quyền...
            </div>
          ) : !isSeller ? (
            <>
              {/* Hiển thị giá đặt cọc */}
              <div className="rounded-lg bg-gray-50 p-3 border">
                <div className="text-xs text-gray-500">Giá đặt cọc</div>
                <div className="text-lg font-semibold">
                  {fmtVND(depositAmount)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Số tiền sẽ được hoàn lại theo chính sách nếu phiên không thành
                  công hoặc bạn không thắng (tuỳ điều khoản).
                </div>
              </div>

              {/* Nút mở modal xác nhận */}
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={isEnded}
                className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 active:scale-[.99] transition"
              >
                Đặt cọc để tham gia
              </button>

              {/* Sau khi user đồng ý: hiển thị DepositButton gốc (auto-click một lần nếu có thể) */}
              {confirmedDeposit && (
                <div className="rounded-lg border p-3">
                  <div className="text-sm mb-2">
                    Đang xử lý đặt cọc {fmtVND(depositAmount)}…
                    <span className="text-gray-500">
                      {" "}
                      (nếu chưa thấy gì, vui lòng bấm nút bên dưới)
                    </span>
                  </div>
                  <div ref={depositWrapRef} className="inline-flex">
                    <DepositButton
                      auctionId={auction._id}
                      startAt={auction.startAt}
                      isSeller={isSeller}
                      onChanged={() => {
                        setDepVersion((v) => v + 1); // kích BidBox re-check cọc
                        // Không reset confirmedDeposit để người dùng có thể thấy lại nút nếu cần thanh toán lại
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Box đặt giá */}
              {!isEnded && (
                <BidBox
                  auction={auction}
                  isSeller={isSeller}
                  refreshKey={depVersion}
                  disabledReason={
                    !canBid
                      ? uiStatus === "PENDING"
                        ? "Phiên chưa bắt đầu"
                        : "Không thể đặt giá"
                      : undefined
                  }
                  onAfterBid={onAfterBid}
                />
              )}
            </>
          ) : (
            <>
              <div className="p-3 rounded-md bg-amber-50 text-amber-700 text-sm">
                Bạn là <b>người đăng bán</b> cho phiên này.
              </div>

              {!isEnded && uiStatus === "RUNNING" && (
                <EndAuctionButton
                  auctionId={auction._id}
                  currentBidCount={auction.bids?.length || 0}
                  onAuctionEnded={load}
                />
              )}

              {isEnded && (
                <div className="p-3 rounded-md bg-gray-50 text-gray-700 text-sm">
                  Phiên đấu giá đã kết thúc.
                  {winnerBid && (
                    <div className="mt-2">
                      Vui lòng chờ người mua tạo lịch hẹn để hoàn tất giao dịch.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!isConnected && (
            <div className="text-xs text-amber-600">
              Mất kết nối realtime — trang vẫn hoạt động nhưng không tự cập
              nhật. Hãy tải lại nếu cần.
            </div>
          )}
        </div>
      </aside>

      {/* NEW: Modal xác nhận đặt cọc */}
      <ConfirmDepositModal
        open={showConfirm}
        amount={depositAmount}
        onConfirm={handleConfirmDeposit}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  );
}

/** =================== Result Panel =================== */
function ResultPanel({
  auction,
  winnerBid,
  isMeWinner,
  isSeller,
}: {
  auction: Auction;
  winnerBid: Bid | null;
  isMeWinner: boolean;
  isSeller: boolean;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Kết quả phiên</h4>
      {winnerBid ? (
        <>
          <div className="text-sm">
            Người thắng:{" "}
            <b>
              {safeText(
                (winnerBid as any).userId?.fullName ||
                  (winnerBid as any).userId?.name ||
                  (winnerBid as any).user?.fullName ||
                  (winnerBid as any).user?.name ||
                  (winnerBid as any).user ||
                  winnerBid.userId
              )}
            </b>
          </div>
          <div className="text-sm">
            Giá thắng: <b>{fmtVND(winnerBid.price)}</b>
          </div>

          {isMeWinner && (
            <>
              <div className="text-xs p-2 rounded-md bg-emerald-50 text-emerald-700">
                🎉 Chúc mừng! Bạn đã thắng phiên đấu giá này.
                <br />
                Vui lòng tạo lịch hẹn để ký hợp đồng với người bán.
              </div>
              <CreateAppointmentButton
                auctionId={auction._id}
                isWinner={isMeWinner}
                winningPrice={winnerBid.price}
                endAt={auction.endAt}
              />
            </>
          )}

          {isSeller && (
            <div className="text-xs p-2 rounded-md bg-indigo-50 text-indigo-700">
              Bạn là người bán. Người thắng là{" "}
              <b>
                {safeText(
                  (winnerBid as any).userId?.fullName ||
                    (winnerBid as any).userId?.name ||
                    (winnerBid as any).user?.fullName ||
                    (winnerBid as any).user?.name ||
                    (winnerBid as any).user ||
                    winnerBid.userId
                )}
              </b>{" "}
              với mức <b>{fmtVND(winnerBid.price)}</b>.
              <br />
              Vui lòng chờ người mua tạo lịch hẹn và xác nhận để hoàn tất giao
              dịch.
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-gray-600">Không có lượt đấu giá nào.</div>
      )}
    </div>
  );
}

/** =================== Confirm Deposit Modal =================== */
function ConfirmDepositModal({
  open,
  amount,
  onConfirm,
  onClose,
}: {
  open: boolean;
  amount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="p-5">
            <h3 className="text-lg font-semibold">Xác nhận đặt cọc</h3>
            <p className="mt-2 text-sm text-gray-600">
              Bạn sẽ đặt cọc <b>{fmtVND(amount)}</b> để tham gia phiên đấu giá
              này. Bạn có chắc muốn tiếp tục không?
            </p>
          </div>
          <div className="px-5 pb-5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              type="button"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
