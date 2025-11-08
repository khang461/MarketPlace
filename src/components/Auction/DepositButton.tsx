/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/Auction/DepositButton.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  checkDepositStatus,
  createAuctionDeposit,
  cancelAuctionDeposit,
  type DepositStatusResp,
} from "../../config/auctionDepositAPI";
import { useAuth } from "../../contexts/AuthContext";

type UIState = "unknown" | "has" | "none";

/** Chuẩn hoá dữ liệu BE (nhiều biến thể) -> user đã có cọc hợp lệ chưa */
function pickHasDeposit(d?: any): boolean {
  if (!d) return false;
  // Swagger mẫu: { success, data: { hasDeposited, deposit: { status } } }
  if (typeof d.hasDeposited === "boolean") return d.hasDeposited;
  if (typeof d.hasDeposit === "boolean") return d.hasDeposit;
  const s: string =
    (typeof d.status === "string" && d.status) ||
    (typeof d.deposit?.status === "string" && d.deposit.status) ||
    "";
  if (!s) return false;
  const k = s.toLowerCase();
  // Các trạng thái coi như có cọc “được giữ/đã nộp”
  return ["frozen", "deposited", "held", "deducted"].includes(k);
}

/** Lấy số tiền cọc nếu có */
function pickAmount(d?: any): number | undefined {
  if (!d) return undefined;
  if (typeof d.amount === "number") return d.amount;
  if (typeof d.deposit?.depositAmount === "number") return d.deposit.depositAmount;
  return undefined;
}

/** Nhận biết lỗi duplicate key từ BE (Mongo E11000) */
function isDuplicateErr(err: any) {
  const msg = err?.response?.data?.message || err?.message || "";
  return msg.includes("E11000") || msg.toLowerCase().includes("duplicate key");
}

export default function DepositButton({
  auctionId,
  startAt,
  endAt,
  onChanged,
  isSeller = false,
}: {
  auctionId: string;
  startAt?: string;
  endAt?: string;
  onChanged?: (status: "has" | "none") => void;
  isSeller?: boolean;
}) {
  const { isAuthenticated } = useAuth();

  // Người bán -> ẩn hoàn toàn
  if (isSeller) return null;

  const [loading, setLoading] = useState(false);
  const [ui, setUi] = useState<UIState>("unknown");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [msg, setMsg] = useState<string>("");

  // đồng hồ nhỏ: để canCancel cập nhật “đúng giây”
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startMs = useMemo(
    () => (startAt ? new Date(startAt).getTime() : undefined),
    [startAt]
  );
  const endMs = useMemo(
    () => (endAt ? new Date(endAt).getTime() : undefined),
    [endAt]
  );

  const hasDeposit = ui === "has";
  const isEnded = typeof endMs === "number" && nowMs >= endMs;
  const canCancel = hasDeposit && !isEnded && (startMs === undefined || nowMs < startMs);

  const refresh = async () => {
    setMsg("");
    try {
      // checkDepositStatus trả về phần data đã bóc sẵn (core<...>)
      const d: DepositStatusResp | any = await checkDepositStatus(auctionId);
      if (!mountedRef.current) return;

      // coi như “đã có cọc” nếu pickHasDeposit(d) true
      // hoặc BE vẫn còn document deposit (d.deposit._id) => user từng cọc trước đó
      const nextHas = pickHasDeposit(d) || Boolean(d?.deposit?._id);
      const amt = pickAmount(d);

      setUi(nextHas ? "has" : "none");
      setAmount(amt);
      onChanged?.(nextHas ? "has" : "none");
    } catch {
      if (!mountedRef.current) return;
      setUi("none");
      setAmount(undefined);
      setMsg("Không thể kiểm tra trạng thái đặt cọc.");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  const handleDeposit = async () => {
    if (loading || isSeller || isEnded) return;
    setLoading(true);
    setMsg("");
    try {
      await createAuctionDeposit(auctionId);
      await refresh();
    } catch (e: any) {
      if (isDuplicateErr(e)) {
        // Có document cũ trong DB -> sync lại rồi thông báo rõ ràng
        await refresh();
        setMsg("Bạn đã có cọc cho phiên này (kể cả đã hủy). Hệ thống không cho đặt lại.");
      } else {
        setMsg(
          e?.response?.data?.message ||
            "Không thể đặt cọc. Vui lòng kiểm tra số dư hoặc thử lại."
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading || !canCancel) return;
    const ok = window.confirm(
      "Bạn chắc muốn hủy đặt cọc? Sau khi phiên bắt đầu sẽ không thể hủy."
    );
    if (!ok) return;

    setLoading(true);
    setMsg("");
    try {
      await cancelAuctionDeposit(auctionId);
      await refresh();
    } catch (e: any) {
      setMsg(
        e?.response?.data?.message ||
          "Không thể hủy đặt cọc. Phiên có thể đã bắt đầu hoặc có lỗi hệ thống."
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <a href="/signin" className="px-4 py-2 rounded-md bg-indigo-600 text-white">
        Đăng nhập để đặt cọc
      </a>
    );
  }

  // Chưa load xong
  if (ui === "unknown") return null;

  // Phiên đã kết thúc: chỉ hiển thị trạng thái
  if (isEnded) {
    return (
      <div className="flex items-center gap-2">
        {hasDeposit ? (
          <span className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 text-sm">
            Đã đặt cọc
            {typeof amount === "number" ? ` (${amount.toLocaleString("vi-VN")}₫)` : ""}
          </span>
        ) : (
          <span className="px-3 py-1 rounded bg-gray-100 text-gray-600 text-sm">
            Chưa đặt cọc
          </span>
        )}
        <span className="text-xs text-gray-500">Phiên đã kết thúc</span>
      </div>
    );
  }

  // Phiên chưa kết thúc: hiển thị hành động
  return (
    <div className="flex items-center gap-2">
      {hasDeposit ? (
        canCancel ? (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            title="Chỉ hủy được trước khi phiên bắt đầu"
          >
            {loading ? "Đang hủy…" : "Hủy đặt cọc"}
          </button>
        ) : (
          <span
            className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 text-sm"
            title="Không thể hủy sau khi phiên đã bắt đầu"
          >
            Đã đặt cọc
            {typeof amount === "number" ? ` (${amount.toLocaleString("vi-VN")}₫)` : ""}
          </span>
        )
      ) : (
        <button
          onClick={handleDeposit}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Đang xử lý…" : "Đặt cọc để tham gia"}
        </button>
      )}

      {msg && <span className="text-xs text-amber-700">{msg}</span>}
    </div>
  );
}
