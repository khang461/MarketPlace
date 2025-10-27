# Hệ thống Thông Báo (Notification System)

## 📋 Tổng quan

Hệ thống thông báo real-time cho ứng dụng marketplace, hỗ trợ nhiều loại thông báo (tin nhắn, đề nghị, lịch hẹn, listing, system) với WebSocket để cập nhật thời gian thực.

## 🎯 Tính năng

### ✅ Đã hoàn thành

1. **NotificationBell Component** (Header)

   - Icon chuông với badge hiển thị số thông báo chưa đọc
   - Dropdown hiển thị danh sách thông báo (tối đa 10 gần nhất)
   - Real-time cập nhật khi có thông báo mới qua WebSocket
   - Âm thanh khi có thông báo mới
   - Đánh dấu đã đọc (từng cái hoặc tất cả)
   - Xóa thông báo
   - Click vào thông báo → navigate đến URL tương ứng
   - Hiển thị thời gian tương đối (VD: "2 phút trước")

2. **NotificationsPage** (Trang đầy đủ)

   - Xem tất cả thông báo với pagination
   - Lọc theo trạng thái: Tất cả / Chưa đọc / Tin nhắn / Đề nghị
   - Hiển thị cả thời gian tương đối và thời gian chính xác
   - Đánh dấu đã đọc/chưa đọc
   - Xóa thông báo (từng cái hoặc tất cả đã đọc)
   - Load more để xem thêm
   - Responsive design

3. **Backend Integration**

   - API endpoints:
     - `GET /notifications` - Lấy danh sách (có pagination, filter)
     - `GET /notifications/unread-count` - Đếm chưa đọc
     - `POST /notifications/:id/read` - Đánh dấu đã đọc
     - `POST /notifications/mark-all-read` - Đánh dấu tất cả đã đọc
     - `DELETE /notifications/:id` - Xóa thông báo
     - `DELETE /notifications/delete-all-read` - Xóa tất cả đã đọc

4. **WebSocket Real-time**

   - Lắng nghe event `new_notification` từ server
   - Tự động cập nhật UI khi có thông báo mới
   - Phát âm thanh thông báo
   - Tăng badge count real-time

5. **Type Safety**
   - TypeScript interfaces đầy đủ
   - Type-safe API calls
   - Proper error handling

## 📁 Cấu trúc File

```
src/
├── types/
│   └── notification.ts              # Type definitions
├── config/
│   └── notificationAPI.ts           # API service layer
├── components/
│   └── Common/
│       └── NotificationBell.tsx     # Bell icon component (header)
├── pages/
│   └── NotificationsPage.tsx        # Full notifications page
├── utils/
│   └── timeHelper.ts                # Time formatting utilities
└── App.tsx                          # Route added: /notifications
```

## 🔧 Cách sử dụng

### 1. NotificationBell trong Header

Component tự động hiển thị khi user đã đăng nhập:

```tsx
// src/components/Layout/Header.tsx
{
  isAuthenticated && <NotificationBell />;
}
```

**Tính năng:**

- Click vào chuông → mở dropdown
- Badge đỏ hiển thị số thông báo chưa đọc
- Click ngoài dropdown → tự động đóng
- Click "Xem tất cả thông báo" → navigate đến `/notifications`

### 2. NotificationsPage (Trang đầy đủ)

Truy cập qua URL: `/notifications`

**Filters:**

- **Tất cả**: Hiển thị tất cả thông báo
- **Chưa đọc**: Chỉ thông báo chưa đọc
- **Tin nhắn**: Chỉ thông báo type = "message"
- **Đề nghị**: Chỉ thông báo type = "offer"

**Actions:**

- **Đọc tất cả**: Đánh dấu tất cả là đã đọc
- **Xóa đã đọc**: Xóa tất cả thông báo đã đọc
- **Tải thêm**: Load more notifications (pagination)

### 3. Backend Notification Creation

Khi backend tạo thông báo mới:

```typescript
// Backend code (reference)
const notification = await NotificationMessageService.createMessageNotification(
  recipientUserId,
  senderId,
  chatId,
  messagePreview,
  senderName,
  senderAvatar
);

// Backend tự động:
// 1. Lưu vào MongoDB
// 2. Emit qua WebSocket: socket.to(`user_${userId}`).emit("new_notification", notification)
```

