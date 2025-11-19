// appointmentAPI.ts
import api from "./api";

// ============ TYPES & INTERFACES ============

export interface Appointment {
  _id: string;
  auctionId?: string;
  appointmentType: "AUCTION" | "DEPOSIT" | "OTHER";
  buyerId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  sellerId: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  scheduledDate: string;
  location: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "RESCHEDULED"
    | "CANCELLED"
    | "COMPLETED"
    | "WAITING_REMAINING_PAYMENT"
    | "AWAITING_REMAINING_PAYMENT";
  type: "CONTRACT_SIGNING" | "INSPECTION" | "VEHICLE_INSPECTION" | "OTHER";
  notes?: string;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  buyerConfirmedAt?: string;
  sellerConfirmedAt?: string;
  confirmedAt?: string;
  rescheduledCount: number;
  maxReschedules: number;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentResponse {
  success: boolean;
  message: string;
  appointment: Appointment;
}

export interface AppointmentListResponse {
  success: boolean;
  data?: Appointment[]; // API trả về data array
  appointments?: Appointment[]; // Fallback cho format cũ
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ============ WINNER APIs ============

/**
 * 11. Tạo lịch hẹn từ phiên đấu giá (WINNER only)
 */
export const createAppointmentFromAuction = async (
  auctionId: string,
  payload?: {
    scheduledDate?: string;
    location?: string;
    notes?: string;
  }
): Promise<CreateAppointmentResponse> => {
  const response = await api.post(
    `/appointments/auction/${auctionId}`,
    payload || {}
  );
  return response.data;
};

// ============ BUYER & SELLER APIs ============

/**
 * 12. Xác nhận lịch hẹn (Buyer hoặc Seller)
 */
export const confirmAppointment = (appointmentId: string) =>
  api.post(`/appointments/${appointmentId}/confirm`);

/**
 * 13. Từ chối lịch hẹn (Tự động dời 1 tuần)
 */
export const rejectAppointment = (appointmentId: string, reason?: string) =>
  api.post(`/appointments/${appointmentId}/reject`, { reason });

/**
 * 14. Hủy lịch hẹn (Hoàn tiền)
 */
export const cancelAppointment = (appointmentId: string, reason?: string) =>
  api.put(`/appointments/${appointmentId}/cancel`, { reason });

/**
 * 15. Lấy danh sách lịch hẹn của user
 */
export const getUserAppointments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AppointmentListResponse> => {
  const response = await api.get("/appointments/user", { params });
  return response.data;
};

/**
 * Lấy danh sách lịch hẹn từ các phiên đấu giá
 */
export const getAuctionAppointments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AppointmentListResponse> => {
  const response = await api.get("/appointments/auction/list", { params });
  return response.data;
};

/**
 * 16. Lấy chi tiết lịch hẹn
 */
export const getAppointmentById = async (appointmentId: string) => {
  const response = await api.get(`/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Thanh toán phần còn lại (Buyer only)
 */
export interface PayRemainingResponse {
  paymentUrl?: string;
  qrCodeUrl?: string; // backward compatibility
  amount?: number;
}

export const payRemaining = async (
  appointmentId: string
): Promise<PayRemainingResponse> => {
  const response = await api.post(
    `/appointments/${appointmentId}/remaining-payment`,
    {}
  );
  return response.data;
};

/**
 * Lấy chi tiết lịch hẹn dành cho staff (bao gồm thông tin nhân viên phụ trách)
 */
export const getStaffAppointmentDetail = async (appointmentId: string) => {
  const response = await api.get(`/appointments/staff/${appointmentId}`);
  return response.data;
};

/**
 * 17. Xem thông tin hợp đồng
 */
export const getContract = async (appointmentId: string) => {
  const response = await api.get(`/contracts/${appointmentId}`);
  return response.data;
};

// ============ STAFF/ADMIN APIs ============

/**
 * 18. Upload ảnh hợp đồng đã ký (STAFF only)
 */
export const uploadContractPhotos = (
  appointmentId: string,
  formData: FormData
) =>
  api.post(`/contracts/${appointmentId}/upload-photos`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

/**
 * 19. Hoàn thành giao dịch (STAFF only)
 */
export const completeTransaction = (appointmentId: string) =>
  api.post(`/contracts/${appointmentId}/complete`);

/**
 * 20. Lấy danh sách lịch hẹn (STAFF only)
 */
export const getStaffAppointments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<AppointmentListResponse> => {
  const response = await api.get("/appointments/staff", { params });
  return response.data;
};
