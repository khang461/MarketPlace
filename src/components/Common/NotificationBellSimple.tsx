import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSocket } from "../../contexts/SocketContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import notificationAPI from "../../config/notificationAPI";
import { Notification } from "../../types/notification";

const NotificationBellSimple: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count only once when user is available
  useEffect(() => {
    if (!user?.id) return;

    const loadUnreadCount = async () => {
      try {
        const data = await notificationAPI.getUnreadCount();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    loadUnreadCount();
  }, [user?.id]);

  // Listen for new notifications via WebSocket
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    const handleNewNotification = (notification: Notification) => {
      console.log("🔔 New notification received:", notification);
      setUnreadCount((prev) => prev + 1);

      // Play sound
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, isConnected, user?.id]);

  const handleClick = () => {
    // Navigate to notifications page
    navigate("/notifications");
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBellSimple;
