import api from "./api";

// Types
export interface DepositPaymentRequest {
  listingId: string;
  depositAmount: number;
}

export interface RemainingPaymentRequest {
  listingId: string;
  depositRequestId: string;
}

export interface FullPaymentRequest {
  listingId: string;
}

export interface DepositPaymentResponse {
  success: boolean;
  message: string;
  qrCode?: string; // base64 image
  paymentUrl?: string;
  orderId?: string;
  depositRequestId?: string;
  depositAmount?: number;
  action?: string;
  // Error case
  vnpayUrl?: string;
  requiredAmount?: number;
  currentBalance?: number;
  missingAmount?: number;
}

export interface RemainingPaymentResponse {
  success: boolean;
  message: string;
  qrCode: string; // base64 image
  paymentUrl: string;
  orderId: string;
  remainingAmount: number;
  depositAmount: number;
  totalAmount: number;
}

export interface FullPaymentResponse {
  success: boolean;
  message: string;
  qrCode: string; // base64 image
  paymentUrl: string;
  orderId: string;
  fullAmount: number;
}

/**
 * Đặt cọc mua xe
 */
export async function createDepositPayment(
  data: DepositPaymentRequest
): Promise<DepositPaymentResponse> {
  try {
    const response = await api.post<DepositPaymentResponse>(
      "/deposits",
      data
    );
    return response.data;
  } catch (error: any) {
    // Handle error response
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

/**
 * Tạo QR code thanh toán số tiền còn lại
 */
export async function generateRemainingPaymentQR(
  data: RemainingPaymentRequest
): Promise<RemainingPaymentResponse> {
  const response = await api.post<RemainingPaymentResponse>(
    "/deposits/generate-remaining-qr",
    data
  );
  return response.data;
}

/**
 * Tạo QR code mua full (không đặt cọc)
 */
export async function generateFullPaymentQR(
  data: FullPaymentRequest
): Promise<FullPaymentResponse> {
  const response = await api.post<FullPaymentResponse>(
    "/deposits/generate-full-qr",
    data
  );
  return response.data;
}

