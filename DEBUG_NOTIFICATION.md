# 🐛 Debug Guide - Notification không hoạt động

## Các bước kiểm tra

### 1. Mở Browser Console (F12)

Bạn sẽ thấy các debug tools đã được load:

```
🛠️ WebSocket Debug Tools loaded!
```

### 2. Kiểm tra Socket Connection

Trong console, chạy:

```javascript
// Get socket from React DevTools hoặc check console logs
// Bạn sẽ thấy log: "✅ Socket connected: [socket-id]"
```

Tìm các logs sau:

- ✅ Socket connected: xxx
- 🔔 ChatNotificationListener initialized for user: xxx
- 📩 Joined notification room for chat: xxx

### 3. Kiểm tra Notification Permission

Trong console, chạy:

```javascript
WebSocketDebug.checkNotificationPermission();
```

Kết quả mong đợi:

- ✅ Notification permission granted

Nếu là "denied" hoặc "default":

1. Click vào biểu tượng 🔒 bên trái URL bar
2. Tìm "Notifications"
3. Set thành "Allow"

### 4. Test Notification Sound

```javascript
WebSocketDebug.testNotificationSound();
```

Nếu không nghe thấy âm thanh:

- Kiểm tra file `/public/notification.mp3` có tồn tại không
- Thử truy cập: http://localhost:5173/notification.mp3
- Kiểm tra volume máy tính

### 5. Test Browser Notification

```javascript
WebSocketDebug.testBrowserNotification();
```

Nếu notification xuất hiện → Browser notification hoạt động ✅

### 6. Kiểm tra Socket Listeners

```javascript
// Lấy socket từ useSocket hook
// Trong React DevTools, tìm SocketContext
WebSocketDebug.checkSocketListeners(socket);
```

Phải thấy:

- message_notification: 1 listener(s) ✅
- new_message: 1 listener(s) ✅

### 7. Test thực tế

#### Scenario A: Test trong cùng chat

1. Mở 2 tabs browser
2. Đăng nhập 2 users khác nhau (User A và User B)
3. Cả 2 đều mở cùng 1 chat
4. User A gửi message
5. **Expected**:
   - Tab User B nhận message real-time ✅
   - KHÔNG có notification (vì đang trong chat) ✅

#### Scenario B: Test từ chat khác

1. User A mở Chat 1
2. User B ở trang khác (HomePage, Account, hoặc Chat 2)
3. User A gửi message trong Chat 1
4. **Expected**:
   - User B thấy toast notification góc trên phải ✅
   - Nghe âm thanh notification ✅
   - Nếu tab hidden, thấy browser notification ✅

### 8. Kiểm tra Console Logs

Khi User A gửi message, check console của User B:

**Logs User B phải thấy:**

```
📩 Joined notification room for chat: [chatId]
📬 Message notification received: {...}
Current chat: undefined, Notification from: [chatId]
✅ Showing notification for message from: User A
```

**Nếu không thấy logs này:**

- Backend chưa emit `message_notification` event
- User B chưa join chat room
- Socket connection bị lỗi

### 9. Kiểm tra Backend Logs

Backend phải có logs:

```
User [userId] connected with socket [socketId]
User [userId] joined chat [chatId]
Broadcast message to chat room
```

### 10. Các lỗi thường gặp

#### ❌ Không nhận được notification từ chat khác

**Nguyên nhân**: Backend emit `message_notification` đến `chat_${chatId}` nhưng user chưa join room

**Giải pháp**: ChatNotificationListener đã được cập nhật để tự động join tất cả chat rooms

**Kiểm tra**: Xem console có log `📩 Joined notification room for chat: xxx`

#### ❌ Notification permission denied

**Giải pháp**:

1. Chrome Settings → Privacy and Security → Site Settings → Notifications
2. Tìm localhost:5173
3. Set to "Allow"

#### ❌ Sound không phát

**Giải pháp**:

1. Đảm bảo file `/public/notification.mp3` tồn tại
2. Thử URL: http://localhost:5173/notification.mp3
3. Check browser console có lỗi không
4. Thử format khác: .wav, .ogg

#### ❌ Socket không kết nối

**Kiểm tra**:

1. Backend đang chạy ở port 8081
2. Token hợp lệ trong localStorage
3. Console có lỗi connect_error không

**Giải pháp**:

```javascript
// Check localStorage
localStorage.getItem('token')

// Check backend
curl http://localhost:8081
```

### 11. Enable Debug Mode

Để thêm timestamp vào mọi console log:

```javascript
WebSocketDebug.enableDebugMode();
```

### 12. Manual Test với Backend Events

Nếu bạn có quyền truy cập backend, test emit event thủ công:

```javascript
// In backend console or API endpoint
io.to("chat_[chatId]").emit("message_notification", {
  chatId: "[chatId]",
  senderId: "[userId]",
  senderName: "Test User",
  content: "Test message",
  timestamp: new Date(),
});
```

## Summary Checklist

- [ ] Socket connected (✅ Socket connected log)
- [ ] Notification permission granted
- [ ] Sound file exists at `/public/notification.mp3`
- [ ] ChatNotificationListener joined all chat rooms
- [ ] Backend emits `message_notification` event
- [ ] Event reaches frontend (check console)
- [ ] Toast notification shows
- [ ] Sound plays
- [ ] Browser notification shows when tab hidden

## Nếu vẫn không hoạt động

1. Check tất cả console logs (frontend + backend)
2. Verify WebSocket connection: `socket.connected === true`
3. Verify event listeners registered
4. Test với WebSocketDebug tools
5. Check backend có emit đúng event không
6. Verify user đã join đúng rooms

## Contact

Nếu vẫn gặp vấn đề sau khi check hết, cung cấp:

1. Frontend console logs
2. Backend logs
3. Network tab (WS frames)
4. Steps to reproduce
