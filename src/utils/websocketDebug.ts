/**
 * Debug utility for testing WebSocket notifications
 * Open browser console and use these commands to test
 */

// Test 1: Check if socket is connected
export const checkSocketConnection = (socket: any) => {
  if (!socket) {
    console.error("❌ Socket is null");
    return false;
  }
  
  console.log("✅ Socket exists:", socket.id);
  console.log("Connected:", socket.connected);
  console.log("Socket object:", socket);
  return true;
};

// Test 2: Check notification permission
export const checkNotificationPermission = () => {
  console.log("🔔 Notification permission:", Notification.permission);
  
  if (Notification.permission === "default") {
    console.log("⚠️ Need to request permission");
    Notification.requestPermission().then(perm => {
      console.log("New permission:", perm);
    });
  } else if (Notification.permission === "denied") {
    console.error("❌ Notification permission denied by user");
  } else {
    console.log("✅ Notification permission granted");
  }
};

// Test 3: Test notification sound
export const testNotificationSound = () => {
  console.log("🔊 Testing notification sound...");
  const audio = new Audio("/notification.mp3");
  audio.volume = 0.5;
  audio.play()
    .then(() => console.log("✅ Sound played successfully"))
    .catch(err => console.error("❌ Sound error:", err));
};

// Test 4: Test browser notification
export const testBrowserNotification = () => {
  if (Notification.permission !== "granted") {
    console.error("❌ Notification permission not granted");
    return;
  }
  
  console.log("📬 Creating test notification...");
  const notification = new Notification("Test Notification", {
    body: "This is a test message from MarketPlace",
    icon: "/default-avatar.png",
    badge: "/logo.png",
  });
  
  notification.onclick = () => {
    console.log("Notification clicked");
    notification.close();
  };
  
  setTimeout(() => notification.close(), 5000);
  console.log("✅ Notification created");
};

// Test 5: Check socket listeners
export const checkSocketListeners = (socket: any) => {
  if (!socket) {
    console.error("❌ Socket is null");
    return;
  }
  
  console.log("🎧 Socket event listeners:");
  const eventNames = ['new_message', 'message_notification', 'user_typing', 'contact_status_update', 'chat_list_update'];
  
  eventNames.forEach(eventName => {
    const listeners = socket.listeners(eventName);
    console.log(`  ${eventName}:`, listeners.length, "listener(s)");
  });
};

// Test 6: Emit test message notification
export const emitTestNotification = (socket: any, chatId: string) => {
  if (!socket || !socket.connected) {
    console.error("❌ Socket not connected");
    return;
  }
  
  console.log("📤 Emitting test notification for chat:", chatId);
  
  // This won't work because we can't emit to server like this,
  // but it shows the structure
  console.log("Note: This needs to be triggered from backend");
  console.log("Expected event structure:");
  console.log({
    chatId: chatId,
    senderId: "test-user-id",
    senderName: "Test User",
    content: "Test message",
    timestamp: new Date()
  });
};

// Test 7: Log all console messages for debugging
export const enableDebugMode = () => {
  console.log("🐛 Debug mode enabled");
  
  // Store original console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Override console.log to add timestamps
  console.log = (...args: any[]) => {
    originalLog(new Date().toLocaleTimeString(), ...args);
  };
  
  console.error = (...args: any[]) => {
    originalError(new Date().toLocaleTimeString(), "ERROR:", ...args);
  };
  
  console.warn = (...args: any[]) => {
    originalWarn(new Date().toLocaleTimeString(), "WARN:", ...args);
  };
  
  console.log("✅ Debug mode active - all logs now have timestamps");
};

// Export debug object for console access
if (typeof window !== 'undefined') {
  (window as any).WebSocketDebug = {
    checkSocketConnection,
    checkNotificationPermission,
    testNotificationSound,
    testBrowserNotification,
    checkSocketListeners,
    emitTestNotification,
    enableDebugMode,
  };
  
  console.log("🛠️ WebSocket Debug Tools loaded!");
  console.log("Available commands:");
  console.log("  WebSocketDebug.checkSocketConnection(socket)");
  console.log("  WebSocketDebug.checkNotificationPermission()");
  console.log("  WebSocketDebug.testNotificationSound()");
  console.log("  WebSocketDebug.testBrowserNotification()");
  console.log("  WebSocketDebug.checkSocketListeners(socket)");
  console.log("  WebSocketDebug.enableDebugMode()");
}

export default {
  checkSocketConnection,
  checkNotificationPermission,
  testNotificationSound,
  testBrowserNotification,
  checkSocketListeners,
  emitTestNotification,
  enableDebugMode,
};