Frontend tự động nhận và cập nhật UI:

```typescript
// Trong NotificationBell.tsx
socket.on("new_notification", (notification) => {
  setNotifications([notification, ...notifications]);
  setUnreadCount((count) => count + 1);
  playNotificationSound();
});
```

## 🎨 UI/UX Features

### NotificationBell

- **Icon**: Lucide `Bell` icon
- **Badge**: Red circle với số count
- **Dropdown**:
  - Width: 384px (w-96)
  - Max height: 600px (scrollable)
  - Position: Absolute, right-0
  - Animation: Smooth fade-in
- **Empty state**: "Không có thông báo nào"
- **Loading state**: Spinner animation

### NotificationsPage

- **Header**: Title + Quick actions (Đọc tất cả, Xóa đã đọc)
- **Filters**: Button group với active state (blue)
- **Notification Cards**:
  - Chưa đọc: Border trái màu xanh
  - Đã đọc: Border mờ
  - Hover: Shadow tăng
  - Click: Navigate + mark as read
- **Icons by type**:
  - Message: 💬
  - Offer: 💰
  - Appointment: 📅
  - Listing: 📝
  - System: ⚙️

## 🔔 Notification Types

### 1. Message (Tin nhắn)

```typescript
{
  type: "message",
  title: "Tin nhắn mới từ [Tên người gửi]",
  message: "[Preview nội dung tin nhắn]",
  chatId: "chat_id",
  senderId: { _id, fullName, avatar },
  actionUrl: "/chat/[chatId]"
}
```

### 2. Offer (Đề nghị)

```typescript
{
  type: "offer",
  title: "Đề nghị mới cho [Tên sản phẩm]",
  message: "Giá đề nghị: [amount] VND",
  relatedId: "listing_id",
  senderId: { _id, fullName },
  actionUrl: "/vehicle/[listingId]"
}
```

### 3. Appointment (Lịch hẹn)

```typescript
{
  type: "appointment",
  title: "Lịch hẹn mới",
  message: "Lịch xem xe: [date]",
  relatedId: "listing_id",
  actionUrl: "/vehicle/[listingId]"
}
```

### 4. Listing (Đăng tin)

```typescript
{
  type: "listing",
  title: "Tin đăng được duyệt",
  message: "[Listing title] đã được phê duyệt",
  relatedId: "listing_id",
  actionUrl: "/vehicle/[listingId]"
}
```

### 5. System (Hệ thống)

```typescript
{
  type: "system",
  title: "Thông báo hệ thống",
  message: "[System message]",
  actionUrl: null
}
```

## 📊 Backend Schema (Reference)

```typescript
interface Notification {
  _id: string;
  userId: string; // Người nhận thông báo
  type: "message" | "offer" | "appointment" | "listing" | "system";
  title: string; // Tiêu đề
  message: string; // Nội dung
  relatedId?: string; // ID liên quan (listing, offer, etc.)
  chatId?: string; // ID chat (nếu là message)
  senderId?: {
    // Người gửi
    _id: string;
    fullName: string;
    avatar?: string;
    email?: string;
  };
  isRead: boolean; // Đã đọc chưa
  isDeleted: boolean; // Đã xóa chưa (soft delete)
  actionUrl?: string; // URL khi click
  actionText?: string; // Text button action
  metadata?: {
    // Metadata tùy chỉnh
    senderName?: string;
    senderAvatar?: string;
    messagePreview?: string;
    offerAmount?: number;
    appointmentDate?: Date;
    listingTitle?: string;
    [key: string]: any;
  };
  readAt?: Date; // Thời gian đọc
  createdAt: Date; // Thời gian tạo
  updatedAt: Date; // Thời gian update
}
```

**Indexes:**

- `{ userId: 1, isRead: 1 }` - Query chưa đọc
- `{ userId: 1, createdAt: -1 }` - Sort theo thời gian
- `{ userId: 1, type: 1 }` - Filter theo type

**TTL Index:**

- Tự động xóa sau 30 ngày: `{ createdAt: 1 }, { expireAfterSeconds: 2592000 }`

