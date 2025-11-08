import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client"; // <- default import, KHÔNG { io, Socket }
import { useAuth } from "./AuthContext";

type AnyCb = (...args: unknown[]) => void;

interface SocketContextType {
  socket: ReturnType<typeof io> | null;
  isConnected: boolean;
  emit: (event: string, payload?: unknown) => void;
  on: (event: string, cb: AnyCb) => void;
  off: (event: string, cb?: AnyCb) => void;
  joinAuction: (auctionId: string) => void;
  leaveAuction: (auctionId: string) => void;
  bidAuctionWs: (auctionId: string, bid: number) => void;
  onAuctionBidUpdate: (cb: AnyCb) => void;
  onAuctionBidResult: (cb: AnyCb) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const tokenRef = useRef<string | null>(null);
  tokenRef.current = localStorage.getItem("token");

  const joinedAuctionsRef = useRef<Set<string>>(new Set());
  const WS_URL = useMemo(() => import.meta.env.VITE_WS_URL || "http://localhost:8081", []);

  useEffect(() => {
    if (!isAuthenticated || !tokenRef.current) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        joinedAuctionsRef.current.clear();
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
      joinedAuctionsRef.current.forEach((id) => s.emit("join_auction", id));
      console.log("✅ Socket connected:", s.id);
    };
    const onDisconnect = () => { setIsConnected(false); console.log("❌ Socket disconnected"); };
    const onConnectError = (err: Error) => { setIsConnected(false); console.error("Socket connect_error:", err); };

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

  const emit = (event: string, payload?: unknown) => socket?.emit(event, payload);
  const on = (event: string, cb: AnyCb) => socket?.on(event, cb);
  const off = (event: string, cb?: AnyCb) => {  socket?.off(event, cb); };

  const joinAuction = (auctionId: string) => { if (!auctionId) return; joinedAuctionsRef.current.add(auctionId); socket?.emit("join_auction", auctionId); };
  const leaveAuction = (auctionId: string) => { if (!auctionId) return; joinedAuctionsRef.current.delete(auctionId); socket?.emit("leave_auction", auctionId); };
  const bidAuctionWs = (auctionId: string, bid: number) => socket?.emit("bid_auction", { auctionId, bid });

  const onAuctionBidUpdate = (cb: AnyCb) => on("auction_bid_update", cb);
  const onAuctionBidResult = (cb: AnyCb) => on("auction_bid_result", cb);

  return (
    <SocketContext.Provider value={{ socket, isConnected, emit, on, off, joinAuction, leaveAuction, bidAuctionWs, onAuctionBidUpdate, onAuctionBidResult }}>
      {children}
    </SocketContext.Provider>
  );
};
