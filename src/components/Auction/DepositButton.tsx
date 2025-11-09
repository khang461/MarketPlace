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
  const canCancel =
    hasDeposit && !isEnded && (startMs === undefined || nowMs < startMs);

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
    console.log("🔵 handleDeposit called");
    if (loading || isSeller || isEnded) {
      console.log("⚠️ Blocked:", { loading, isSeller, isEnded });
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      console.log("🔵 Calling API...");
      const response = await createAuctionDeposit(auctionId);
      const data = response?.data || response;

      console.log("✅ Deposit response:", response);
      console.log("✅ Data:", data);
      console.log("🔍 data.success:", data.success);
      console.log("🔍 data.vnpayUrl:", data.vnpayUrl);
      console.log("🔍 data.requiredAmount:", data.requiredAmount);

      // Đặt cọc thành công
      if (data.success === true) {
        console.log("✅ Success branch");
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
        // Số dư không đủ hoặc có lỗi
        console.log("⚠️ Insufficient balance branch");
        const requiredAmount = data.requiredAmount || 1000000;
        const currentBalance = data.currentBalance || 0;
        const needAmount = requiredAmount - currentBalance;

        console.log("💰 Showing popup...");
        await Swal.fire({
          icon: "warning",
          title: "Số dư không đủ",
          html: `
            <div class="text-left">
              <p class="mb-4 text-gray-700">${
                data.message || "Số dư trong ví không đủ để đặt cọc"
              }</p>
              <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg space-y-3 border border-gray-200">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Phí đặt cọc:</span>
                  <span class="font-semibold text-lg">${requiredAmount.toLocaleString(
                    "vi-VN"
                  )}₫</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Số dư hiện tại:</span>
                  <span class="font-semibold text-lg">${currentBalance.toLocaleString(
                    "vi-VN"
                  )}₫</span>
                </div>
                <div class="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                  <span class="text-gray-700 font-medium">Cần nạp thêm:</span>
                  <span class="font-bold text-xl text-red-600">${needAmount.toLocaleString(
                    "vi-VN"
                  )}₫</span>
                </div>
              </div>
              <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-sm text-blue-800">
                  <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  Bạn sẽ được chuyển đến VNPay để nạp tiền
                </p>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#6b7280",
          confirmButtonText:
            '<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> Nạp tiền qua VNPay',
          cancelButtonText: "Để sau",
          width: "500px",
        }).then((result) => {
          if (result.isConfirmed && data.vnpayUrl) {
            console.log("🔗 Redirecting to VNPay:", data.vnpayUrl);
            // Redirect đến VNPay
            window.location.href = data.vnpayUrl;
          }
        });
        console.log("✅ Popup closed");
      } else {
        // Lỗi khác
        console.log("❓ Unknown state");
        setMsg(data.message || "Không thể đặt cọc. Vui lòng thử lại.");
      }
    } catch (e: any) {
      console.log("❌ Deposit error:", e);
      console.log("❌ Error response:", e?.response);
      console.log("❌ Error data:", e?.response?.data);

      // Kiểm tra lỗi từ response
      const errorData = e?.response?.data;

      // Trường hợp số dư không đủ (có vnpayUrl hoặc requiredAmount)
      if (errorData && (errorData.vnpayUrl || errorData.requiredAmount)) {
        const requiredAmount = errorData.requiredAmount || 1000000;
        const currentBalance = errorData.currentBalance || 0;
        const needAmount = requiredAmount - currentBalance;

        // Hiển thị popup thông báo số dư không đủ
        await Swal.fire({
          icon: "warning",
          title: "Số dư không đủ",
          html: `
            <div class="text-left">
              <p class="mb-4 text-gray-700">${
                errorData.message || "Số dư trong ví không đủ để đặt cọc"
              }</p>
              <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg space-y-3 border border-gray-200">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Phí đặt cọc:</span>
                  <span class="font-semibold text-lg">${requiredAmount.toLocaleString(
                    "vi-VN"
                  )}₫</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Số dư hiện tại:</span>
                  <span class="font-semibold text-lg">${currentBalance.toLocaleString(
                    "vi-VN"
                  )}₫</span>
                </div>
                <div class="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                  <span class="text-gray-700 font-medium">Cần nạp thêm:</span>
                  <span class="font-bold text-xl text-red-600">${needAmount.toLocaleString(
                    "vi-VN"
                  )}₫</span>
                </div>
              </div>
              <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p class="text-sm text-blue-800">
                  <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  Vui lòng nạp tiền vào ví để có thể đặt cọc tham gia đấu giá
                </p>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonColor: "#10b981",
          cancelButtonColor: "#6b7280",
          confirmButtonText:
            '<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> Nạp tiền vào ví',
          cancelButtonText: "Để sau",
          width: "500px",
        }).then((result) => {
          if (result.isConfirmed) {
            // Chuyển đến trang nạp tiền
            window.location.href = "/account?tab=wallet";
          }
        });

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
        // Lỗi khác
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
      <a
        href="/signin"
        className="px-4 py-2 rounded-md bg-indigo-600 text-white"
      >
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
            {typeof amount === "number"
              ? ` (${amount.toLocaleString("vi-VN")}₫)`
              : ""}
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
            {typeof amount === "number"
              ? ` (${amount.toLocaleString("vi-VN")}₫)`
              : ""}
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
