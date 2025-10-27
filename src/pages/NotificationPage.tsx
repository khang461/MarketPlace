import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import Swal from 'sweetalert2';

interface Notification {
  _id: string;
  userId: string;
  type: 'deposit' | 'deposit_confirmation' | 'contract' | 'transaction_complete';
  title: string;
  message: string;
  depositId?: string;
  contractId?: string;
  transactionId?: string;
  metadata?: {
    listingId?: string;
    amount?: number;
    status?: string;
    buyerId?: string;
    buyerName?: string;
    sellerId?: string;
    sellerName?: string;
    appointmentId?: string;
    staffId?: string;
    staffName?: string;
  };
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

const NotificationPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    fetchNotifications();
  }, [isAuthenticated, navigate]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        // Response structure: { success: true, data: { notifications: [...], pagination: {...} } }
        const notificationsList = response.data.data?.notifications || response.data.data || [];
        setNotifications(notificationsList);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'deposit_confirmation':
        return '💰';
      case 'contract':
        return '📄';
      case 'transaction_complete':
        return '✅';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Chỉ đánh dấu đã đọc khi click, không navigate
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  const handleAcceptDeposit = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Ngăn chặn event bubble
    if (!notification.depositId) return;

    try {
      // Gọi API để chấp nhận đặt cọc với action CONFIRM
      const response = await api.post(`/deposits/${notification.depositId}/confirm`, {
        action: 'CONFIRM'
      });
      
      if (response.data.success) {
        // Xóa notification khỏi database
        try {
          await api.delete(`/notifications/${notification._id}`);
          // Xóa thông báo khỏi danh sách
          setNotifications(prev => prev.filter(n => n._id !== notification._id));
        } catch (deleteError) {
          console.error('Error deleting notification:', deleteError);
        }
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã chấp nhận yêu cầu đặt cọc.",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: response.data.message || "Có lỗi xảy ra khi chấp nhận đặt cọc.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error('Error accepting deposit:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: axiosError.response?.data?.message || "Không thể chấp nhận yêu cầu đặt cọc. Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const handleRejectDeposit = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Ngăn chặn event bubble
    if (!notification.depositId) return;

    try {
      // Gọi API để từ chối đặt cọc với action REJECT
      const response = await api.post(`/deposits/${notification.depositId}/confirm`, {
        action: 'REJECT'
      });
      
      if (response.data.success) {
        // Xóa notification khỏi database
        try {
          await api.delete(`/notifications/${notification._id}`);
          // Xóa thông báo khỏi danh sách
          setNotifications(prev => prev.filter(n => n._id !== notification._id));
        } catch (deleteError) {
          console.error('Error deleting notification:', deleteError);
        }
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã từ chối yêu cầu đặt cọc.",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: response.data.message || "Có lỗi xảy ra khi từ chối đặt cọc.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: axiosError.response?.data?.message || "Không thể từ chối yêu cầu đặt cọc. Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Ngăn chặn event bubble

    const result = await Swal.fire({
      title: 'Xóa thông báo?',
      text: 'Bạn có chắc chắn muốn xóa thông báo này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/notifications/${notificationId}`);
        // Xóa thông báo khỏi danh sách
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          text: "Thông báo đã được xóa.",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting notification:', error);
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: "Không thể xóa thông báo. Vui lòng thử lại sau.",
          confirmButtonColor: "#2563eb",
        });
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-blue-600 border-b-4 border-blue-600 pb-2">
              Yêu cầu đặt cọc
            </h1>
            <div className="bg-blue-600 rounded-full p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-xl text-gray-500 font-medium">Chưa có yêu cầu đặt cọc</p>
            <p className="text-gray-400 mt-2">Các yêu cầu đặt cọc sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow-sm p-4 hover:bg-gray-50 transition-colors border-l-4 relative ${
                  notification.isRead ? 'border-transparent' : 'border-blue-600'
                }`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteNotification(e, notification._id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="Xóa thông báo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-start gap-4" onClick={() => handleNotificationClick(notification)}>
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl cursor-pointer">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <p className="text-gray-900 font-semibold mb-1">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.metadata?.amount && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        {notification.metadata.amount.toLocaleString('vi-VN')} VND
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {getTimeAgo(notification.createdAt)}
                    </p>

                    {/* Action buttons for deposit notifications */}
                    {notification.type === 'deposit' && !notification.isRead && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => handleAcceptDeposit(e, notification)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={(e) => handleRejectDeposit(e, notification)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0 self-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;

