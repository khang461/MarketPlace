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

export interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  images: string[];
  description: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerRating: number;
  location: string;
  postedDate: string;
  category: 'car' | 'battery';
  batteryCapacity?: number;
  batteryCondition?: string;
  isFeatured: boolean;
  status: 'available' | 'sold' | 'pending';
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