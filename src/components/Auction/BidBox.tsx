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
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      {/* Header: prices */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Giá khởi điểm:{" "}
          <b>{Number(auction.startingPrice || 0).toLocaleString("vi-VN")}đ</b>
        </div>
        <div className="text-sm text-gray-600">
          Giá hiện tại: <b>{Number(cur).toLocaleString("vi-VN")}đ</b>
        </div>
      </div>

      {/* Alert for deposit / window / disabled reason */}
      {(!hasDeposit || !!disabledReason || !isWindowOpen) && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-4 w-4">
            <path d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z" />
          </svg>
          <span>{helpText}</span>
        </div>
      )}

      {/* Input + action */}
      <div className="mt-3 flex items-start gap-2">
        <label className="sr-only" htmlFor="bid-amount">Số tiền đặt giá</label>
        <div className="relative flex-1">
          <input
            id="bid-amount"
            type="number"
            min={minNext}
            step={MIN_STEP}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder={placeholder}
            className="w-full rounded-xl border px-3 py-2.5 pr-10 text-sm shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50"
            disabled={hardDisabled || busy}
            inputMode="numeric"
          />
          {/* suffix */}
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">đ</span>
        </div>
        <button
          onClick={submit}
          disabled={hardDisabled || busy}
          className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          aria-disabled={hardDisabled || busy}
        >
          {busy && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
            </svg>
          )}
          {busy ? "Đang gửi…" : "Đặt giá"}
        </button>
      </div>

      {/* Helper & messages */}
      <div className="mt-2 space-y-1">
        {helpText && <div className="text-[11px] text-gray-500">{helpText}</div>}
        {msg && <div className="text-[11px] font-medium text-amber-700">{msg}</div>}
      </div>
    </div>
  );
}
