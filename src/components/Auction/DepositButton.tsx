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
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

type UIState = "unknown" | "has" | "none";

/** Chuẩn hoá dữ liệu BE (nhiều biến thể) -> user đã có cọc hợp lệ chưa */
function pickHasDeposit(d?: any): boolean {
  if (!d) return false;
  if (typeof d.hasDeposited === "boolean") return d.hasDeposited;
  if (typeof d.hasDeposit === "boolean") return d.hasDeposit;
  const s: string =
    (typeof d.status === "string" && d.status) ||
    (typeof d.deposit?.status === "string" && d.deposit.status) ||
    "";
  if (!s) return false;
  const k = s.toLowerCase();
  return ["frozen", "deposited", "held", "deducted"].includes(k);
}

/** Lấy số tiền cọc nếu có */
function pickAmount(d?: any): number | undefined {
  if (!d) return undefined;
  if (typeof d.amount === "number") return d.amount;
  if (typeof d.deposit?.depositAmount === "number")
    return d.deposit.depositAmount;
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
  const navigate = useNavigate();

  // Người bán -> ẩn hoàn toàn
  if (isSeller) return null;

  const [loading, setLoading] = useState(false);
  const [ui, setUi] = useState<UIState>("unknown");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [msg, setMsg] = useState<string>("");

  // Modal nạp tiền (thay cho window.location.href)
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupData, setTopupData] = useState<{
    requiredAmount: number;
    currentBalance: number;
    vnpayUrl?: string;
    message?: string;
  } | null>(null);

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
  const canCancel =
    hasDeposit && !isEnded && (startMs === undefined || nowMs < startMs);

  const refresh = async () => {
    setMsg("");
    try {
      const d: DepositStatusResp | any = await checkDepositStatus(auctionId);
      if (!mountedRef.current) return;

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
      const response = await createAuctionDeposit(auctionId);
      const data = response?.data || response;

      // Đặt cọc thành công
      if (data.success === true) {
        await refresh();
        await Swal.fire({
          icon: "success",
          title: "Đặt cọc thành công!",
          text: "Bạn đã đặt cọc thành công. Có thể tham gia đấu giá.",
          confirmButtonColor: "#10b981",
        });
      } else if (
        data.success === false ||
        data.vnpayUrl ||
        data.requiredAmount
      ) {
        // Thiếu tiền -> mở modal nạp tiền
        const requiredAmount = data.requiredAmount || 1000000;
        const currentBalance = data.currentBalance || 0;
        setTopupData({
          requiredAmount,
          currentBalance,
          vnpayUrl: data.vnpayUrl,
          message: data.message || "Số dư trong ví không đủ để đặt cọc",
        });
        setTopupOpen(true);
      } else {
        setMsg(data.message || "Không thể đặt cọc. Vui lòng thử lại.");
      }
    } catch (e: any) {
      const errorData = e?.response?.data;

      // Trường hợp số dư không đủ (có vnpayUrl hoặc requiredAmount)
      if (errorData && (errorData.vnpayUrl || errorData.requiredAmount)) {
        const requiredAmount = errorData.requiredAmount || 1000000;
        const currentBalance = errorData.currentBalance || 0;
        setTopupData({
          requiredAmount,
          currentBalance,
          vnpayUrl: errorData.vnpayUrl,
          message: errorData.message || "Số dư trong ví không đủ để đặt cọc",
        });
        setTopupOpen(true);
        if (mountedRef.current) setLoading(false);
        return;
      }

      // Trường hợp duplicate key
      if (isDuplicateErr(e)) {
        await refresh();
        setMsg(
          "Bạn đã có cọc cho phiên này (kể cả đã hủy). Hệ thống không cho đặt lại."
        );
      } else {
        setMsg(
          errorData?.message ||
            e?.message ||
            "Không thể đặt cọc. Vui lòng kiểm tra số dư hoặc thử lại."
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading || !canCancel) return;

    const ok = await Swal.fire({
      icon: "question",
      title: "Hủy đặt cọc?",
      text: "Chỉ hủy được trước khi phiên bắt đầu.",
      showCancelButton: true,
      confirmButtonText: "Hủy đặt cọc",
      cancelButtonText: "Đóng",
    }).then((r) => r.isConfirmed);

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
      <a
        href="/signin"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        {/* icon login */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M10 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8v-2h7V5h-7V3Zm-1.293 5.293 1.414 1.414L8.828 11H18v2H8.828l1.293 1.293-1.414 1.414L5 12l3.707-3.707Z" />
        </svg>
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
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            {/* check icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
            Đã đặt cọc
            {typeof amount === "number"
              ? ` (${amount.toLocaleString("vi-VN")}₫)`
              : ""}
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            Chưa đặt cọc
          </span>
        )}
        <span className="text-xs text-gray-500">Phiên đã kết thúc</span>
      </div>
    );
  }

  // Phiên chưa kết thúc: hiển thị hành động
  return (
    <>
      <div className="flex items-center gap-2">
        {hasDeposit ? (
          canCancel ? (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60"
              title="Chỉ hủy được trước khi phiên bắt đầu"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
                </svg>
              )}
              {loading ? "Đang hủy…" : "Hủy đặt cọc"}
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
              title="Không thể hủy sau khi phiên đã bắt đầu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
              Đã đặt cọc
              {typeof amount === "number"
                ? ` (${amount.toLocaleString("vi-VN")}₫)`
                : ""}
            </span>
          )
        ) : (
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
              </svg>
            )}
            {loading ? "Đang xử lý…" : "Đặt cọc để tham gia"}
          </button>
        )}

        {msg && <span className="text-xs font-medium text-amber-700">{msg}</span>}
      </div>

      {/* Modal nạp tiền */}
      <TopupModal
        open={topupOpen}
        data={topupData}
        onClose={() => setTopupOpen(false)}
        onOpenVnpay={(url) => {
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener";
          a.click();
        }}
        onOpenWallet={() => {
          setTopupOpen(false);
          navigate("/wallet");
        }}
        onRefreshed={async () => {
          await refresh();
          setTopupOpen(false);
        }}
      />
    </>
  );
}

/** ================ Modal Nạp Tiền ================ */
function TopupModal({
  open,
  data,
  onClose,
  onOpenVnpay,
  onOpenWallet,
  onRefreshed,
}: {
  open: boolean;
  data: {
    requiredAmount: number;
    currentBalance: number;
    vnpayUrl?: string;
    message?: string;
  } | null;
  onClose: () => void;
  onOpenVnpay: (url: string) => void;
  onOpenWallet: () => void;
  onRefreshed: () => void | Promise<void>;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !data) return null;

  const need = Math.max(0, data.requiredAmount - data.currentBalance);

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="p-5">
            <h3 className="text-lg font-semibold">Số dư không đủ</h3>
            {data.message && <p className="mt-1 text-sm text-gray-600">{data.message}</p>}

            <div className="mt-4 space-y-3 rounded-lg border bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Phí đặt cọc</span>
                <b>{data.requiredAmount.toLocaleString("vi-VN")}₫</b>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Số dư hiện tại</span>
                <b>{data.currentBalance.toLocaleString("vi-VN")}₫</b>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium text-gray-800">Cần nạp thêm</span>
                <span className="font-bold text-red-600 text-lg">
                  {need.toLocaleString("vi-VN")}₫
                </span>
              </div>
              {data.vnpayUrl && (
                <div className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-2">
                  Bạn có thể nạp qua VNPay — chúng tôi sẽ mở trong tab mới.
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pb-5 flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Để sau
            </button>

            <button
              type="button"
              onClick={onRefreshed}
              className="px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              title="Sau khi nạp xong, bấm để cập nhật trạng thái"
            >
              Đã nạp xong • Làm mới
            </button>

            {data.vnpayUrl && (
              <button
                type="button"
                onClick={() => onOpenVnpay(data.vnpayUrl!)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Mở VNPay (tab mới)
              </button>
            )}

            <button
              type="button"
              onClick={onOpenWallet}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Mở trang Ví
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
