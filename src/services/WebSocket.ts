// src/services/chatSocket.ts
import io, { Socket } from 'socket.io-client';

class ChatSocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  // ✅ Kết nối WebSocket
  connect(token: string, userId: string) {
    this.currentUserId = userId;
    
    this.socket = io('http://localhost:8081', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    return this.socket;
  }

  // ✅ Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ================== EMIT EVENTS (Gửi đi) ==================

  // 🚀 Join chat room
  joinChat(chatId: string) {
    this.socket?.emit('join_chat', chatId);
    console.log('🔵 Joined chat:', chatId);
  }

  // 🚀 Leave chat room
  leaveChat(chatId: string) {
    this.socket?.emit('leave_chat', chatId);
    console.log('🔴 Left chat:', chatId);
  }

  // 🚀 Gửi tin nhắn real-time (sau khi đã lưu DB qua REST API)
  sendMessageRealtime(chatId: string, message: any) {
    this.socket?.emit('send_message', {
      chatId,
      message
    });
  }

  // 🚀 Typing indicator
  emitTyping(chatId: string) {
    this.socket?.emit('typing', { chatId, userId: this.currentUserId });
  }

  // 🚀 Stop typing
  emitStopTyping(chatId: string) {
    this.socket?.emit('stop_typing', { chatId, userId: this.currentUserId });
  }

  // 🚀 Message read
  emitMessageRead(chatId: string, messageId: string) {
    this.socket?.emit('message_read', { chatId, messageId });
  }

  // ================== LISTEN EVENTS (Nhận về) ==================

  // 📨 Nhận tin nhắn mới
  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }

  // 📨 Nhận typing indicator
  onUserTyping(callback: (data: { userId: string; chatId: string; userName: string }) => void) {
    this.socket?.on('user_typing', callback);
  }

  // 📨 Nhận stop typing
  onUserStopTyping(callback: (data: { userId: string; chatId: string }) => void) {
    this.socket?.on('user_stop_typing', callback);
  }

  // 📨 User online
  onUserOnline(callback: (data: { userId: string; timestamp: Date }) => void) {
    this.socket?.on('user_online', callback);
  }

  // 📨 User offline
  onUserOffline(callback: (data: { userId: string; timestamp: Date }) => void) {
    this.socket?.on('user_offline', callback);
  }

  // 📨 Message read
  onMessageRead(callback: (data: { messageId: string; chatId: string; readAt: Date }) => void) {
    this.socket?.on('message_read', callback);
  }

  // 📨 Contact status update
  onContactStatusUpdate(callback: (data: { userId: string; chatId: string; isOnline: boolean }) => void) {
    this.socket?.on('contact_status_update', callback);
  }

  // 📨 User status update (global)
  onUserStatusUpdate(callback: (data: { userId: string; isOnline: boolean }) => void) {
    this.socket?.on('user_status_update', callback);
  }

  // ================== REMOVE LISTENERS ==================

  off(event: string, callback?: Function) {
    this.socket?.off(event, callback as any);
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new ChatSocketService();