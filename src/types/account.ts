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
  stats?: {
    soldCount?: number;
    buyCount?: number;
    cancelRate?: number;
    responseTime?: number;
    completionRate?: number;
  };
}

export interface Listing {
  _id: string;
  type: string;
  make: string;
  model: string;
  year: number;
  priceListed: number;
  status: string;
  photos: Array<{ url: string; kind: string }>;
  location: {
    city: string;
    district: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
  condition: string;
  mileageKm?: number;
  batteryCapacityKWh: number;
  chargeCycles?: number;
  tradeMethod: string;
}

export interface Transaction {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  buyerId?: string;
  sellerId?: string;
  amount: number;
  status: "completed" | "pending" | "cancelled";
  paymentMethod: string;
  date: string;
}
