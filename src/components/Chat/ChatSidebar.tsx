import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Search, Circle, Trash2 } from "lucide-react";
import api from "../../config/api";
import { Chat, Message } from "../../types/chat";
import Swal from "sweetalert2";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";

const ChatSidebar: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { socket, onNewMessage } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchChats();
  }, []);

  // WebSocket listener for new messages - update sidebar
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      console.log("📬 Sidebar received new message:", message);

      // Update the chat list with new last message
      setChats((prevChats) => {
        return prevChats
          .map((chat) => {
            if (chat._id === message.chatId) {
              return {
                ...chat,
                lastMessage: {
                  content: message.content,
                  senderId: message.senderId,
                  timestamp: message.createdAt || new Date().toISOString(),
                },
                lastMessageAt: message.createdAt || new Date().toISOString(),
                // Increment unread count if not the current chat and not sent by me
                unreadCount:
                  message.chatId !== chatId && message.senderId._id !== user?.id
                    ? (chat.unreadCount || 0) + 1
                    : chat.unreadCount,
              };
            }
            return chat;
          })
          .sort((a, b) => {
            // Sort by last message time (most recent first)
            const timeA = new Date(
              a.lastMessageAt || a.updatedAt || 0
            ).getTime();
            const timeB = new Date(
              b.lastMessageAt || b.updatedAt || 0
            ).getTime();
            return timeB - timeA;
          });
      });
    };

    onNewMessage(handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, chatId, user?.id, onNewMessage]);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/chat");

      if (Array.isArray(response.data)) {
        setChats(response.data);
      } else if (response.data && Array.isArray(response.data.chats)) {
        setChats(response.data.chats);
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        setChats(response.data.data);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const otherUser = chat.otherUser;
    const listing = chat.listing || chat.listingId;
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
    if (diffInMinutes < 60) return `${diffInMinutes}p`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const handleChatClick = (chat: Chat) => {
    navigate(`/chat/${chat._id}`, {
      state: { chat },
    });
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent navigation

    try {
      const result = await Swal.fire({
        title: "Xóa cuộc trò chuyện?",
        text: "Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        await api.delete(`/chat/${chatId}`);

        // Remove from local state
        setChats((prev) => prev.filter((c) => c._id !== chatId));

        // Navigate to first chat or notifications if deleted current chat
        if (chatId === chatId) {
          const remainingChats = chats.filter((c) => c._id !== chatId);
          if (remainingChats.length > 0) {
            navigate(`/chat/${remainingChats[0]._id}`, {
              state: { chat: remainingChats[0] },
            });
          } else {
            navigate("/notifications");
          }
        }

        Swal.fire({
          icon: "success",
          title: "Đã xóa",
          text: "Cuộc trò chuyện đã được xóa",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể xóa cuộc trò chuyện",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          Tin nhắn
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {searchQuery ? "Không tìm thấy" : "Chưa có tin nhắn"}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherUser = chat.otherUser;
            const listing = chat.listing || chat.listingId;
            const isActive = chat._id === chatId;

            if (!otherUser || !listing) {
              return null;
            }

            return (
              <div
                key={chat._id}
                className={`p-3 border-b border-gray-100 cursor-pointer transition-colors group relative ${
                  isActive
                    ? "bg-blue-50 border-l-4 border-l-blue-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <div
                  className="flex items-start gap-3"
                  onClick={() => handleChatClick(chat)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {otherUser?.avatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-600">
                          {otherUser?.fullName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    {otherUser?.isOnline && (
                      <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {otherUser?.fullName || "Người dùng"}
                      </h3>
                      {chat.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(chat.lastMessage.timestamp.toString())}
                        </span>
                      )}
                    </div>

                    {/* Listing */}
                    <p className="text-xs text-gray-500 truncate mb-1">
                      {listing?.make} {listing?.model} {listing?.year}
                    </p>

                    {/* Last Message */}
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs truncate flex-1 ${
                          (chat.unreadCount || 0) > 0
                            ? "text-gray-900 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {chat.lastMessage?.content ? (
                          truncateMessage(chat.lastMessage.content)
                        ) : (
                          <span className="italic text-gray-400">
                            Chưa có tin nhắn
                          </span>
                        )}
                      </p>
                      {(chat.unreadCount || 0) > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button - Show on hover */}
                <button
                  onClick={(e) => handleDeleteChat(e, chat._id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-full"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
