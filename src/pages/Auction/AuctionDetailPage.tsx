/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Auction/AuctionDetailPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuctionById } from "../../config/auctionAPI";
import type { Auction, Bid } from "../../types/auction";
import {
  AuctionCountdown,
  DepositButton,
  BidBox,
  AuctionHistory,
} from "../../components/Auction";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../config/api";

type UIStatus = "PENDING" | "RUNNING" | "ENDED";

/** Chuẩn hoá status BE -> UI */
const mapStatus = (s: any): UIStatus => {
  const k = String(s ?? "").toLowerCase();
  if (k === "active" || k === "running") return "RUNNING";
  if (k === "ended" || k === "closed") return "ENDED";
  return "PENDING";
};

/** Bid cao nhất */
function topBid(a: Auction | null): Bid | null {
  if (!a?.bids?.length) return null;
  return [...a.bids].sort((x, y) => y.price - x.price)[0];
}

/** Tránh React crash khi lỡ render object */
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

export default function AuctionDetailPage() {
  // ✅ hooks ở đầu
  const { auctionId = "" } = useParams();
  const { user } = useAuth();
  const me =
    (user as any)?._id || (user as any)?.id || (user as any)?.userId || null;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // dùng để yêu cầu BidBox re-check trạng thái cọc sau khi DepositButton thay đổi
  const [depVersion, setDepVersion] = useState(0);

  const { isConnected, on, off, joinAuction, leaveAuction } = useSocket();

  const load = useCallback(async () => {
    if (!auctionId) return;
    setLoading(true);
    try {
      const { data } = await getAuctionById(auctionId);
      setAuction(data);

      // lấy sellerId từ nhiều nơi
      let sid =
        (data as any)?.sellerId ??
        (data as any)?.ownerId ??
        (data as any)?.createdBy ??
        (data as any)?.listing?.sellerId ??
        (data as any)?.listing?.ownerId ??
        (data as any)?.listing?.userId ??
        null;

      // nếu vẫn chưa có -> gọi listings/:id
      if (!sid) {
        const listingId =
          typeof data.listingId === "string"
            ? data.listingId
            : (data as any)?.listing?._id;
        if (listingId) {
          try {
            const r = await api.get(`/listings/${listingId}`);
            const L = r?.data || {};
            sid = L?.ownerId || L?.userId || L?.sellerId || L?.createdBy || null;
          } catch {
            /* ignore */
          }
        }
      }
      setSellerId(sid ?? null);
    } catch (e) {
      console.error("fetch auction error:", e);
      setAuction(null);
      setSellerId(null);
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

    const refresh = () => load();

    on?.("auction_bid_update", refresh);
    on?.("auction_closed", refresh);
    on?.("auction:bidPlaced", refresh);
    on?.("auction:ended", refresh);

    return () => {
      leaveAuction?.(auctionId);
      off?.("auction_bid_update", refresh);
      off?.("auction_closed", refresh);
      off?.("auction:bidPlaced", refresh);
      off?.("auction:ended", refresh);
    };
  }, [auctionId, isConnected, on, off, joinAuction, leaveAuction, load]);

  // ===== Derivations =====
  const uiStatus: UIStatus = mapStatus(auction?.status);
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
    uiStatus === "ENDED" || (!!auction && now >= new Date(auction.endAt).getTime());

  const canBid = !isEnded && inWindow && uiStatus === "RUNNING" && !isSeller;

  const currentPrice = useMemo(() => {
    if (!auction) return 0;
    if (typeof auction.currentPrice === "number" && auction.currentPrice > 0)
      return auction.currentPrice;
    const bmax = auction.bids?.length
      ? Math.max(...auction.bids.map((b) => b.price))
      : 0;
    return Math.max(bmax, auction.startingPrice || 0);
  }, [auction]);

  const title =
    (auction as any)?.listing?.title ??
    (typeof auction?.listingId === "string"
      ? auction?.listingId
      : "Chi tiết phiên đấu giá");

  const locationText =
    typeof (auction as any)?.listing?.location === "string"
      ? (auction as any)?.listing?.location
      : [
          (auction as any)?.listing?.location?.district,
          (auction as any)?.listing?.location?.city,
        ]
          .filter(Boolean)
          .join(", ");

  const winnerBid = useMemo(() => topBid(auction), [auction]);
  const isMeWinner =
    !!winnerBid && !!me && String(winnerBid.userId) === String(me);

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

  // ===== Render =====
  if (loading) {
    return <div className="container mx-auto px-4 py-6">Đang tải…</div>;
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-6">
        Không tìm thấy phiên đấu giá.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border overflow-hidden">
          <div className="aspect-[16/9] bg-gray-100">
            {(auction as any)?.listing?.thumbnail && (
              <img
                src={(auction as any).listing.thumbnail}
                className="w-full h-full object-cover"
                alt={safeText(title)}
              />
            )}
          </div>
          <div className="p-4 space-y-1">
            <h1 className="text-xl font-semibold">{safeText(title)}</h1>
            {!!locationText && (
              <div className="text-gray-600">{safeText(locationText)}</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Lịch sử đấu giá</h3>
          <AuctionHistory bids={auction.bids ?? []} />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Trạng thái:{" "}
              <b>
                {isEnded
                  ? "Đã kết thúc"
                  : uiStatus === "RUNNING"
                  ? "Đang diễn ra"
                  : "Sắp diễn ra"}
              </b>
            </div>
            <AuctionCountdown
              startAt={auction.startAt}
              endAt={auction.endAt}
              status={isEnded ? "ENDED" : uiStatus}
            />
          </div>
          <div>
            Giá khởi điểm:{" "}
            <b>{(auction.startingPrice ?? 0).toLocaleString()}₫</b>
          </div>
          <div>
            Giá hiện tại:{" "}
            <b className="text-lg">{currentPrice.toLocaleString()}₫</b>
          </div>
        </div>

        {/* Panel Kết quả khi đã kết thúc */}
        {isEnded && (
          <div className="rounded-xl border p-4 bg-gray-50 space-y-2">
            <h4 className="font-semibold">Kết quả phiên</h4>
            {winnerBid ? (
              <>
                <div className="text-sm">
                  Người thắng:{" "}
                  <b>
                    {safeText(
                      (winnerBid as any).user?.fullName ||
                        (winnerBid as any).user?.name ||
                        (winnerBid as any).user ||
                        winnerBid.userId
                    )}
                  </b>
                </div>
                <div className="text-sm">
                  Giá thắng: <b>{winnerBid.price.toLocaleString("vi-VN")}₫</b>
                </div>

                {isMeWinner && (
                  <div className="text-xs p-2 rounded-md bg-emerald-50 text-emerald-700">
                    Bạn đã thắng phiên này. Vui lòng chờ hệ thống xác nhận/khấu trừ
                    tiền cọc và liên hệ người bán để hoàn tất giao dịch.
                  </div>
                )}

                {isSeller && (
                  <div className="text-xs p-2 rounded-md bg-indigo-50 text-indigo-700">
                    Bạn là người bán. Người thắng là{" "}
                    <b>
                      {safeText(
                        (winnerBid as any).user?.fullName ||
                          (winnerBid as any).user?.name ||
                          (winnerBid as any).user ||
                          winnerBid.userId
                      )}
                    </b>{" "}
                    với mức <b>{winnerBid.price.toLocaleString("vi-VN")}₫</b>.
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-600">
                Không có lượt đấu giá nào.
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border p-4 space-y-3">
          {!isSeller ? (
            <>
              <DepositButton
                auctionId={auction._id}
                startAt={auction.startAt}
                isSeller={isSeller}
                onChanged={() => setDepVersion((v) => v + 1)} // kích BidBox re-check cọc
              />

              {/* ĐÃ KẾT THÚC -> ẩn BidBox */}
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
            <div className="p-3 rounded-md bg-amber-50 text-amber-700 text-sm">
              Bạn là <b>người đăng bán</b> cho phiên này nên không thể tham gia đấu
              giá và không cần đặt cọc.
            </div>
          )}

          {!isConnected && (
            <div className="text-xs text-amber-600">
              Mất kết nối realtime — trang vẫn hoạt động nhưng không tự cập nhật.
              Hãy tải lại nếu cần.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
