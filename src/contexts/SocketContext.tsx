import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

type AnyCb = (...args: unknown[]) => void;

// ================== INTERFACE DEFINITIONS ==================
interface MessageData {
  chatId: string;
  content: string;
  messageType?: "text" | "image" | "file" | "offer" | "appointment";
  metadata?: any;
}

interface ImageData {
  chatId: string;
  imageData: string; // base64
  content?: string;
  caption?: string;
  fileName?: string;
}

interface AuctionBidData {
  auctionId: string;
  bid: number;
}

interface OfferData {
  chatId: string;
  offerId: string;
  offeredPrice: number;
  message?: string;
}

interface AppointmentData {
  chatId: string;
  appointmentId: string;
  scheduledDate: string;
  location: any;
}

// ================== SOCKET CONTEXT TYPE ==================
interface SocketContextType {
  socket: ReturnType<typeof io> | null;
  isConnected: boolean;

  // Generic emit/on/off
  emit: (event: string, payload?: unknown) => void;
  on: (event: string, cb: AnyCb) => void;
  off: (event: string, cb?: AnyCb) => void;

  // ========== CHAT METHODS ==========
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (data: MessageData) => void;
  sendImage: (data: ImageData) => void;
  emitTypingStart: (chatId: string) => void;
  emitTypingStop: (chatId: string) => void;
  emitOfferCreated: (data: OfferData) => void;
  emitAppointmentCreated: (data: AppointmentData) => void;

  // Chat listeners
  onNewMessage: (cb: AnyCb) => void;
  onMessageNotification: (cb: AnyCb) => void;
  onChatListUpdate: (cb: AnyCb) => void;
  onError: (cb: AnyCb) => void;
  onFraudWarning: (cb: AnyCb) => void;
  onUserTyping: (cb: AnyCb) => void;
  onUserStoppedTyping: (cb: AnyCb) => void;
  onUserStatusUpdate: (cb: AnyCb) => void;
  onContactStatusUpdate: (cb: AnyCb) => void;
  onNewOffer: (cb: AnyCb) => void;
  onNewAppointment: (cb: AnyCb) => void;
  onMessageEdited: (cb: AnyCb) => void;
  onMessageDeleted: (cb: AnyCb) => void;
  onMessageReactionUpdated: (cb: AnyCb) => void;
  onFileUploaded: (cb: AnyCb) => void;

  // ========== AUCTION METHODS ==========
  joinAuction: (auctionId: string) => void;
  leaveAuction: (auctionId: string) => void;
  bidAuctionWs: (auctionId: string, bid: number) => void;

  // Auction listeners
  onAuctionBidUpdate: (cb: AnyCb) => void;
  onAuctionBidResult: (cb: AnyCb) => void;
  onAuctionStarted: (cb: AnyCb) => void;
  onAuctionApproved: (cb: AnyCb) => void;
  onAuctionRejected: (cb: AnyCb) => void;
  onAuctionCancelled: (cb: AnyCb) => void;
  onNewBid: (cb: AnyCb) => void;
  onAuctionEnded: (cb: AnyCb) => void;
  onAuctionBidPlaced: (cb: AnyCb) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const tokenRef = useRef<string | null>(null);
  tokenRef.current = localStorage.getItem("token");

  const joinedAuctionsRef = useRef<Set<string>>(new Set());
  const joinedChatsRef = useRef<Set<string>>(new Set());
  const WS_URL = useMemo(
    () => import.meta.env.VITE_WS_URL || "http://localhost:8081",
    []
  );

  // ================== CONNECTION MANAGEMENT ==================
  useEffect(() => {
    if (!isAuthenticated || !tokenRef.current) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        joinedAuctionsRef.current.clear();
        joinedChatsRef.current.clear();
      }
      return;
    }

    const s = io(WS_URL, {
      auth: { token: tokenRef.current },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
    });

