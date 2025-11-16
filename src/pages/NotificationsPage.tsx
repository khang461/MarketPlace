import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  MessageSquare,
} from "lucide-react";
import notificationAPI from "../config/notificationAPI";
import type { Notification } from "../types/notification";
import { formatTimeAgo, formatDateTime } from "../utils/timeHelper";
import Swal from "sweetalert2";
import ChatTab from "../components/Account/ChatTab";

type TabType = "notifications" | "messages";

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("notifications");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const navigate = useNavigate();
  const limit = 20;

  // Load notifications
  const loadNotifications = async (pageNum: number, resetList = false) => {
    try {
      setIsLoading(true);
      const skip = (pageNum - 1) * limit;

      const params: {
        skip: number;
        limit: number;
        type?: string;
        isRead?: boolean;
      } = {
        skip,
        limit,
      };

      if (filter === "unread") {
        params.isRead = false;
      } else if (filter === "read") {
        params.isRead = true;
      }

      const response = await notificationAPI.getNotifications(params);

      if (response && response.notifications) {
        const newNotifications = response.notifications || [];

        if (resetList) {
          setNotifications(newNotifications);
        } else {
          setNotifications((prev) => [...prev, ...newNotifications]);
        }

        setHasMore(
          newNotifications.length === limit && response.total > skip + limit
        );
      } else {
        // No data returned
        setNotifications([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
      setHasMore(false);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải thông báo",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load on mount and filter change
  useEffect(() => {
    setPage(1);
    loadNotifications(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      if (response) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đã đánh dấu tất cả là đã đọc",
          confirmButtonColor: "#2563eb",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Delete notification
  const handleDelete = async (id: string) => {
    try {
      const result = await Swal.fire({
        icon: "warning",
        title: "Xóa thông báo?",
        text: "Bạn có chắc muốn xóa thông báo này?",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        const response = await notificationAPI.deleteNotification(id);
        if (response.success) {
          setNotifications((prev) => prev.filter((n) => n._id !== id));

          Swal.fire({
            icon: "success",
            title: "Đã xóa",
            text: "Thông báo đã được xóa",
            confirmButtonColor: "#2563eb",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Delete all read notifications
  const handleDeleteAllRead = async () => {
    try {
      const result = await Swal.fire({
        icon: "warning",
        title: "Xóa tất cả thông báo đã đọc?",
        text: "Hành động này không thể hoàn tác",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Xóa tất cả",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        const response = await notificationAPI.deleteAllRead();
        if (response.success) {
          setNotifications((prev) => prev.filter((n) => !n.isRead));

          Swal.fire({
            icon: "success",
            title: "Đã xóa",
            text: "Đã xóa tất cả thông báo đã đọc",
            confirmButtonColor: "#2563eb",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      }
    } catch (error) {
      console.error("Error deleting all read notifications:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate to action URL if exists
    if (notification.actionUrl) {
      // Fix backend URL: /messages/... -> /chat/...
      const url = notification.actionUrl.replace("/messages/", "/chat/");

      // Extract chatId from URL for state
      const chatIdMatch = url.match(/\/chat\/([^/]+)/);
      const chatId = chatIdMatch ? chatIdMatch[1] : null;

      // Navigate with minimal state to help ChatDetailPage
      navigate(url, {
        state: {
          fromNotification: true,
          chatId:
            chatId ||
            (typeof notification.chatId === "object"
              ? notification.chatId._id
              : notification.chatId),
        },
      });
    }
  };

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, false);
  };

  // Get icon by type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return "💬";
      case "offer":
        return "💰";
      case "appointment":
        return "📅";
      case "listing":
        return "📝";
      case "system":
        return "⚙️";
      case "auction_approved":
        return "✅";
      case "auction_rejected":
        return "❌";
      case "new_auction":
        return "🆕";
      case "auction_cancelled":
        return "🚫";
      default:
        return "🔔";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "notifications"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Bell className="w-5 h-5" />
                Thông báo
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "messages"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                Tin nhắn
              </button>
            </nav>
          </div>

          {/* Tab Content: Notifications */}
          {activeTab === "notifications" && (
            <>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Danh sách thông báo
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Đọc tất cả
                    </button>
                    <button
                      onClick={handleDeleteAllRead}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa đã đọc
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter("all")}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        filter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilter("unread")}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        filter === "unread"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Chưa đọc
                    </button>
                    <button
                      onClick={() => setFilter("read")}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        filter === "read"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Đã đọc
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tab Content: Messages */}
        {activeTab === "messages" ? (
          <ChatTab />
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {isLoading && notifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Không có thông báo nào</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer ${
                      !notification.isRead ? "border-l-4 border-blue-600" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <h3
                              className={`font-medium ${
                                !notification.isRead
                                  ? "text-gray-900"
                                  : "text-gray-600"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {notification.isRead && (
                              <span title="Đã đọc">
                                <CheckCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
                                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                title="Đánh dấu đã đọc"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification._id);
                              }}
                              className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center py-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? "Đang tải..." : "Tải thêm"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
