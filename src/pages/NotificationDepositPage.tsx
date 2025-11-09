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
    
    .swal2-deny-modern {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
      border-radius: 8px !important;
      padding: 12px 24px !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      transition: all 0.2s ease !important;
    }
    
    .swal2-deny-modern:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15) !important;
    }
    
    .swal2-close-modern {
      color: #6b7280 !important;
      font-size: 24px !important;
      font-weight: 300 !important;
      width: 32px !important;
      height: 32px !important;
      line-height: 32px !important;
      border-radius: 50% !important;
      transition: all 0.2s ease !important;
    }
    
    .swal2-close-modern:hover {
      color: #374151 !important;
      background-color: #f3f4f6 !important;
      transform: rotate(90deg) !important;
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
  type: 'deposit' | 'deposit_confirmation' | 'contract' | 'transaction_complete'| 'appointment_created' | 'appointment_rejected';
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
    depositRequestId?: string;
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
      console.log('[fetchNotifications] Fetching notifications...');
      const response = await api.get('/notifications');
      if (response.data.success) {
        // Response structure: { success: true, data: { notifications: [...], pagination: {...} } }
        const notificationsList = response.data.data?.notifications || response.data.data || [];
        console.log('[fetchNotifications] Received notifications:', notificationsList);
        console.log('[fetchNotifications] Notifications with isAccepted:', notificationsList.map((n: Notification) => ({ id: n._id, type: n.type, isAccepted: n.isAccepted })));
        
        // Giữ lại trạng thái isAccepted từ state hiện tại nếu có
        setNotifications(prev => {
          const updated = notificationsList.map((newNotif: Notification) => {
            const existingNotif = prev.find(p => p._id === newNotif._id);
            // Nếu notification đã có isAccepted = true trong state cũ, giữ lại
            if (existingNotif?.isAccepted === true) {
              console.log('[fetchNotifications] Preserving isAccepted=true for notification:', newNotif._id);
              return { ...newNotif, isAccepted: true };
            }
            return newNotif;
          });
          console.log('[fetchNotifications] Final notifications after merge:', updated);
          return updated;
        });
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
      case 'appointment_created':
        return '📅';
      case 'appointment_rejected':
        return '❌';
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

    console.log('[handleAcceptDeposit] Starting accept deposit for notification:', notification._id);
    console.log('[handleAcceptDeposit] Current notification state:', notification);

    try {
      // Gọi API để chấp nhận đặt cọc với action CONFIRM
      const response = await api.post(`/deposits/${notification.depositId}/confirm`, {
        action: 'CONFIRM'
      });
      
      console.log('[handleAcceptDeposit] API response:', response.data);
      
      if (response.data.success) {
        // Cập nhật notification thành đã chấp nhận
        setNotifications(prev => {
          const updated = prev.map(n => 
            n._id === notification._id 
              ? { 
                  ...n, 
                  isAccepted: true,
                  title: "Đã chấp nhận yêu cầu đặt cọc",
                  message: "Hãy đặt lịch cho cuộc hẹn của bạn"
                }
              : n
          );
          console.log('[handleAcceptDeposit] Updated notifications state:', updated);
          console.log('[handleAcceptDeposit] Updated notification isAccepted:', updated.find(n => n._id === notification._id)?.isAccepted);
          return updated;
        });
        
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
      console.error('[handleAcceptDeposit] Error accepting deposit:', error);
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
        } catch (deleteError) {
          console.error('Error deleting notification:', deleteError);
        }
        
        // ✅ Xóa notification khỏi state ngay lập tức để cải thiện UX
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
        
        // ✅ Reload danh sách notification từ server để đồng bộ
        await fetchNotifications();
        
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

  const handleAcceptAppointment = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Ngăn chặn event bubble
    
    if (!notification.metadata?.appointmentId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Không tìm thấy thông tin lịch hẹn.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    try {
      // Gọi API để xác nhận lịch hẹn
      const response = await api.post(`/appointments/${notification.metadata.appointmentId}/confirm`);
      
      if (response.data.success) {
        // ✅ Xóa notification sau khi chấp nhận lịch hẹn thành công
        if (notification?._id) {
          try {
            await api.delete(`/notifications/${notification._id}`);
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          } catch (deleteError) {
            console.error('Error deleting notification:', deleteError);
            // Vẫn xóa khỏi state để không ảnh hưởng UX
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          }
        }
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã chấp nhận lịch hẹn.",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: response.data.message || "Có lỗi xảy ra khi chấp nhận lịch hẹn.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: axiosError.response?.data?.message || "Không thể chấp nhận lịch hẹn. Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const handleRejectAppointment = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Ngăn chặn event bubble
    
    if (!notification.metadata?.appointmentId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Không tìm thấy thông tin lịch hẹn.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    // Hiển thị popup chọn giữa 2 options
    const { value: action } = await Swal.fire({
      title: "Bạn muốn yêu cầu đặt lịch lại hay hủy giao dịch?",
      icon: "question",
      showCancelButton: false,
      showDenyButton: true,
      showCloseButton: true,
      confirmButtonText: "Yêu cầu đặt lịch lại",
      denyButtonText: "Hủy giao dịch và hoàn tiền",
      confirmButtonColor: "#2563eb",
      denyButtonColor: "#dc3545",
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'swal2-popup-modern',
        confirmButton: 'swal2-confirm-modern',
        denyButton: 'swal2-deny-modern',
        closeButton: 'swal2-close-modern'
      }
    });

    // Nếu user hủy dialog
    if (action === undefined || action === null) {
      return;
    }

    // Nếu chọn "Yêu cầu đặt lịch lại"
    if (action === true) {
      await handleRejectAppointmentRequest(notification);
    }
    // Nếu chọn "Hủy giao dịch và hoàn tiền"
    else if (action === false) {
      await handleCancelAppointment(notification);
    }
  };

  const handleRejectAppointmentRequest = async (notification: Notification) => {
    // Hiển thị dialog để người dùng nhập lý do và chọn ngày rảnh
    const { value: formData } = await Swal.fire({
      title: "Yêu cầu đặt lịch lại",
      width: '520px',
      html: `
        <div class="text-left" style="max-width: 100%; overflow: hidden;">
          <div style="margin-bottom: 24px;">
            <label class="block text-sm font-medium text-gray-700 mb-3">Lý do và ngày rảnh của bạn:</label>
            <textarea 
              id="rejectionReason" 
              style="width: 100%; margin: 0; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: inherit; box-sizing: border-box; resize: none; min-height: 120px; line-height: 1.5;"
              placeholder="Nêu lý do và bạn có thể chọn những ngày mà bạn rảnh để cho người bán biết"
              rows="5"
            ></textarea>
          </div>
          
          <div class="text-sm text-gray-500">
            <p>💡 <strong>Gợi ý:</strong> Hãy đề xuất các ngày bạn rảnh, ví dụ:</p>
            <ul class="list-disc list-inside mt-1 text-xs">
              <li>Thứ 2 - Thứ 6: Buổi sáng 9h - 11h</li>
              <li>Cuối tuần: Tất cả giờ trong ngày</li>
            </ul>
          </div>
        </div>
      `,
      confirmButtonText: "Gửi",
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
        const reason = (document.getElementById('rejectionReason') as HTMLTextAreaElement).value;
        return {
          reason: reason || "Không nêu rõ lý do"
        };
      }
    });
  
    // Nếu user hủy dialog
    if (!formData) {
      return;
    }

    try {
      // Gọi API để từ chối lịch hẹn (yêu cầu đặt lịch lại)
      if (!notification.metadata?.appointmentId) {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: "Không tìm thấy thông tin lịch hẹn.",
          confirmButtonColor: "#2563eb",
        });
        return;
      }
      
      const response = await api.post(`/appointments/${notification.metadata.appointmentId}/reject`, formData);
      
      if (response.data.success) {
        // ✅ Xóa notification sau khi từ chối lịch hẹn thành công
        if (notification?._id) {
          try {
            await api.delete(`/notifications/${notification._id}`);
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          } catch (deleteError) {
            console.error('Error deleting notification:', deleteError);
            // Vẫn xóa khỏi state để không ảnh hưởng UX
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          }
        }
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã gửi yêu cầu đặt lịch lại. Người bán sẽ nhận được thông báo và có thể tạo lịch hẹn mới phù hợp hơn.",
          confirmButtonColor: "#2563eb",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: response.data.message || "Có lỗi xảy ra khi gửi yêu cầu đặt lịch lại.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: axiosError.response?.data?.message || "Không thể gửi yêu cầu đặt lịch lại. Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const handleCancelAppointment = async (notification: Notification) => {
    // Hiển thị dialog để người dùng nhập lý do hủy
    const { value: formData } = await Swal.fire({
      title: "Hủy giao dịch và hoàn tiền",
      width: '520px',
      html: `
        <div class="text-left" style="max-width: 100%; overflow: hidden;">
          <div style="margin-bottom: 24px;">
            <label class="block text-sm font-medium text-gray-700 mb-3">Lý do hủy giao dịch:</label>
            <textarea 
              id="cancelReason" 
              style="width: 100%; margin: 0; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: inherit; box-sizing: border-box; resize: none; min-height: 120px; line-height: 1.5;"
              placeholder="Nêu lý do bạn muốn hủy giao dịch (tùy chọn)"
              rows="5"
            ></textarea>
          </div>
          
          <div class="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            <p>⚠️ <strong>Lưu ý:</strong> Nếu bạn đã đặt cọc, tiền sẽ được hoàn về ví của bạn sau khi hủy giao dịch.</p>
          </div>
        </div>
      `,
      confirmButtonText: "Xác nhận hủy",
      cancelButtonText: "Hủy",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: 'swal2-popup-modern',
        confirmButton: 'swal2-confirm-modern',
        cancelButton: 'swal2-cancel-modern'
      },
      preConfirm: () => {
        const reason = (document.getElementById('cancelReason') as HTMLTextAreaElement).value;
        return {
          reason: reason || ""
        };
      }
    });

    // Nếu user hủy dialog
    if (!formData) {
      return;
    }

    try {
      // Gọi API để hủy giao dịch và hoàn tiền
      const response = await api.put(`/appointments/${notification.metadata?.appointmentId}/cancel`, formData);
      
      if (response.data.success) {
        // ✅ Xóa notification sau khi hủy giao dịch thành công
        if (notification?._id) {
          try {
            await api.delete(`/notifications/${notification._id}`);
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          } catch (deleteError) {
            console.error('Error deleting notification:', deleteError);
            // Vẫn xóa khỏi state để không ảnh hưởng UX
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          }
        }
        
        const message = response.data.refunded 
          ? response.data.message || "Đã hủy giao dịch thành công, tiền đã hoàn về ví của bạn"
          : response.data.message || "Hủy lịch hẹn thành công";
        
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: message,
          confirmButtonColor: "#2563eb",
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text: response.data.message || "Có lỗi xảy ra khi hủy giao dịch.",
          confirmButtonColor: "#2563eb",
        });
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: "error",
        title: "Lỗi hệ thống!",
        text: axiosError.response?.data?.message || "Không thể hủy giao dịch. Vui lòng thử lại sau.",
        confirmButtonColor: "#2563eb",
      });
    }
  };
  const handleCreateAppointment = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
  
    const depositRequestId = notification.depositId || notification.metadata?.depositRequestId;
  
    if (!depositRequestId) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: "Không tìm thấy thông tin yêu cầu đặt cọc.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
  
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
  
    const { value: formData } = await Swal.fire({
      title: "Tạo lịch hẹn",
      width: '520px',
      html: `
        <div class="text-left" style="max-width: 100%; overflow: hidden;">
          <div style="margin-bottom: 24px;">
            <label class="block text-sm font-medium text-gray-700 mb-3">Ngày hẹn:</label>
            <input 
              id="appointmentDate" 
              type="date" 
              min="${todayStr}"
              style="width: 100%; margin: 0; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: inherit; box-sizing: border-box; height: 48px;"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Chỉ có thể chọn từ ngày hôm nay trở đi</p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <label class="block text-sm font-medium text-gray-700 mb-3">Giờ hẹn:</label>
            <input 
              id="appointmentTime" 
              type="time" 
              min="08:00"
              max="17:00"
              style="width: 100%; margin: 0; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: inherit; box-sizing: border-box; height: 48px;"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Giờ hành chính: 08:00 - 17:00</p>
          </div>
          
          <div style="margin-bottom: 24px;">
            <label class="block text-sm font-medium text-gray-700 mb-3">Địa điểm:</label>
            <input 
              id="location" 
              type="text" 
              style="width: 100%; margin: 0; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: inherit; box-sizing: border-box; height: 48px;"
              placeholder="Nhập địa điểm hẹn"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Ghi chú:</label>
            <textarea 
              id="notes" 
              style="width: 100%; margin: 0; padding: 14px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: inherit; box-sizing: border-box; resize: none; min-height: 100px; line-height: 1.5;"
              placeholder="Nhập ghi chú (tùy chọn)"
              rows="4"
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
  
        // Kiểm tra ngày hẹn phải từ hôm nay trở đi
        const selectedDate = new Date(appointmentDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          Swal.showValidationMessage('Ngày hẹn phải từ ngày hôm nay trở đi');
          return false;
        }
  
        // Kiểm tra giờ hành chính (8:00 - 17:00)
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        const minMinutes = 8 * 60; // 08:00
        const maxMinutes = 17 * 60; // 17:00
  
        if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
          Swal.showValidationMessage('Giờ hẹn phải trong giờ hành chính (08:00 - 17:00)');
          return false;
        }
  
        // Nếu chọn ngày hôm nay, kiểm tra giờ hẹn phải >= giờ hiện tại
        if (selectedDate.getTime() === today.getTime()) {
          const now = new Date();
          const selectedDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
          
          if (selectedDateTime <= now) {
            Swal.showValidationMessage('Nếu chọn ngày hôm nay, giờ hẹn phải sau giờ hiện tại');
            return false;
          }
        }
  
        // ✅ FIX: Tạo Date object và format với timezone offset
        const localDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
        
        // Lấy timezone offset (ví dụ: +07:00 cho GMT+7)
        const timezoneOffset = -localDateTime.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
        const offsetMinutes = Math.abs(timezoneOffset) % 60;
        const offsetSign = timezoneOffset >= 0 ? '+' : '-';
        const timezoneString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  
        // Format: YYYY-MM-DDTHH:mm:ss+07:00
        const scheduledDateTime = `${appointmentDate}T${appointmentTime}:00${timezoneString}`;
  
        return {
          depositRequestId: depositRequestId,
          scheduledDate: scheduledDateTime, // "2025-10-30T14:30:00+07:00"
          location: location,
          notes: notes || ""
        };
      }
    });
  
    if (!formData) {
      return;
    }
  
    try {
      const response = await api.post('/appointments', formData);
      
      if (response.data.success) {
        // ✅ Xóa notification sau khi tạo lịch thành công
        if (notification?._id) {
          try {
            await api.delete(`/notifications/${notification._id}`);
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          } catch (deleteError) {
            console.error('Error deleting notification:', deleteError);
            // Vẫn xóa khỏi state để không ảnh hưởng UX
            setNotifications(prev => prev.filter(n => n._id !== notification._id));
          }
        }
        
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
                       Tiền đặt cọc: {notification.metadata.amount.toLocaleString('vi-VN')} VND
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {getTimeAgo(notification.createdAt)}
                    </p>

                    {/* Action buttons for deposit notifications */}
                    {notification.type === 'deposit' && (() => {
                      console.log('[Render] Rendering deposit notification buttons for:', notification._id);
                      console.log('[Render] notification.isAccepted:', notification.isAccepted);
                      console.log('[Render] Full notification object:', notification);
                      return (
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
                      );
                    })()}

                    {/* Action buttons for contract notifications */}
                    {notification.type === 'appointment_created' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => handleAcceptAppointment(e, notification)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Chấp nhận
                        </button>
                        <button
                          onClick={(e) => handleRejectAppointment(e, notification)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}

                    {/* Action button for appointment_rejected notifications */}
                    {notification.type === 'appointment_rejected' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => handleCreateAppointment(e, notification)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Đặt lịch
                        </button>
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

