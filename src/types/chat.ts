export interface ChatUser {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface ChatListing {
  _id: string;
  make: string;
  model: string;
  year: number;
  priceListed?: number;
  photos?: Array<{ url: string; kind: string }>;
}

export interface LastMessage {
  content?: string;
  senderId?: {
    _id: string;
    fullName: string;
  } | string;
  timestamp?: Date | string;
}

export interface Chat {
  _id: string;
  listingId: ChatListing;
  buyerId: ChatUser;
  sellerId: ChatUser;
  lastMessage?: LastMessage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  otherUser?: ChatUser;
  listing?: ChatListing; // API mới trả về listing trực tiếp
  chatType?: string;
  unreadCount?: number;
  lastMessageAt?: string;
}

export interface MessageSender {
  _id: string;
  fullName: string;
  avatar?: string;
}

export interface MessageFile {
  filename: string;
  originalname: string;
  url: string;
  size: number;
  mimetype: string;
  formattedSize: string;
}

export interface MessageMetadata {
  files?: MessageFile[];
  reactions?: Array<{
    userId: string;
    emoji: string;
    createdAt: Date;
  }>;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  editedAt?: Date;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: MessageSender;
  content: string;
  messageType: 'text' | 'image' | 'file';
  metadata?: MessageMetadata;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  timestamp?: string;
}
