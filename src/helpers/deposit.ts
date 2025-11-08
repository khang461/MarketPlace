// src/helpers/deposit.ts
import { DepositStatusResp } from "../config/auctionDepositAPI";

export const hasDepositFrom = (d: DepositStatusResp | undefined) => {
  if (!d) return false;
  if (typeof d.status === "string") {
    return ["deposited", "held", "deducted"].includes(d.status.toLowerCase());
  }
  return !!d.hasDeposit;
};
