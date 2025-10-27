import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Search, Circle } from "lucide-react";
import api from "../../config/api";
import { Chat } from "../../types/chat";
import { getImageUrl } from "../../utils/imageHelper";
import { useAuth } from "../../contexts/AuthContext";

const ChatTab: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchChats();
    fetchUnreadCount();
  }, []);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/chat");

      // API có thể trả về pagination object: { chats: Array, totalPages, currentPage, total }
      if (Array.isArray(response.data)) {
        setChats(response.data);
      } else if (response.data && Array.isArray(response.data.chats)) {
        // Response có pagination
        setChats(response.data.chats);
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        // Response wrapped trong data field
        setChats(response.data.data);
      } else {
        console.warn("API response format unknown:", response.data);
        setChats([]);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      // Set empty array để vẫn hiển thị UI ngay cả khi có lỗi
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/chat/unread/count");
      // Xử lý cả trường hợp 204 No Content
      if (response.data && typeof response.data === "object") {
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      // Set count = 0 nếu có lỗi
      setUnreadCount(0);
    }
  };

  const filteredChats = chats.filter((chat) => {
    // Xác định người chat trước khi filter
    const otherUser =
      chat.buyerId?._id === user?.id ? chat.sellerId : chat.buyerId;
    const listing = chat.listingId;
    const searchLower = searchQuery.toLowerCase();

    return (
      otherUser?.fullName?.toLowerCase().includes(searchLower) ||
      `${listing?.make} ${listing?.model}`.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const handleChatClick = (chat: Chat) => {
    navigate(`/chat/${chat._id}`, {
      state: { chat },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải tin nhắn...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Tin nhắn</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="divide-y divide-gray-200">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery
                ? "Không tìm thấy cuộc trò chuyện"
                : "Chưa có tin nhắn"}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? "Thử tìm kiếm với từ khóa khác"
                : "Bắt đầu trò chuyện với người bán khi bạn quan tâm đến một sản phẩm"}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            // Xác định người chat (không phải mình)
            const otherUser =
              chat.buyerId._id === user?.id ? chat.sellerId : chat.buyerId;
            const listing = chat.listingId;
            const listingImage = listing?.photos?.[0];

            return (
              <div
                key={chat._id}
                onClick={() => handleChatClick(chat)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {otherUser?.avatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-gray-600">
                          {otherUser?.fullName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    {otherUser?.isOnline && (
                      <Circle className="absolute bottom-0 right-0 w-4 h-4 text-green-500 fill-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {otherUser?.fullName || "Người dùng"}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(chat.lastMessage.timestamp.toString())}
                        </span>
                      )}
                    </div>

                    {/* Listing Info */}
                    <div className="flex items-center space-x-2 mb-2">
                      {listingImage && (
                        <img
                          src={getImageUrl(listingImage)}
                          alt="Listing"
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="text-sm text-gray-600 truncate">
                        {listing?.make} {listing?.model} {listing?.year}
                      </span>
                    </div>

                    {/* Last Message */}
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {truncateMessage(chat.lastMessage.content)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatTab;
