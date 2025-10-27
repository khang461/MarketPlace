import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import Swal from 'sweetalert2';

// CSS cho modal hiện đại
const modernModalStyles = `
  <style>
    .swal2-popup-modern {
      border-radius: 16px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      border: 1px solid #e5e7eb !important;
    }
    
    .swal2-confirm-modern {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
      border-radius: 8px !important;
      padding: 12px 24px !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      transition: all 0.2s ease !important;
    }
    
    .swal2-confirm-modern:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15) !important;
    }
    
    .swal2-cancel-modern {
      background: #f3f4f6 !important;
      color: #374151 !important;
      border-radius: 8px !important;
      padding: 12px 24px !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      border: 1px solid #d1d5db !important;
      transition: all 0.2s ease !important;
    }
    
    .swal2-cancel-modern:hover {
      background: #e5e7eb !important;
      transform: translateY(-1px) !important;
    }
    
    .swal2-input:focus {
      border-color: #2563eb !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
      outline: none !important;
    }
    
    .swal2-title {
      font-size: 20px !important;
      font-weight: 700 !important;
      color: #1f2937 !important;
      margin-bottom: 20px !important;
    }
  </style>
`;

// Inject CSS vào DOM
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('div');
  styleElement.innerHTML = modernModalStyles;
  document.head.appendChild(styleElement.firstChild as Node);
}

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
  createdAt: string;
  isAccepted?: boolean; // Thêm field để track trạng thái đã chấp nhận
}

const NotificationDepositPage: React.FC = () => {
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

  const handleNotificationClick = () => {
    // Không làm gì khi click vào notification
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
        // Cập nhật notification thành đã chấp nhận
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id 
              ? { 
                  ...n, 
                  isAccepted: true,
                  title: "Đã chấp nhận yêu cầu đặt cọc",
                  message: "Hãy đặt lịch cho cuộc hẹn của bạn"
                }
              : n
          )
        );
        
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

  const handleCreateAppointment = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Ngăn chặn event bubble
    if (!notification.depositId) return;

    const { value: formData } = await Swal.fire({
      title: "Tạo lịch hẹn",
      width: '520px',
      html: `
        <div class="text-left" style="max-width: 100%; overflow: hidden;">
          <div style="margin-bottom: 20px;">
            <label class="block text-sm font-medium text-gray-700 mb-2">Ngày hẹn:</label>
            <input 
              id="appointmentDate" 
              type="date" 
              class="swal2-input" 
              style="width: 100%; margin-bottom: 0; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;"
              required
            />
          </div>
          
          <div style="margin-bottom: 20px;">
            <label class="block text-sm font-medium text-gray-700 mb-2">Giờ hẹn:</label>
            <input 
              id="appointmentTime" 
              type="time" 
              class="swal2-input" 
              style="width: 100%; margin-bottom: 0; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;"
              required
            />
          </div>
          
          <div style="margin-bottom: 20px;">
            <label class="block text-sm font-medium text-gray-700 mb-2">Địa điểm:</label>
            <input 
              id="location" 
              type="text" 
              class="swal2-input" 
              style="width: 100%; margin-bottom: 0; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px;"
              placeholder="Nhập địa điểm hẹn"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ghi chú:</label>
            <textarea 
              id="notes" 
              class="swal2-input" 
              style="width: 100%; margin-bottom: 0; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; resize: none; min-height: 80px;"
              placeholder="Nhập ghi chú (tùy chọn)"
              rows="3"
            ></textarea>
          </div>
        </div>
      `,
      confirmButtonText: "Tạo lịch",
      cancelButtonText: "Hủy",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: 'swal2-popup-modern',
        confirmButton: 'swal2-confirm-modern',
        cancelButton: 'swal2-cancel-modern'
      },
      preConfirm: () => {
        const appointmentDate = (document.getElementById('appointmentDate') as HTMLInputElement).value;
        const appointmentTime = (document.getElementById('appointmentTime') as HTMLInputElement).value;
        const location = (document.getElementById('location') as HTMLInputElement).value;
        const notes = (document.getElementById('notes') as HTMLTextAreaElement).value;

        if (!appointmentDate || !appointmentTime || !location) {
          Swal.showValidationMessage('Vui lòng điền đầy đủ thông tin bắt buộc');
          return false;
        }

        // Kết hợp ngày và giờ thành ISO string theo yêu cầu BE
        const scheduledDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`).toISOString();

        return {
          depositRequestId: notification.depositId,
          scheduledDate: scheduledDateTime,
          location: location,
          notes: notes || ""
        };
      }
    });

    if (!formData) return;

    try {
      const response = await api.post('/appointments', formData);
      
      if (response.data.success) {
        // Xóa notification sau khi tạo lịch thành công
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã tạo lịch hẹn thành công.",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: response.data.message || "Có lỗi xảy ra khi tạo lịch hẹn.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: axiosError.response?.data?.message || "Không thể tạo lịch hẹn. Vui lòng thử lại sau.",
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
                className="bg-white rounded-lg shadow-sm p-4 hover:bg-gray-50 transition-colors border-l-4 border-transparent relative"
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

                <div className="flex items-start gap-4" onClick={handleNotificationClick}>
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
                    {notification.metadata?.amount && !notification.isAccepted && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        {notification.metadata.amount.toLocaleString('vi-VN')} VND
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {getTimeAgo(notification.createdAt)}
                    </p>

                    {/* Action buttons for deposit notifications */}
                    {notification.type === 'deposit' && (
                      <div className="flex gap-2 mt-3">
                        {notification.isAccepted ? (
                          <button
                            onClick={(e) => handleCreateAppointment(e, notification)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Tạo lịch
                          </button>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDepositPage;

