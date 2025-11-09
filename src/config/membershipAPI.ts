import api from "./api";

// Types
export interface MembershipFeatures {
  maxListings: number;
  prioritySupport: boolean;
  featuredListing: boolean;
  autoRenew: boolean;
  badge: string;
}

export interface MembershipPackage {
  _id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: MembershipFeatures;
  isActive: boolean;
  displayOrder: number;
  isPermanent: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface CurrentMembership {
  _id: string;
  userId: string;
  packageId: MembershipPackage;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  listingsUsed: number;
  paymentId: string;
  transactionId: string;
  status: string;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface CheckLimitResponse {
  canCreate: boolean;
  reason: string;
  current: number;
  max: number;
  packageName: string;
}

export interface PurchaseMembershipData {
  packageId: string;
  confirm?: boolean;
}

export interface UpgradeConfirmation {
  currentPackage: {
    name: string;
    slug: string;
    price: number;
    endDate: string;
    daysRemaining: number;
    features: MembershipFeatures;
  };
  newPackage: {
    name: string;
    slug: string;
    price: number;
    duration: number;
    features: MembershipFeatures;
  };
  action: string;
  actionType: string;
  warning: string;
  confirmRequired: boolean;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data?: {
    membership?: CurrentMembership;
    payment?: {
      method: string;
      amount: number;
      newBalance: number;
    };
    paymentUrl?: string; // URL VNPay nếu cần thanh toán
  } & UpgradeConfirmation;
}

export interface RenewMembershipData {
  months: number;
}

export const membershipAPI = {
  // Lấy danh sách các gói membership
  getPackages: async () => {
    const response = await api.get("/memberships/packages");
    return response.data;
  },

  // Lấy thông tin membership hiện tại của user
  getCurrentMembership: async () => {
    const response = await api.get("/memberships/current");
    return response.data;
  },

  // Kiểm tra giới hạn đăng bài
  checkLimit: async () => {
    const response = await api.get("/memberships/check-limit");
    return response.data;
  },

  // Mua gói membership
  purchaseMembership: async (data: PurchaseMembershipData) => {
    const url = data.confirm
      ? `/memberships/purchase?confirm=true`
      : `/memberships/purchase`;
    const response = await api.post(url, { packageId: data.packageId });
    return response.data as PurchaseResponse;
  },

  // Gia hạn gói membership
  renewMembership: async (data: RenewMembershipData) => {
    const response = await api.post("/memberships/renew", data);
    return response.data;
  },
};
