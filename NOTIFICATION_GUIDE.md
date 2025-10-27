# 🔔 Chat Notification System - Hướng dẫn sử dụng

## ✨ Tính năng đã triển khai

### 1. **Browser Notifications (Desktop)**

- ✅ Hiển thị thông báo từ trình duyệt khi có tin nhắn mới
- ✅ Chỉ hiển thị khi tab/window không được focus
- ✅ Click vào notification để focus vào chat
- ✅ Tự động đóng sau 5 giây
- ✅ Hiển thị avatar người gửi
- ✅ Nội dung tin nhắn (tối đa 100 ký tự)

### 2. **In-App Toast Notifications**

- ✅ Toast notification bằng SweetAlert2
- ✅ Hiển thị góc trên bên phải màn hình
- ✅ Click để chuyển đến chat
- ✅ Animation mượt mà
- ✅ Chỉ hiển thị cho chat KHÔNG đang mở

### 3. **Notification Sound**

- ✅ Phát âm thanh khi có tin nhắn mới
- ✅ Volume mặc định: 30% (không quá ồn)
- ✅ Tự động retry nếu lỗi
- ✅ Không phát nếu đang ở trong chat đó

### 4. **Smart Detection**

- ✅ Không thông báo nếu đang trong chat đó
- ✅ Không thông báo tin nhắn từ chính mình
- ✅ Detect tab hidden/visible
- ✅ Auto mark as read khi đang xem chat

## 📁 Files đã tạo/sửa

### Files mới:

1. **`src/utils/notificationManager.ts`**

   - Utility class quản lý notifications
   - Methods: requestPermission, showNotification, playSound, etc.

2. **`src/components/Common/ChatNotificationListener.tsx`**

   - Component lắng nghe notifications từ WebSocket
   - Listen events: `message_notification`, `chat_list_update`

3. **`public/README_NOTIFICATION.md`**
   - Hướng dẫn setup notification sound files

### Files đã cập nhật:

1. **`src/App.tsx`**

   - Added `<ChatNotificationListener />` component

2. **`src/pages/ChatDetailPage.tsx`**

   - Added notification on new message
   - Using NotificationManager utility

3. **`src/index.css`**
   - Added CSS animation cho toast notifications

## 🔧 Setup yêu cầu

### 1. Notification Sound File

Đặt file `notification.mp3` vào folder `/public`:

```
project/
  public/
    notification.mp3  ← Sound file (1-2 seconds, moderate volume)
    default-avatar.png ← Default avatar image
    logo.png ← App logo for badge
```

**Nguồn download âm thanh miễn phí:**

- https://notificationsounds.com/
- https://freesound.org/
- https://mixkit.co/free-sound-effects/notification/

### 2. Browser Permission

Người dùng cần cho phép notification khi được hỏi lần đầu.

## 🎯 Cách hoạt động

### Flow 1: Notification trong ChatDetailPage

```
User A gửi tin nhắn
    ↓
WebSocket emit "send_message"
    ↓
Backend broadcast "new_message" to chat room
    ↓
User B nhận message qua socket.on("new_message")
    ↓
IF (message không phải từ mình && tab hidden)
    ↓
Show browser notification + play sound
```

### Flow 2: Notification từ các chat khác

```
User A gửi tin nhắn trong Chat X
    ↓
Backend emit "message_notification" to User B
    ↓
ChatNotificationListener catch event
    ↓
IF (User B không đang ở Chat X)
    ↓
Show toast notification + browser notification + sound
```

## 🧪 Testing

### Test 1: Trong cùng chat

1. Mở 2 tab browser
2. Đăng nhập 2 tài khoản khác nhau
3. Mở cùng 1 chat
4. Gửi tin nhắn từ tab 1
5. **Expected**: Tab 2 nhận tin nhắn real-time, KHÔNG có notification (vì đang trong chat)

### Test 2: Tab hidden

1. Mở chat trong 1 tab
2. Chuyển sang tab khác (hide chat tab)
3. Gửi tin nhắn từ user khác
4. **Expected**: Browser notification xuất hiện, sound phát

### Test 3: Chat khác

1. User A mở Chat 1
2. User B gửi tin nhắn trong Chat 2 (với User A)
3. **Expected**:
   - Toast notification góc trên phải
   - Browser notification nếu tab hidden
   - Sound phát
   - Click để chuyển đến Chat 2

## 📊 WebSocket Events

| Event                  | Direction       | Trigger               | Handler                  |
| ---------------------- | --------------- | --------------------- | ------------------------ |
| `new_message`          | Server → Client | Message sent          | ChatDetailPage           |
| `message_notification` | Server → Client | Message to other chat | ChatNotificationListener |
| `chat_list_update`     | Server → Client | Chat updated          | ChatNotificationListener |

## 🎨 Customization

### Thay đổi âm lượng:

```typescript
// In NotificationManager.ts
NotificationManager.playSound(0.5); // 0.0 - 1.0
```

### Thay đổi thời gian tự đóng notification:

```typescript
// In NotificationManager.ts
NotificationManager.showNotification(title, {
  ...options,
  autoClose: 10000, // milliseconds
});
```

### Thay đổi toast position:

```typescript
// In ChatNotificationListener.tsx
Swal.fire({
  toast: true,
  position: "top-start", // top-start, top, top-end, center, bottom-start, etc.
  ...
});
```

## ⚠️ Troubleshooting

### Không có âm thanh?

- Kiểm tra file `/public/notification.mp3` có tồn tại
- Kiểm tra browser console có lỗi không
- Thử URL trực tiếp: http://localhost:5173/notification.mp3

### Không có browser notification?

- Kiểm tra quyền: Chrome Settings → Site Settings → Notifications
- Check `Notification.permission` trong console
- Re-request permission: `NotificationManager.requestPermission()`

### Toast không hiển thị?

- Check SweetAlert2 đã import đúng chưa
- Check CSS animation trong index.css
- Check console có lỗi không

## 🚀 Next Steps

Các tính năng có thể thêm:

- [ ] Notification badge count (số tin nhắn chưa đọc)
- [ ] Notification settings (allow user to mute)
- [ ] Different sounds for different message types
- [ ] Group notifications (bundle multiple messages)
- [ ] Rich notifications with action buttons
- [ ] Push notifications (requires service worker)
