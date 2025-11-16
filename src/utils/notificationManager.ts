/**
 * Utility functions for managing chat notifications
 */

export class NotificationManager {
  private static notificationSound: HTMLAudioElement | null = null;
  private static permission: NotificationPermission = Notification.permission;

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (this.permission === "default") {
      this.permission = await Notification.requestPermission();
    }
    return this.permission;
  }

  /**
   * Check if notifications are enabled
   */
  static isEnabled(): boolean {
    return this.permission === "granted";
  }

  /**
   * Show browser notification
   */
  static showNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      onClick?: () => void;
      autoClose?: number;
    }
  ): void {
    if (!this.isEnabled()) {
      console.log("Notifications not enabled");
      return;
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || "/default-avatar.png",
      badge: options.badge || "/logo.png",
      tag: options.tag || `notification-${Date.now()}`,
      requireInteraction: false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    // Auto close
    const closeDelay = options.autoClose || 5000;
    setTimeout(() => notification.close(), closeDelay);
  }

  /**
   * Play notification sound
   */
  static playSound(volume: number = 0.5): void {
    try {
      if (!this.notificationSound) {
        this.notificationSound = new Audio("/notification.mp3");
      }
      this.notificationSound.volume = Math.max(0, Math.min(1, volume));
      this.notificationSound.currentTime = 0;
      this.notificationSound.play().catch((err) => {
        console.log("Could not play notification sound:", err);
      });
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }

  /**
   * Show message notification (combines browser notification + sound)
   */
  static showMessageNotification(
    senderName: string,
    message: string,
    options?: {
      avatar?: string;
      chatId?: string;
      onlyWhenHidden?: boolean;
      onClick?: () => void;
    }
  ): void {
    const shouldShow = !options?.onlyWhenHidden || document.hidden;

    if (shouldShow && this.isEnabled()) {
      this.showNotification(`Tin nhắn mới từ ${senderName}`, {
        body: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
        icon: options?.avatar,
        tag: options?.chatId ? `chat-${options.chatId}` : undefined,
        onClick: options?.onClick,
      });
    }

    // Always play sound for new messages
    this.playSound(0.3);
  }

  /**
   * Check if tab/window is hidden
   */
  static isTabHidden(): boolean {
    return document.hidden;
  }

  /**
   * Add visibility change listener
   */
  static onVisibilityChange(callback: (isHidden: boolean) => void): () => void {
    const handler = () => callback(document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }
}

export default NotificationManager;
