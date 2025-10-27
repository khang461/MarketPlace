import api from "./api";
import {
  Notification,
  NotificationResponse,
  UnreadCountResponse,
} from "../types/notification";

export const notificationAPI = {
  // Lấy danh sách notifications
  getNotifications: async (params?: {
    limit?: number;
    skip?: number;
    type?: string;
    isRead?: boolean;
  }): Promise<NotificationResponse> => {
    try {
      const response = await api.get("/notification-messages", { params });
      
      // Backend returns: { success, data: [], pagination: {}, unreadCount }
      if (response.data?.success && response.data?.data) {
        return {
          notifications: response.data.data || [],
          total: response.data.pagination?.total || 0,
          unreadCount: response.data.unreadCount || 0,
        };
      }
      
      // Fallback for old format
      const data = response.data?.data || response.data;
      return {
        notifications: data?.notifications || data || [],
        total: data?.total || 0,
        unreadCount: data?.unreadCount || 0,
      };
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
      };
    }
  },

  // Lấy số lượng notification chưa đọc
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    try {
      const response = await api.get("/notification-messages/unread-count");
      const data = response.data?.data || response.data;
      
      return {
        unreadCount: data?.unreadCount || 0,
      };
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return {
        unreadCount: 0,
      };
    }
  },

  // Đánh dấu notification đã đọc
  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await api.post(`/notification-messages/${notificationId}/read`);
    return response.data;
  },

  // Đánh dấu tất cả đã đọc
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/notification-messages/mark-all-read");
    return response.data;
  },

  // Xóa notification
  deleteNotification: async (
    notificationId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/notification-messages/${notificationId}`);
    return response.data;
  },

  // Xóa tất cả notification đã đọc
  deleteAllRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete("/notification-messages/delete-all-read");
    return response.data;
  },
};

export default notificationAPI;
