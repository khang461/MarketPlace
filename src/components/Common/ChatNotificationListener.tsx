import { useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import NotificationManager from "../../utils/notificationManager";
import api from "../../config/api";

const ChatNotificationListener: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [joinedChats, setJoinedChats] = useState<Set<string>>(new Set());

  // Fetch user's chats and join all chat rooms
  useEffect(() => {
    const fetchAndJoinChats = async () => {
      if (!socket || !isConnected || !user) return;

      try {
        const response = await api.get("/chat");
        const chats = response.data.chats || [];

        console.log("🔔 Joining all user chat rooms:", chats.length);

        const chatIds = new Set<string>();
        chats.forEach((chat: { _id: string }) => {
          const chatId = chat._id;
          if (!joinedChats.has(chatId)) {
            socket.emit("join_chat", chatId);
            chatIds.add(chatId);
            console.log("📩 Joined notification room for chat:", chatId);
          }
        });

        setJoinedChats(chatIds);
      } catch (error) {
        console.error("Error fetching chats for notifications:", error);
      }
    };

    fetchAndJoinChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, user]);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    console.log("� ChatNotificationListener initialized for user:", user.id);

    // Request notification permission
    NotificationManager.requestPermission();

    // Listen for message notifications from other chats
    socket.on(
      "message_notification",
      (data: {
        chatId: string;
        senderId: string;
        senderName?: string;
        senderAvatar?: string;
        content: string;
        messageType?: string;
        timestamp?: Date;
      }) => {
        console.log("📬 Message notification received:", data);

        // Chỉ show notification nếu không đang ở trong chat đó
        const currentChatId = location.pathname.split("/chat/")[1];
        console.log(
          "Current chat:",
          currentChatId,
          "Notification from:",
          data.chatId
        );

        if (currentChatId === data.chatId) {
          console.log("⏭️ Skipping notification - already in this chat");
          return; // Đang ở trong chat này, không cần notification
        }

        console.log(
          "✅ Showing notification for message from:",
          data.senderName
        );

        // Show toast notification
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: `${data.senderName || "Tin nhắn mới"}`,
          text: data.content,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          showCloseButton: true,
          customClass: {
            popup: "notification-toast",
          },
          didOpen: (toast) => {
            toast.addEventListener("click", () => {
              navigate(`/chat/${data.chatId}`);
              Swal.close();
            });
          },
        });

        // Show browser notification and play sound
        NotificationManager.showMessageNotification(
          data.senderName || "Tin nhắn mới",
          data.content,
          {
            avatar: data.senderAvatar,
            chatId: data.chatId,
            onlyWhenHidden: true,
            onClick: () => {
              navigate(`/chat/${data.chatId}`);
            },
          }
        );
      }
    );

    // Listen for chat list updates (update unread count badge)
    socket.on(
      "chat_list_update",
      (data: {
        chatId: string;
        lastMessage: {
          content: string;
          senderId: string;
          timestamp: Date;
        };
        updatedAt: Date;
      }) => {
        console.log("💬 Chat list updated:", data);
        // Có thể trigger re-fetch chat list hoặc update badge count
        // Dispatch custom event để ChatTab có thể lắng nghe
        window.dispatchEvent(
          new CustomEvent("chatListUpdate", { detail: data })
        );
      }
    );

    return () => {
      socket.off("message_notification");
      socket.off("chat_list_update");
    };
  }, [socket, isConnected, user, navigate, location.pathname]);

  return null; // Component này không render gì
};

export default ChatNotificationListener;
