import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  Download,
  Circle,
  MessageCircle,
} from "lucide-react";
import api from "../config/api";
import { Chat, Message } from "../types/chat";
import { getImageUrl } from "../utils/imageHelper";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";

const ChatDetailPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chat, setChat] = useState<Chat | null>(location.state?.chat || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadChatData = async () => {
      if (chatId) {
        await fetchChatDetails();
        await fetchMessages();
        await markMessagesAsRead();
        await fetchOnlineUsers();
      }
    };
    loadChatData();

    // Poll online users mỗi 30 giây
    const interval = setInterval(() => {
      if (chatId) {
        fetchOnlineUsers();
      }
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatDetails = async () => {
    try {
      // Không cần fetch riêng, sẽ lấy từ messages response
      // hoặc có thể bỏ qua vì thông tin chat đã có từ navigation state
      console.log("Chat ID:", chatId);
    } catch (error) {
      console.error("Error fetching chat details:", error);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const response = await api.get(`/chat/${chatId}/online-users`);
      if (response.data && response.data.onlineUsers) {
        // Lưu danh sách ID của user online
        const onlineUserIds = response.data.onlineUsers.map(
          (u: { _id?: string; id?: string }) => u._id || u.id
        );
        setOnlineUsers(onlineUserIds);
      }
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/chat/${chatId}/messages`);

      // Kiểm tra nếu response có chat info
      if (response.data && Array.isArray(response.data)) {
        setMessages(response.data);
      } else if (response.data.messages) {
        // Nếu API trả về object có messages và chat info
        setMessages(response.data.messages);
        if (response.data.chat) {
          setChat(response.data.chat);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải tin nhắn",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await api.put(`/chat/${chatId}/read`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || newMessage;
    if (!content.trim() && selectedFiles.length === 0) return;

    try {
      setIsSending(true);

      if (selectedFiles.length > 0) {
        // Send message with files
        const formData = new FormData();
        formData.append("content", content);
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const response = await api.post(
          `/chat/${chatId}/messages/files`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setMessages([...messages, response.data]);
      } else {
        // Send text message
        const response = await api.post(`/chat/${chatId}/messages`, {
          content: content,
        });
        setMessages([...messages, response.data]);
      }

      setNewMessage("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error sending message:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể gửi tin nhắn",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (message: string) => {
    handleSendMessage(message);
  };

  const handleQuickReplyWithImage = async (
    message: string,
    imageUrl?: string
  ) => {
    if (!imageUrl) {
      handleSendMessage(message);
      return;
    }

    try {
      setIsSending(true);

      // Tải ảnh từ URL và convert sang File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Tạo File object từ blob
      const file = new File([blob], "vehicle-image.jpg", {
        type: blob.type || "image/jpeg",
      });

      // Tạo FormData để gửi qua API /messages/files
      const formData = new FormData();
      formData.append("content", message);
      formData.append("files", file);

      const apiResponse = await api.post(
        `/chat/${chatId}/messages/files`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Message sent response:", apiResponse.data);
      setMessages([...messages, apiResponse.data]);
      setSelectedFiles([]);
      setImagePreviewUrls([]);
    } catch (error) {
      console.error("Error sending message with image:", error);
      // Fallback: gửi tin nhắn text nếu gửi ảnh lỗi
      Swal.fire({
        icon: "warning",
        title: "Không thể gửi ảnh",
        text: "Đã gửi tin nhắn dạng text thay thế",
        timer: 2000,
        showConfirmButton: false,
      });
      handleSendMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Add files to selected list
    setSelectedFiles([...selectedFiles, ...files]);

    // Create preview URLs for images
    const newPreviewUrls: string[] = [];
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        newPreviewUrls.push(previewUrl);
      }
    });
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);

    // Revoke URL to free memory
    if (imagePreviewUrls[index]) {
      URL.revokeObjectURL(imagePreviewUrls[index]);
    }

    setSelectedFiles(newFiles);
    setImagePreviewUrls(newPreviews);
  };

  const handlePasteImage = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], "pasted-image.png", {
            type: blob.type || "image/png",
          });

          setSelectedFiles([...selectedFiles, file]);

          const previewUrl = URL.createObjectURL(file);
          setImagePreviewUrls([...imagePreviewUrls, previewUrl]);
        }
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isMyMessage = (message: Message) => {
    return message.senderId._id === user?.id;
  };

  const renderMessage = (message: Message) => {
    const isMine = isMyMessage(message);
    const files = message.metadata?.files || [];

    
    if (files.length > 0) {
      console.log("Message files:", files);
    }

    return (
      <div
        key={message._id}
        className={`flex ${
          isMine ? "justify-end" : "justify-start"
        } mb-4 group`}
      >
        <div
          className={`flex items-end space-x-2 max-w-[75%] ${
            isMine ? "flex-row-reverse space-x-reverse" : ""
          }`}
        >
          {!isMine && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              {message.senderId.avatar ? (
                <img
                  src={message.senderId.avatar}
                  alt={message.senderId.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-white">
                  {message.senderId.fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col">
            <div
              className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                isMine
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm"
                  : "bg-white text-gray-900 rounded-bl-sm border border-gray-200"
              }`}
            >
              {message.content && (
                <p className="break-words text-sm leading-relaxed">
                  {message.content}
                </p>
              )}

    
              {files.length > 0 && (
                <div className={`${message.content ? "mt-2" : ""} space-y-2`}>
                  {files.map((file, index) => {
                    // Xử lý URL - thêm base URL nếu cần
                    const fileUrl = file.url.startsWith("http")
                      ? file.url
                      : `http://localhost:8081${file.url}`;

                    return (
                      <div key={index}>
                        {file.mimetype.startsWith("image/") ? (
                          <img
                            src={fileUrl}
                            alt={file.originalname}
                            className="max-w-xs rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                            style={{ maxHeight: "250px" }}
                            onError={(e) => {
                              console.error("Image load error:", fileUrl);
                              e.currentTarget.src =
                                "https://via.placeholder.com/300x200?text=Image+Error";
                            }}
                          />
                        ) : (
                          <div
                            className={`flex items-center space-x-2 p-3 rounded-xl ${
                              isMine
                                ? "bg-blue-800 bg-opacity-50"
                                : "bg-gray-100"
                            }`}
                          >
                            <FileText className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate font-medium">
                                {file.originalname}
                              </p>
                              <p
                                className={`text-xs ${
                                  isMine ? "text-blue-200" : "text-gray-500"
                                }`}
                              >
                                {file.formattedSize ||
                                  formatFileSize(file.size)}
                              </p>
                            </div>
                            <a
                              href={fileUrl}
                              download={file.originalname}
                              className="flex-shrink-0 hover:opacity-70 transition-opacity"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {message.metadata?.isDeleted && (
                <p className="text-sm italic opacity-75">Tin nhắn đã bị xóa</p>
              )}
              {message.metadata?.editedAt && (
                <p className="text-xs opacity-75 mt-1">Đã chỉnh sửa</p>
              )}
            </div>

            <div
              className={`flex items-center space-x-2 mt-1 px-1 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
              {isMine && message.isRead && (
                <span className="text-xs text-blue-600 font-medium">✓✓</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Hiển thị loading khi đang tải HOẶC chưa có chat data
  if (isLoading || (!chat && chatId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  // Chỉ hiển thị 404 khi đã load xong VÀ thực sự không có chat
  if (!chat && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy cuộc trò chuyện</p>
          <button
            onClick={() => navigate("/account", { state: { activeTab: "chat" } })}
            className="mt-4 text-blue-600 hover:underline"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Guard clause: đảm bảo chat không null
  if (!chat) {
    return null;
  }

  // Xác định người chat (người còn lại, không phải mình)
  const otherUser =
    chat.buyerId._id === user?.id ? chat.sellerId : chat.buyerId;
  const listing = chat.listingId;

  // Kiểm tra xem otherUser có online không
  const isOtherUserOnline = onlineUsers.includes(otherUser._id);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/account", { state: { activeTab: "chat" } })}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2 transition-colors"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md">
                    {otherUser?.avatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {otherUser?.fullName?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  {isOtherUserOnline && (
                    <Circle className="absolute bottom-0 right-0 w-3.5 h-3.5 text-green-500 fill-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900 text-base">
                    {otherUser?.fullName || "Người dùng"}
                  </h2>
                  <p className="text-xs text-gray-500 flex items-center space-x-1">
                    {isOtherUserOnline ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span>Đang hoạt động</span>
                      </>
                    ) : (
                      <span>Không hoạt động</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Listing Info - Compact */}
            {listing && (
              <Link
                to={`/vehicle/${listing._id}`}
                className="hidden md:flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors group"
              >
                {listing.photos?.[0] && (
                  <img
                    src={getImageUrl(listing.photos[0])}
                    alt="Listing"
                    className="w-10 h-10 rounded object-cover ring-1 ring-gray-200"
                  />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {listing.make} {listing.model} {listing.year}
                  </p>
                  {listing.priceListed && (
                    <p className="text-xs text-gray-600 font-semibold">
                      {listing.priceListed.toLocaleString("vi-VN")} đ
                    </p>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{
          background: "linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4">
                <MessageCircle className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg mb-8">
                Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
              </p>

              {/* Quick Reply Suggestions */}
              {listing && (
                <div className="max-w-md mx-auto">
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    💬 Tin nhắn gợi ý:
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        handleQuickReplyWithImage(
                          `Xin chào, tôi quan tâm đến ${listing.make} ${listing.model} ${listing.year} của bạn. Xe còn không?`,
                          listing.photos?.[0]
                            ? getImageUrl(listing.photos[0])
                            : undefined
                        )
                      }
                      disabled={isSending}
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-center space-x-3">
                        {listing.photos?.[0] && (
                          <img
                            src={getImageUrl(listing.photos[0])}
                            alt="Vehicle"
                            className="w-14 h-14 rounded-lg object-cover ring-2 ring-gray-200 group-hover:ring-blue-400 transition-all"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            Xe còn không?
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {listing.make} {listing.model} {listing.year}
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        handleQuickReply(`Cho tôi hỏi giá xe này là bao nhiêu?`)
                      }
                      disabled={isSending}
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        💰 Hỏi giá xe
                      </p>
                    </button>

                    <button
                      onClick={() =>
                        handleQuickReply(
                          `Tôi có thể xem xe trực tiếp được không?`
                        )
                      }
                      disabled={isSending}
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        👀 Hẹn xem xe
                      </p>
                    </button>

                    <button
                      onClick={() =>
                        handleQuickReply(`Xe có thể thương lượng giá không?`)
                      }
                      disabled={isSending}
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        🤝 Thương lượng giá
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* Quick Replies - Always visible */}
          {listing && messages.length < 3 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() =>
                  handleQuickReplyWithImage(
                    `Xin chào, tôi quan tâm đến ${listing.make} ${listing.model} ${listing.year}. Xe còn không?`,
                    listing.photos?.[0]
                      ? getImageUrl(listing.photos[0])
                      : undefined
                  )
                }
                disabled={isSending}
                className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 text-blue-700 rounded-full px-5 py-2.5 text-sm font-medium hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💬 Xe còn không?
              </button>
              <button
                onClick={() =>
                  handleQuickReply(`Cho tôi hỏi giá xe này là bao nhiêu?`)
                }
                disabled={isSending}
                className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 text-blue-700 rounded-full px-5 py-2.5 text-sm font-medium hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                💰 Hỏi giá
              </button>
              <button
                onClick={() =>
                  handleQuickReply(`Tôi có thể xem xe trực tiếp được không?`)
                }
                disabled={isSending}
                className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 text-blue-700 rounded-full px-5 py-2.5 text-sm font-medium hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                👀 Xem xe
              </button>
              <button
                onClick={() =>
                  handleQuickReply(`Xe có thể thương lượng giá không?`)
                }
                disabled={isSending}
                className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 text-blue-700 rounded-full px-5 py-2.5 text-sm font-medium hover:from-blue-100 hover:to-blue-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🤝 Thương lượng
              </button>
            </div>
          )}

          {/* Image & File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.startsWith("image/") &&
                    imagePreviewUrls[index] ? (
                      // Image preview
                      <div className="relative">
                        <img
                          src={imagePreviewUrls[index]}
                          alt={file.name}
                          className="w-24 h-24 object-cover rounded-xl border-2 border-gray-300 shadow-sm"
                        />
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg hover:scale-110"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      // File preview (non-image)
                      <div className="relative bg-white rounded-xl px-4 py-3 pr-10 flex items-center space-x-2 border border-gray-300 shadow-sm">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-900 font-medium max-w-[150px] truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors hover:scale-110"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end space-x-3 bg-gray-50 rounded-2xl p-2 border-2 border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-white transition-all"
              title="Đính kèm file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              onClick={() => imageInputRef.current?.click()}
              className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-white transition-all"
              title="Gửi hình ảnh"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPaste={handlePasteImage}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-3 bg-transparent focus:outline-none text-gray-900 placeholder-gray-500"
              disabled={isSending}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={
                isSending || (!newMessage.trim() && selectedFiles.length === 0)
              }
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDetailPage;
