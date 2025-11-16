# Notification Sound Setup

## Required Files

Place these files in the `/public` folder:

1. **notification.mp3** - Sound that plays when new message arrives

   - Format: MP3
   - Recommended duration: 1-2 seconds
   - Recommended volume: moderate (not too loud)
   - You can download free notification sounds from:
     - https://notificationsounds.com/
     - https://freesound.org/
     - https://mixkit.co/free-sound-effects/notification/

2. **default-avatar.png** - Default avatar for users without profile picture

   - Format: PNG
   - Recommended size: 200x200px

3. **logo.png** - App logo for notification badge
   - Format: PNG
   - Recommended size: 64x64px

## Alternative: Use Online Assets

If you don't want to host files locally, you can use URLs in the code:

```typescript
// In ChatDetailPage.tsx and ChatNotificationListener.tsx
const audio = new Audio("https://example.com/your-notification-sound.mp3");
```

## Testing Notifications

1. Allow notification permission when prompted
2. Open chat in two different browser tabs/windows
3. Send message from one tab
4. Check if notification appears in the other tab
5. Test both:
   - Browser notifications (when tab not focused)
   - In-app toast notifications (SweetAlert2)
