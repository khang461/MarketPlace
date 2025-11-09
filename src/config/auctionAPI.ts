// auctionAPI.ts
import api from "./api";

// ============ TYPES & INTERFACES ============

export interface DepositResponse {
  success: boolean;
  message: string;
  deposit?: {
    _id: string;
    auctionId: string;
    userId: string;
    depositAmount: number;
    status: "FROZEN" | "REFUNDED" | "DEDUCTED";
    createdAt: string;
  };
  vnpayUrl?: string;
  requiredAmount?: number;
  currentBalance?: number;
}

export interface DepositStatusResponse {
  success: boolean;
  hasDeposit: boolean;
  deposit?: {
    _id: string;
    status: "FROZEN" | "REFUNDED" | "DEDUCTED";
    depositAmount: number;
    createdAt: string;
  };
}

export interface DepositFeeResponse {
  success: boolean;
  participationFee: number;
  message: string;
}

export interface WonAuctionPendingAppointment {
  _id: string;
  listingId: {
    _id: string;
    sellerId: {
      _id: string;
      email: string;
      phone: string;
      fullName: string;
    } | string;
    make: string;
    model: string;
    year: number;
    priceListed: number;
    photos: Array<{ url: string; kind: string }> | string[];
    batteryCapacity?: number;
    range?: number;
  };
  startAt: string;
  endAt: string;
  startingPrice: number;
  status: string;
  winnerId: string;
  winningBid: {
    userId: string;
    price: number;
    createdAt: string;
  };
  bids: Array<{
    userId: string | { _id: string; fullName: string };
    price: number;
    createdAt: string;
  }>;
  hasAppointment: boolean;
  appointment: {
    _id: string;
    scheduledDate: string;
    status: "PENDING" | "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED";
    buyerConfirmed: boolean;
    sellerConfirmed: boolean;
    createdAt: string;
  } | null;
}

export interface WonAuctionsPendingResponse {
  success: boolean;
  message: string;
  data: WonAuctionPendingAppointment[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// ============ SELLER APIs ============

/**
 * 1. Tạo phiên đấu giá (SELLER)
 */
export const createAuction = (payload: {
  listingId: string;
  startAt: string;
  endAt: string;
  startingPrice: number;
}) => api.post("/auctions", payload);

// ============ USER/BUYER APIs ============

/**
 * 2. Lấy thông tin phí cọc (1,000,000 VNĐ cố định)
 */
export const getDepositFee = async (): Promise<DepositFeeResponse> => {
  const response = await api.get("/auctions/deposit/fee");
  return response.data;
};

/**
 * 3. Đặt cọc tham gia đấu giá
 */
export const createDeposit = async (auctionId: string): Promise<DepositResponse> => {
  const response = await api.post(`/auctions/${auctionId}/deposit`);
  return response.data;
};

/**
 * 4. Kiểm tra trạng thái đặt cọc
 */
export const checkDepositStatus = async (auctionId: string): Promise<DepositStatusResponse> => {
  const response = await api.get(`/auctions/${auctionId}/deposit/status`);
  return response.data;
};

/**
 * 5. Hủy đặt cọc (trước khi đấu giá bắt đầu)
 */
export const cancelDeposit = (auctionId: string) =>
  api.delete(`/auctions/${auctionId}/deposit`);

/**
 * 6. Lấy danh sách phiên đang diễn ra
 */
export const getOngoingAuctions = (params?: { page?: number; limit?: number }) =>
  api.get("/auctions/ongoing", { params });

/**
 * 7. Lấy danh sách phiên sắp diễn ra
 */
export const getUpcomingAuctions = (params?: { page?: number; limit?: number }) =>
  api.get("/auctions/upcoming", { params });

/**
 * 8. Lấy danh sách phiên đã kết thúc
 */
export const getEndedAuctions = (params?: { page?: number; limit?: number }) =>
  api.get("/auctions/ended", { params });

/**
 * 9. Lấy chi tiết phiên đấu giá
 */
export const getAuctionById = (auctionId: string) =>
  api.get(`/auctions/${auctionId}`);

/**
 * 10. Đấu giá (đặt giá)
 */
export const placeBid = (auctionId: string, price: number) =>
  api.post(`/auctions/${auctionId}/bid`, { price });

/**
 * 11. Lấy danh sách phiên đấu giá đã thắng nhưng chưa có lịch hẹn
 */
export const getWonAuctionsPendingAppointment = async (params?: { 
  page?: number; 
  limit?: number 
}): Promise<WonAuctionsPendingResponse> => {
  const response = await api.get("/auctions/won/pending-appointment", { params });
  return response.data;
};

// ============ HELPER FUNCTIONS ============

/**
 * Get all auctions (với filter)
 */
export const getAllAuctions = (params?: {
  page?: number;
  limit?: number;
  status?: "ongoing" | "upcoming" | "ended";
  listingId?: string;
}) => api.get("/auctions/all", { params });
