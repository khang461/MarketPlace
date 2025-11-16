export interface Notification {
  _id: string;
  userId: string;
  type:
    | "message"
    | "offer"
    | "appointment"
    | "listing"
    | "system"
    | "auction_approved"
    | "auction_rejected"
    | "new_auction"
    | "auction_cancelled";
  title: string;
  message: string;
  relatedId?: string;
  chatId?: string | {
    _id: string;
    listingId: string;
    buyerId: string;
    sellerId: string;
  };
  senderId?: {
    _id: string;
    fullName: string;
    avatar?: string;
    email?: string;
  };
  isRead: boolean;
  isDeleted: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    senderName?: string;
    senderAvatar?: string;
    messagePreview?: string;
    offerAmount?: number;
    appointmentDate?: Date;
    listingTitle?: string;
    auctionId?: string;
    minParticipants?: number;
    maxParticipants?: number;
    reason?: string;
    vehicleTitle?: string;
    [key: string]: string | number | Date | undefined;
  };
  readAt?: Date;
  createdAt: Date | string;
  updatedAt: Date | string;
  id?: string; // Backend also returns 'id' field
  __v?: number; // MongoDB version field
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
