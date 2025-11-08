// src/components/Auction/BidBox.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import type { Auction, Bid } from "../../types/auction";
import { useSocket } from "../../contexts/SocketContext";
import { checkDepositStatus, type DepositStatusResp } from "../../config/auctionDepositAPI";

const MIN_STEP = 1_000_000; // tuỳ bạn

function highest(a: Pick<Auction, "bids" | "startingPrice" | "currentPrice">) {
  if (typeof a.currentPrice === "number" && a.currentPrice > 0) return a.currentPrice;
  if (a.bids?.length) return Math.max(...a.bids.map((b) => b.price));
  return a.startingPrice || 0;
}

export default function BidBox({
  auction,
  onAfterBid,
  disabledReason,
  isSeller = false,
  refreshKey,
}: {
  auction: Auction;
  onAfterBid?: (newBid: Bid) => void;
  disabledReason?: string;
  isSeller?: boolean;
  refreshKey?: number;
}) {
  const { bidAuctionWs, onAuctionBidUpdate, onAuctionBidResult, off } = useSocket();
  const [amount, setAmount] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [hasDeposit, setHasDeposit] = useState<boolean>(false);

  // ✅ Dùng API đã normalize
  useEffect(() => {
    if (isSeller) return;
    (async () => {
      try {
        const d: DepositStatusResp = await checkDepositStatus(auction._id);
        setHasDeposit(d.hasDeposit);
      } catch {
        setHasDeposit(false);
      }
    })();
  }, [auction._id, isSeller, refreshKey]);

  const cur = useMemo(() => highest(auction), [auction]);
  const minNext = useMemo(() => cur + MIN_STEP, [cur]);

  useEffect(() => {
    setAmount(minNext);
  }, [minNext]);

  useEffect(() => {
    if (isSeller) return;
    if (!onAuctionBidUpdate || !onAuctionBidResult) return;

    const handleUpdate = (p: any) => {
      if (p?.auctionId !== auction._id) return;
      setMsg("");
      setAmount(Number(p.highest) + MIN_STEP);
      onAfterBid?.({
        userId: p.bid.userId,
        price: p.bid.price,
        createdAt: p.bid.createdAt,
      });
    };
    const handleResult = (r: any) => {
      if (r?.error) setMsg(r.error);
    };

    onAuctionBidUpdate(handleUpdate);
    onAuctionBidResult(handleResult);
    return () => {
      off?.("auction_bid_update", handleUpdate);
      off?.("auction_bid_result", handleResult);
    };
  }, [auction._id, isSeller, onAuctionBidUpdate, onAuctionBidResult, off, onAfterBid]);

  const startMs = new Date(auction.startAt).getTime();
  const endMs = new Date(auction.endAt).getTime();
  const nowMs = Date.now();
  const isWindowOpen = nowMs >= startMs && nowMs < endMs;

  const hardDisabled = !!disabledReason || !isWindowOpen || !hasDeposit || isSeller;

  const placeholder = hasDeposit
    ? `Tối thiểu: ${minNext.toLocaleString("vi-VN")}đ`
    : "Hãy đặt cọc để tham gia";

  const helpText =
    disabledReason
      ? disabledReason
      : !isWindowOpen
      ? nowMs < startMs
        ? "Phiên chưa bắt đầu"
        : "Phiên đã kết thúc"
      : !hasDeposit
      ? "Bạn cần đặt cọc trước khi đặt giá"
      : isSeller
      ? "Bạn là người bán — không thể đặt giá"
      : "";

  const submit = () => {
    setMsg("");
    if (hardDisabled) return;

    const v = Number(amount);
    if (!Number.isFinite(v) || v < minNext) {
      setMsg(`Giá phải ≥ ${minNext.toLocaleString("vi-VN")}đ`);
      return;
    }

    setBusy(true);
    try {
      bidAuctionWs?.(auction._id, v);
    } finally {
      setTimeout(() => setBusy(false), 300);
    }
  };

  if (isSeller) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Giá khởi điểm: <b>{Number(auction.startingPrice || 0).toLocaleString("vi-VN")}đ</b>
        </div>
        <div className="text-sm text-gray-600">
          Giá hiện tại: <b>{Number(cur).toLocaleString("vi-VN")}đ</b>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min={minNext}
          step={MIN_STEP}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder={placeholder}
          className="flex-1 border rounded-md px-3 py-2"
          disabled={hardDisabled || busy}
        />
        <button
          onClick={submit}
          disabled={hardDisabled || busy}
          className="px-4 py-2 rounded-md bg-emerald-600 text-white disabled:opacity-50"
        >
          {busy ? "Đang gửi…" : "Đặt giá"}
        </button>
      </div>

      {helpText && <div className="text-xs text-gray-500">{helpText}</div>}
      {msg && <div className="text-xs text-amber-700">{msg}</div>}
    </div>
  );
}
