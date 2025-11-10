export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
  rating: number;
  totalTransactions: number;
}

export interface VehicleImage {
  url: string;
  kind?: string;
}

export interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  images: (string | VehicleImage)[];
  description: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerRating: number;
  location: string;
  postedDate: string;
  category: 'car' | 'battery' | 'xe-dien' | 'pin';
  batteryCapacity?: number;
  batteryCondition?: string;
  batteryHealth?: number;
  isFeatured: boolean;
  status: 'Published' | 'InTransaction' | 'Sold' | 'Draft' | 'PendingReview' | 'available' | 'sold' | 'pending';
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  transactionId: string;
}

export interface Transaction {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
  paymentMethod: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ContractData {
  contractNumber: string;
  contractDate: string;
  meetingLocation: string;
  
  // Thông tin người bán
  seller: {
    fullName: string;
    dateOfBirth: string;
    idNumber: string;
    idIssueDate: string;
    idIssuePlace: string;
    permanentAddress: string;
    spouseName?: string;
    spouseDateOfBirth?: string;
    spouseIdNumber?: string;
    spouseIdIssueDate?: string;
    spouseIdIssuePlace?: string;
    spousePermanentAddress?: string;
  };
  
  // Thông tin người mua
  buyer: {
    fullName: string;
    dateOfBirth: string;
    idNumber: string;
    idIssueDate: string;
    idIssuePlace: string;
    permanentAddress: string;
  };
  
  // Thông tin xe
  vehicle: {
    licensePlate: string;
    brand: string;
    engineCapacity: string;
    vehicleType: string;
    color: string;
    engineNumber: string;
    chassisNumber: string;
    registrationNumber: string;
    registrationDate: string;
    registrationAuthority: string;
    additionalFeatures?: string;
  };
  
  // Thông tin tài chính
  financial: {
    totalAmount: number;
    totalAmountText: string;
    depositAmount: number;
    remainingAmount: number;
    paymentMethod: string;
  };
}
