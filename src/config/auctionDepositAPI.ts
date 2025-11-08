/* eslint-disable @typescript-eslint/no-explicit-any */
// src/config/auctionDepositAPI.ts
import api from "./api";

export type DepositStatus =
  | "not_deposited"
  | "deposited"
  | "held"
  | "refunded"
  | "deducted";

export interface DepositStatusResp {
  /** Trạng thái đã chuẩn hoá cho FE dùng */
  status: DepositStatus;
  /** Cờ nhanh cho FE */
  hasDeposit: boolean;
  /** Số tiền cọc (nếu BE có trả) */
  amount?: number;
  /** Payload gốc để debug khi cần */
  raw?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/* ---------------------------- Helpers ---------------------------- */

/** Bóc lớp data lồng nhau linh hoạt */
const core = <T>(res: any): T => (res?.data?.data ?? res?.data ?? res) as T;

/** Chuẩn hoá các biến thể status từ BE về format FE */
const normalizeStatus = (raw?: string): DepositStatus => {
  const s = String(raw ?? "").trim().toLowerCase();

  // BE hiện trả "FROZEN" khi tiền đã bị phong toả -> tương đương "held"
  if (["frozen", "freeze", "locked"].includes(s)) return "held";

  if (s === "deposited") return "deposited";
  if (s === "held") return "held";
  if (s === "refunded") return "refunded";
  if (s === "deducted") return "deducted";

  return "not_deposited";
};

/** Từ payload BE -> DepositStatusResp thống nhất cho FE */
const normalizeDepositResp = (payload: any): DepositStatusResp => {
  // 2 schema phổ biến:
  // A) { hasDeposited, deposit: { status, depositAmount } }
  // B) { status, amount } hoặc { hasDeposit: boolean }

  const rawStatus =
    payload?.deposit?.status ??
    payload?.status ??
    undefined;

  const status = normalizeStatus(rawStatus);

  // Ưu tiên hasDeposited (BE của bạn), fallback hasDeposit
  const hasFlag: boolean =
    payload?.hasDeposited === true ||
    payload?.hasDeposit === true ||
    (status !== "not_deposited");

  const amount =
    typeof payload?.deposit?.depositAmount === "number"
      ? payload.deposit.depositAmount
      : typeof payload?.amount === "number"
      ? payload.amount
      : undefined;

  return {
    status,
    hasDeposit: !!hasFlag,
    amount,
    raw: payload,
  };
};

/* ----------------------------- APIs ----------------------------- */

export const createAuctionDeposit = (auctionId: string) =>
  api.post(`/auctions/${auctionId}/deposit`);

export const cancelAuctionDeposit = (auctionId: string) =>
  api.delete(`/auctions/${auctionId}/deposit`);

/**
 * Luôn trả về DepositStatusResp đã chuẩn hoá:
 * - status: 'not_deposited' | 'deposited' | 'held' | 'refunded' | 'deducted'
 * - hasDeposit: boolean (true nếu đã cọc/đang giữ/đã khấu trừ)
 * - amount: số tiền cọc nếu có
 */
export const checkDepositStatus = async (
  auctionId: string
): Promise<DepositStatusResp> => {
  const res = await api.get(`/auctions/${auctionId}/deposit/status`);
  const payload = core<any>(res); // bóc { success, data } -> data
  return normalizeDepositResp(payload);
};

export const listAuctionDeposits = async (auctionId: string) => {
  const res = await api.get(`/auctions/${auctionId}/deposits`);
  return core<any[]>(res);
};
