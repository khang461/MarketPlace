# Hướng Dẫn Sử Dụng Unified Socket Context

## Tổng Quan

Socket đã được **đồng nhất** vào một nguồn duy nhất: **`SocketContext.tsx`** để phục vụ cả **Chat** và **Auction** trên frontend, tương thích với backend `WebSocketService`.

### ✅ Đã Xóa

- `src/services/WebSocket.ts` (ChatSocketService singleton) - **không còn sử dụng**

### ✅ Unified Socket

- `src/contexts/SocketContext.tsx` - **duy nhất** cho toàn bộ ứng dụng

---

## Cách Sử Dụng

### 1. Import Hook

```tsx
import { useSocket } from "../contexts/SocketContext";
```

### 2. Destructure Methods

```tsx
const {
  socket, // Socket instance (nếu cần truy cập trực tiếp)
  isConnected, // Trạng thái kết nối

  // CHAT METHODS
  joinChat,
  leaveChat,
  sendMessage,
  sendImage,
  emitTypingStart,
  emitTypingStop,
  emitOfferCreated,
  emitAppointmentCreated,

  // CHAT LISTENERS
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

  // AUCTION METHODS
  joinAuction,
  leaveAuction,
  bidAuctionWs,

  // AUCTION LISTENERS
  onAuctionBidUpdate,
  onAuctionBidResult,
  onAuctionStarted,
  onAuctionApproved,
  onAuctionRejected,
  onAuctionCancelled,
  onNewBid,
} = useSocket();
```

---

## Ví Dụ Cụ Thể

### Chat: Join/Leave Room

```tsx
useEffect(() => {
  if (!chatId) return;

  joinChat(chatId);

  return () => {
    leaveChat(chatId);
  };
}, [chatId, joinChat, leaveChat]);
```

### Chat: Gửi Tin Nhắn

```tsx
const handleSendMessage = () => {
  sendMessage({
    chatId: "123",
    content: "Hello!",
    messageType: "text", // hoặc "image", "offer", etc.
  });
};
```

### Chat: Typing Indicator

```tsx
const handleTyping = (value: string) => {
  if (value.trim()) {
    emitTypingStart(chatId);
  } else {
    emitTypingStop(chatId);
  }
};
```

### Chat: Lắng Nghe Tin Nhắn Mới

```tsx
useEffect(() => {
  if (!socket) return;

  const handleNewMessage = (message: Message) => {
    console.log("Tin nhắn mới:", message);
    setMessages((prev) => [...prev, message]);
  };

  onNewMessage(handleNewMessage);

  return () => {
    socket.off("new_message", handleNewMessage);
  };
}, [socket, onNewMessage]);
```

### Auction: Join/Leave Room

```tsx
useEffect(() => {
  if (!auctionId) return;

  joinAuction(auctionId);

  return () => {
    leaveAuction(auctionId);
  };
}, [auctionId, joinAuction, leaveAuction]);
```

### Auction: Đặt Giá (WebSocket - không khuyến nghị, dùng REST API placeBid)

```tsx
// Lưu ý: Nên dùng REST API placeBid() từ auctionAPI.ts
// Chỉ dùng bidAuctionWs nếu backend yêu cầu
const handleBid = () => {
  bidAuctionWs(auctionId, bidAmount);
};
```

### Auction: Lắng Nghe Bid Updates

```tsx
useEffect(() => {
  if (!socket) return;

  const handleBidUpdate = (data: {
    auctionId: string;
    bid: any;
    highest: number;
    bidsCount: number;
  }) => {
    console.log("Bid mới:", data);
    setHighestBid(data.highest);
  };

  onAuctionBidUpdate(handleBidUpdate);

  return () => {
    socket.off("auction_bid_update", handleBidUpdate);
  };
}, [socket, onAuctionBidUpdate]);
```

---

## Backend Events Mapping

### Chat Events

