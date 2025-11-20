// contractAPI.ts
import api from "./api";

// ============ TYPES & INTERFACES ============

export type ContractType = "DEPOSIT" | "FULL_PAYMENT";
export type TimelineStep =
  | "SIGN_CONTRACT"
  | "NOTARIZATION"
  | "SUBMIT_REGISTRATION"
  | "WAITING_FOR_NEW_PAPERS"
  | "TRANSFER_OWNERSHIP"
  | "HANDOVER_PAPERS_AND_CAR"
  | "COMPLETED";
export type TimelineStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";
export type ContractStatus =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "SIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface ContractInfo {
  buyer: {
    name: string;
    email: string;
    phone: string;
    idNumber: string;
    address: string;
  };
  seller: {
    name: string;
    email: string;
    phone: string;
    idNumber: string;
    address: string;
  };
  vehicle: {
    title: string;
    brand: string;
    model: string;
    type: string;
    color: string;
    year: number;
    price: number;
    engineNumber: string;
    chassisNumber: string;
    licensePlate: string;
    registrationNumber: string;
    registrationDate: string;
    registrationIssuedBy: string;
    registrationIssuedTo: string;
    registrationAddress: string;
  };
  transaction: {
    depositAmount: number;
    finalPrice: number;
    appointmentDate: string;
    location: string;
    appointmentType: string;
  };
}

export interface TimelineAttachment {
  url: string;
  publicId: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TimelineStepData {
  step: TimelineStep;
  status: TimelineStatus;
  note?: string;
  dueDate?: string;
  updatedBy?: string;
  updatedAt?: string;
  attachments?: TimelineAttachment[];
}

export interface ContractPhoto {
  url: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Contract {
  _id: string;
  appointmentId: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  contractNumber: string;
  contractDate: string;
  purchasePrice: number;
  depositAmount: number;
  contractType: ContractType;
  contractTerms?: string;
  status: ContractStatus;
  signedAt?: string;
  completedAt?: string;
  contractPhotos?: ContractPhoto[];
  contractPdfUrl?: string;
  paperworkTimeline?: TimelineStepData[];
}

// ============ API RESPONSE TYPES ============

export interface CreateContractResponse {
  success: boolean;
  message: string;
  data: Contract;
}

export interface GetContractInfoResponse {
  contractInfo: ContractInfo;
}

export interface UploadPhotosResponse {
  contractId: string;
  uploadedPhotos: string[];
  contractStatus: ContractStatus;
  photos: ContractPhoto[];
}

export interface GetTimelineResponse {
  success?: boolean;
  message?: string;
  timeline?: TimelineStepData[];
  data?: TimelineStepData[]; // Backend có thể trả về data thay vì timeline
}

export interface UpdateTimelineResponse {
  timeline: TimelineStepData[];
}

export interface GeneratePdfResponse {
  contractPdfUrl?: string;
  data?: {
    contractPdfUrl?: string;
  };
}

export interface GetPdfResponse {
  contractPdfUrl: string;
  data?: {
    contractPdfUrl?: string;
  };
}

export interface CompleteTransactionResponse {
  contractId: string;
  transactionStatus: string;
  completedAt: string;
}

export interface CancelContractResponse {
  status: "CANCELLED";
  cancelledAt: string;
  reason: string;
}

// ============ API FUNCTIONS ============

/**
 * 1. Tạo hợp đồng (STAFF only)
 * POST /api/contracts/:appointmentId/create
 */
export const createContract = async (
  appointmentId: string,
  payload: {
    contractType: ContractType;
    contractTerms?: string;
  }
): Promise<CreateContractResponse> => {
  const response = await api.post(
    `/contracts/${appointmentId}/create`,
    payload
  );
  return response.data;
};

/**
 * 2. Lấy thông tin hợp đồng (buyer/seller/staff)
 * GET /api/contracts/:appointmentId
 */
export const getContractInfo = async (
  appointmentId: string
): Promise<GetContractInfoResponse> => {
  const response = await api.get(`/contracts/${appointmentId}`);
  return response.data;
};

/**
 * 3. Upload ảnh hợp đồng ký (STAFF only)
 * POST /api/contracts/:appointmentId/upload-photos
 */
export const uploadContractPhotos = async (
  appointmentId: string,
  photos: File[]
): Promise<UploadPhotosResponse> => {
  const formData = new FormData();
  photos.forEach((photo) => {
    formData.append("photos[]", photo);
  });

  const response = await api.post(
    `/contracts/${appointmentId}/upload-photos`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * 4. Lấy timeline hợp đồng
 * GET /api/contracts/:contractId/timeline
 */
export const getContractTimeline = async (
  contractId: string
): Promise<GetTimelineResponse> => {
  const response = await api.get(`/contracts/${contractId}/timeline`);
  // Backend trả về: { success: true, message: "...", data: [...] }
  // Map thành format: { timeline: [...] }
  const responseData = response.data;
  return {
    timeline: responseData.data || responseData.timeline || [],
    success: responseData.success,
    message: responseData.message,
  };
};

/**
 * 5. Cập nhật timeline step (STAFF only)
 * PATCH /api/contracts/:contractId/timeline/:step
 */
export const updateTimelineStep = async (
  contractId: string,
  step: TimelineStep,
  payload: {
    status?: TimelineStatus;
    note?: string;
    dueDate?: string;
  },
  attachments?: File[]
): Promise<UpdateTimelineResponse> => {
  const formData = new FormData();

  // Add JSON fields
  if (payload.status) formData.append("status", payload.status);
  if (payload.note) formData.append("note", payload.note);
  if (payload.dueDate) formData.append("dueDate", payload.dueDate);

  // Add attachments
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append("attachments[]", file);
    });
  }

