/* =========================
 * User / Common Types
 * ========================= */

export interface UserData {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  role?: string;
  rating?: number;
  status?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: {
    _id?: string;
    fullAddress?: string;
    ward?: string;
    district?: string;
    city?: string;
    province?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  stats?: {
    soldCount?: number;
    buyCount?: number;
    cancelRate?: number;
    responseTime?: number;   // phút/giờ (tuỳ bạn hiển thị)
    completionRate?: number; // 0..1 hoặc %
  };
}

/* =========================
 * Listing Types (khớp backend)
 * ========================= */

// Kiểu khi BE populate sellerId (Listing.find(...).populate("sellerId", "fullName phone avatar"))
export type SellerRef =
  | string
  | {
      _id: string;
      fullName?: string;
      phone?: string;
      avatar?: string;
    };

// Media từ Cloudinary (FE dùng trực tiếp `url` — đã là secure_url)
export interface Media {
  url: string;                  // Cloudinary secure_url
  kind: "photo" | "doc";
  publicId: string;             // Cloudinary public_id (để xoá/sắp xếp) - BẮT BUỘC
  width?: number;
  height?: number;
  format?: string;              // jpg | png | webp ...
}

export interface Location {
  city?: string;
  district?: string;
  address?: string;
}

export type ListingStatus =
  | "Draft"
  | "PendingReview"
  | "Published"
  | "InTransaction"
  | "Sold"
  | "Expired"
  | "Rejected";

export type TradeMethod = "meet" | "ship" | "consignment";

export type ConditionType = "New" | "LikeNew" | "Used" | "Worn";

/** Base chung cho cả Car/Battery */
interface BaseListing {
  _id: string;

  // BE có lúc trả string id, có lúc populate object → dùng union
  sellerId?: SellerRef;

  type: "Car" | "Battery";

  make?: string;
  model?: string;
  year?: number;

  condition?: ConditionType;

  photos: Media[];
  documents?: Media[];

  location?: Location;

  priceListed: number;

  // Trên BE có default "meet" nhưng có thể vắng trong vài response → để optional
  tradeMethod?: TradeMethod;

  status?: ListingStatus;
  notes?: string;
  rejectReason?: string;
  publishedAt?: string;

  createdAt: string;
  updatedAt: string;

  // Chung thêm
  mileageKm?: number;
}

/** Chỉ dành cho Car (theo mẫu hợp đồng) */
export interface CarListing extends BaseListing {
  type: "Car";
  licensePlate?: string;           // Biển số
  engineDisplacementCc?: number;   // Dung tích xi lanh (cc)
  vehicleType?: string;            // Loại xe: Sedan/SUV/Truck...
  paintColor?: string;             // Màu sơn
  engineNumber?: string;           // Số máy
  chassisNumber?: string;          // Số khung
  otherFeatures?: string;          // Đặc điểm khác

  // BE có thể gửi trường này cho Car → cho phép
  batteryCapacityKWh?: number;
  // Không dùng cho Car
  chargeCycles?: never;
}

/** Chỉ dành cho Battery */
export interface BatteryListing extends BaseListing {
  type: "Battery";
  batteryCapacityKWh?: number;
  chargeCycles?: number;

  // Car-only fields sẽ KHÔNG xuất hiện ở đây
  licensePlate?: never;
  engineDisplacementCc?: never;
  vehicleType?: never;
  paintColor?: never;
  engineNumber?: never;
  chassisNumber?: never;
  otherFeatures?: never;
}

/** Discriminated union dùng trong FE */
export type Listing = CarListing | BatteryListing;

/* =========
 * Type Guards (tiện khi render điều kiện)
 * ========= */
export const isCarListing = (l: Listing): l is CarListing => l?.type === "Car";
export const isBatteryListing = (l: Listing): l is BatteryListing =>
  l?.type === "Battery";

/* =========
 * (Giữ nguyên) Transaction
 * ========= */
export interface Transaction {
  id: string;
  vehicleId: string;         // Listing._id
  vehicleTitle: string;      // có thể build từ make/model/year
  buyerId?: string;
  sellerId?: string;
  amount: number;
  status: "completed" | "pending" | "cancelled";
  paymentMethod: string;
  date: string;              // ISO string
}