    const onConnect = () => {
      setIsConnected(true);
      console.log("✅ Socket connected:", s.id);

      // Rejoin all rooms on reconnect
      joinedAuctionsRef.current.forEach((id) => s.emit("join_auction", id));
      joinedChatsRef.current.forEach((id) => s.emit("join_chat", id));

      // Join user's personal room (backend auto-joins user_X in setupEventHandlers)
      if (user?._id) {
        console.log(`🔵 Auto-joined personal room: user_${user._id}`);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("❌ Socket disconnected");
    };

    const onConnectError = (err: Error) => {
      setIsConnected(false);
      console.error("Socket connect_error:", err);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);

    setSocket(s);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, WS_URL]);

  // ================== GENERIC METHODS ==================
  const emit = (event: string, payload?: unknown) =>
    socket?.emit(event, payload);
  const on = (event: string, cb: AnyCb) => socket?.on(event, cb);
  const off = (event: string, cb?: AnyCb) => socket?.off(event, cb);

  // ================== CHAT METHODS ==================
  const joinChat = (chatId: string) => {
    if (!chatId) return;
    joinedChatsRef.current.add(chatId);
    socket?.emit("join_chat", chatId);
    console.log("🔵 Joined chat:", chatId);
  };

  const leaveChat = (chatId: string) => {
    if (!chatId) return;
    joinedChatsRef.current.delete(chatId);
    socket?.emit("leave_chat", chatId);
    console.log("🔴 Left chat:", chatId);
  };

  const sendMessage = (data: MessageData) => {
    socket?.emit("send_message", {
      chatId: data.chatId,
      content: data.content,
      messageType: data.messageType || "text",
      metadata: data.metadata || {},
    });
  };

  const sendImage = (data: ImageData) => {
    socket?.emit("send_image", data);
  };

  const emitTypingStart = (chatId: string) => {
    socket?.emit("typing_start", { chatId });
  };

  const emitTypingStop = (chatId: string) => {
    socket?.emit("typing_stop", { chatId });
  };

  const emitOfferCreated = (data: OfferData) => {
    socket?.emit("offer_created", data);
  };

  const emitAppointmentCreated = (data: AppointmentData) => {
    socket?.emit("appointment_created", data);
  };

  // ========== CHAT LISTENERS ==========
  const onNewMessage = (cb: AnyCb) => on("new_message", cb);
  const onMessageNotification = (cb: AnyCb) => on("message_notification", cb);
  const onChatListUpdate = (cb: AnyCb) => on("chat_list_update", cb);
  const onError = (cb: AnyCb) => on("error", cb);
  const onFraudWarning = (cb: AnyCb) => on("fraud_warning", cb);
  const onUserTyping = (cb: AnyCb) => on("user_typing", cb);
  const onUserStoppedTyping = (cb: AnyCb) => on("user_stopped_typing", cb);
  const onUserStatusUpdate = (cb: AnyCb) => on("user_status_update", cb);
  const onContactStatusUpdate = (cb: AnyCb) => on("contact_status_update", cb);
  const onNewOffer = (cb: AnyCb) => on("new_offer", cb);
  const onNewAppointment = (cb: AnyCb) => on("new_appointment", cb);
  const onMessageEdited = (cb: AnyCb) => on("message_edited", cb);
  const onMessageDeleted = (cb: AnyCb) => on("message_deleted", cb);
  const onMessageReactionUpdated = (cb: AnyCb) =>
    on("message_reaction_updated", cb);
  const onFileUploaded = (cb: AnyCb) => on("file_uploaded", cb);

  // ================== AUCTION METHODS ==================
  const joinAuction = (auctionId: string) => {
    if (!auctionId) return;
    joinedAuctionsRef.current.add(auctionId);
    socket?.emit("join_auction", auctionId);
    console.log("🔵 Joined auction:", auctionId);
  };

  const leaveAuction = (auctionId: string) => {
    if (!auctionId) return;
    joinedAuctionsRef.current.delete(auctionId);
    socket?.emit("leave_auction", auctionId);
    console.log("🔴 Left auction:", auctionId);
  };

  const bidAuctionWs = (auctionId: string, bid: number) => {
    socket?.emit("bid_auction", { auctionId, bid });
  };

  // ========== AUCTION LISTENERS ==========
  const onAuctionBidUpdate = (cb: AnyCb) => on("auction_bid_update", cb);
  const onAuctionBidResult = (cb: AnyCb) => on("auction_bid_result", cb);
  const onAuctionStarted = (cb: AnyCb) => on("auction_started", cb);
  const onAuctionApproved = (cb: AnyCb) => on("auction_approved", cb);
  const onAuctionRejected = (cb: AnyCb) => on("auction_rejected", cb);
  const onAuctionCancelled = (cb: AnyCb) => on("auction_cancelled", cb);
  const onNewBid = (cb: AnyCb) => on("new_bid", cb);
  const onAuctionEnded = (cb: AnyCb) => on("auction:ended", cb);
  const onAuctionBidPlaced = (cb: AnyCb) => on("auction:bidPlaced", cb);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        emit,
        on,
        off,

        // Chat methods
        joinChat,
        leaveChat,
        sendMessage,
        sendImage,
        emitTypingStart,
        emitTypingStop,
        emitOfferCreated,
        emitAppointmentCreated,
        onNewMessage,
        onMessageNotification,
        onChatListUpdate,
        onError,
        onFraudWarning,
        onUserTyping,
        onUserStoppedTyping,
        onUserStatusUpdate,
        onContactStatusUpdate,
        onNewOffer,
        onNewAppointment,
        onMessageEdited,
        onMessageDeleted,
        onMessageReactionUpdated,
        onFileUploaded,

        // Auction methods
        joinAuction,
        leaveAuction,
        bidAuctionWs,
        onAuctionBidUpdate,
        onAuctionBidResult,
        onAuctionStarted,
        onAuctionApproved,
        onAuctionRejected,
        onAuctionCancelled,
        onNewBid,
        onAuctionEnded,
        onAuctionBidPlaced,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