  const response = await api.patch(
    `/contracts/${contractId}/timeline/${step}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * 6. Sinh lại PDF hợp đồng (STAFF only)
 * POST /api/contracts/:contractId/pdf
 */
export const generateContractPdf = async (
  contractId: string
): Promise<GeneratePdfResponse> => {
  const response = await api.post(`/contracts/${contractId}/pdf`);
  // Backend trả về: { success: true, message: "...", data: { contractId, contractPdfUrl } }
  const responseData = response.data;
  console.log("generateContractPdf raw response:", responseData);

  // Lấy contractPdfUrl từ data.contractPdfUrl
  const contractPdfUrl = responseData.data?.contractPdfUrl;

  return {
    contractPdfUrl: contractPdfUrl || "",
    data: responseData.data, // Giữ nguyên để có thể access sau
  };
};

/**
 * 7. Lấy/tải PDF hợp đồng (buyer/seller/staff)
 * GET /api/contracts/:contractId/pdf?redirect=true
 */
export const getContractPdf = async (
  contractId: string,
  redirect: boolean = false
): Promise<GetPdfResponse> => {
  const response = await api.get(`/contracts/${contractId}/pdf`, {
    params: redirect ? { redirect: true } : {},
  });
  // Backend trả về: { success: true, message: "...", data: { contractPdfUrl: "..." } }
  const responseData = response.data;
  console.log("getContractPdf raw response:", responseData);

  // Lấy contractPdfUrl từ data.contractPdfUrl
  const contractPdfUrl = responseData.data?.contractPdfUrl;

  return {
    contractPdfUrl: contractPdfUrl || "",
    data: responseData.data, // Giữ nguyên để có thể access sau
  };
};

/**
 * 8. Hoàn tất giao dịch (STAFF only)
 * POST /api/contracts/:appointmentId/complete
 */
export const completeTransaction = async (
  appointmentId: string
): Promise<CompleteTransactionResponse> => {
  const response = await api.post(`/contracts/${appointmentId}/complete`);
  return response.data;
};

/**
 * 9. Hủy giao dịch (STAFF only)
 * POST /api/contracts/:appointmentId/cancel
 */
export const cancelContract = async (
  appointmentId: string,
  reason: string
): Promise<CancelContractResponse> => {
  const response = await api.post(`/contracts/${appointmentId}/cancel`, {
    reason,
  });
  return response.data;
};