## 🔌 WebSocket Events

### Client → Server

```typescript
// Join user room (tự động khi connect)
socket.emit("join_user_room", { userId });
```

### Server → Client

```typescript
// Thông báo mới
socket.on("new_notification", (notification: Notification) => {
  // Frontend tự động xử lý
});
```

## 🧪 Testing

### Test WebSocket trong Browser Console:

```javascript
// 1. Check socket connection
window.WebSocketDebug?.checkConnection();

// 2. Test emit notification (nếu backend support)
// Backend sẽ tự emit khi có notification mới
```

### Test UI:

1. Đăng nhập 2 tài khoản khác nhau
2. User A gửi tin nhắn cho User B
3. User B sẽ nhận thông báo real-time:
   - Badge count tăng
   - Âm thanh phát
   - Notification hiển thị trong dropdown
4. Click vào notification → navigate đến chat

## ⚙️ Configuration

### Sound (có thể tùy chỉnh):

```typescript
// src/components/Common/NotificationBell.tsx
const playNotificationSound = () => {
  const audio = new Audio("/notification.mp3"); // Thay đổi file âm thanh
  audio.volume = 0.5; // Điều chỉnh âm lượng (0.0 - 1.0)
  audio.play().catch(console.error);
};
```

### Pagination:

```typescript
// src/pages/NotificationsPage.tsx
const limit = 20; // Số notification mỗi page (có thể thay đổi)
```

### Dropdown limit:

```typescript
// src/components/Common/NotificationBell.tsx
const response = await notificationAPI.getNotifications({
  limit: 10, // Số notification trong dropdown (có thể thay đổi)
  skip: 0,
});
```

## 🚀 Mở rộng trong tương lai

### 1. Push Notifications

- Tích hợp Web Push API
- Service Worker để nhận notification khi app đóng
- Request permission từ user

### 2. Email Notifications

- Gửi email khi có notification quan trọng
- Tùy chọn bật/tắt email notification

### 3. Notification Preferences

- User setting để chọn loại notification muốn nhận
- Tắt/bật âm thanh
- Tắt/bật toast notification

### 4. Rich Notifications

- Hình ảnh trong notification
- Action buttons (Accept/Reject offer)
- Quick reply cho message

### 5. Analytics

- Track notification delivery rate
- Track click-through rate
- User engagement metrics

## 🐛 Troubleshooting

### Không nhận được notification:

1. Check WebSocket connection: `console.log(socket?.connected)`
2. Check user đã join room: `socket.emit("join_user_room", { userId })`
3. Check backend có emit đúng room: `user_${userId}`
4. Check browser console có error không

### Badge count không chính xác:

1. Refresh page → sẽ fetch lại từ API
2. Check API `/notifications/unread-count` return đúng

### Âm thanh không phát:

1. Check file `/public/notification.mp3` tồn tại
2. Check browser autoplay policy (user phải interact với page trước)
3. Check volume setting

### Navigation không hoạt động:

1. Check `actionUrl` có đúng format
2. Check route đã được define trong App.tsx
3. Check user permission (private routes)

## 📝 Notes

- Notification tự động xóa sau 30 ngày (TTL index)
- Soft delete: `isDeleted = true` (không xóa hẳn khỏi DB)
- Real-time chỉ hoạt động khi WebSocket connected
- Badge count được cache, refresh khi user mở dropdown
- Time formatting sử dụng custom helper (không dùng date-fns)

## 🎓 Best Practices

1. **Luôn mark as read khi user click vào notification**
2. **Không spam notifications** - Chỉ gửi khi cần thiết
3. **Notification title phải rõ ràng** - User biết ngay nội dung
4. **ActionUrl phải chính xác** - Navigate đến đúng màn hình
5. **Test với nhiều loại notification** - Đảm bảo UI consistent
6. **Handle errors gracefully** - Không crash app khi API fail

## 📚 Related Files

- `src/contexts/SocketContext.tsx` - WebSocket connection management
- `src/config/api.ts` - Axios instance configuration
- `src/utils/timeHelper.ts` - Time formatting utilities
- `src/components/Common/ChatNotificationListener.tsx` - Chat-specific notifications

---

**Developed with ❤️ for MarketPlace Project**
