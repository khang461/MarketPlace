// types/deposit.ts
export type DepositStatus = "not_deposited"|"deposited"|"held"|"refunded"|"deducted";

export interface DepositInfo {
  userId: string;
  status: DepositStatus;
  amount?: number;
  createdAt?: string;
}