| Frontend Method                | Backend Event           | Direction |
| ------------------------------ | ----------------------- | --------- |
| `joinChat(chatId)`             | `join_chat`             | emit →    |
| `leaveChat(chatId)`            | `leave_chat`            | emit →    |
| `sendMessage(data)`            | `send_message`          | emit →    |
| `sendImage(data)`              | `send_image`            | emit →    |
| `emitTypingStart(chatId)`      | `typing_start`          | emit →    |
| `emitTypingStop(chatId)`       | `typing_stop`           | emit →    |
| `emitOfferCreated(data)`       | `offer_created`         | emit →    |
| `emitAppointmentCreated(data)` | `appointment_created`   | emit →    |
| `onNewMessage(cb)`             | `new_message`           | ← on      |
| `onMessageNotification(cb)`    | `message_notification`  | ← on      |
| `onChatListUpdate(cb)`         | `chat_list_update`      | ← on      |
| `onError(cb)`                  | `error`                 | ← on      |
| `onFraudWarning(cb)`           | `fraud_warning`         | ← on      |
| `onUserTyping(cb)`             | `user_typing`           | ← on      |
| `onUserStoppedTyping(cb)`      | `user_stopped_typing`   | ← on      |
| `onUserStatusUpdate(cb)`       | `user_status_update`    | ← on      |
| `onContactStatusUpdate(cb)`    | `contact_status_update` | ← on      |
| `onNewOffer(cb)`               | `new_offer`             | ← on      |
| `onNewAppointment(cb)`         | `new_appointment`       | ← on      |

### Auction Events

| Frontend Method                | Backend Event        | Direction |
| ------------------------------ | -------------------- | --------- |
| `joinAuction(auctionId)`       | `join_auction`       | emit →    |
| `leaveAuction(auctionId)`      | `leave_auction`      | emit →    |
| `bidAuctionWs(auctionId, bid)` | `bid_auction`        | emit →    |
| `onAuctionBidUpdate(cb)`       | `auction_bid_update` | ← on      |
| `onAuctionBidResult(cb)`       | `auction_bid_result` | ← on      |
| `onAuctionStarted(cb)`         | `auction_started`    | ← on      |
| `onAuctionApproved(cb)`        | `auction_approved`   | ← on      |
| `onAuctionRejected(cb)`        | `auction_rejected`   | ← on      |
| `onAuctionCancelled(cb)`       | `auction_cancelled`  | ← on      |
| `onNewBid(cb)`                 | `new_bid`            | ← on      |

---

## Room Patterns (Backend Auto-Join)

Backend tự động join user vào các room sau khi kết nối:

1. **`user_{userId}`** - Room cá nhân của user (nhận notification cá nhân)
2. **`chat_{chatId}`** - Room của cuộc trò chuyện (khi gọi `joinChat`)
3. **`auction_{auctionId}`** - Room của phiên đấu giá (khi gọi `joinAuction`)

---

## Lưu Ý Quan Trọng

### ✅ Đúng

```tsx
// Dùng methods từ useSocket
const { sendMessage, onNewMessage } = useSocket();

sendMessage({ chatId: "123", content: "Hi" });
```

### ❌ Sai

```tsx
// KHÔNG dùng socket.emit trực tiếp (trừ khi cần thiết)
socket.emit("send_message", { chatId: "123", content: "Hi" });
```

### Reconnection Logic

- Socket tự động **rejoin** tất cả rooms (chats & auctions) khi reconnect.
- `joinedChatsRef` và `joinedAuctionsRef` lưu trữ các room đã join.

### Cleanup

Luôn cleanup listeners trong `useEffect`:

```tsx
useEffect(() => {
  const handler = (data) => {
    /* ... */
  };
  onNewMessage(handler);

  return () => {
    socket?.off("new_message", handler);
  };
}, [socket, onNewMessage]);
```

---

## Kết Luận

- **Một nguồn socket duy nhất** (`SocketContext`) cho toàn bộ ứng dụng.
- **Type-safe** với TypeScript interfaces.
- **Tương thích 100%** với backend `WebSocketService`.
- **Dễ maintain** và tránh duplicate connections.
