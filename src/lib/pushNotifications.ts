/**
 * Web Push Notification Client Helper
 * Portable across any standard web host (Vercel, Netlify, Cloudflare Pages, VPS, AWS, etc.)
 */

// Helper to convert base64 VAPID key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscription: PushSubscription | null;
}

/**
 * Register the Service Worker located in /public/sw.js
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service workers are not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Push] Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[Push] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Check the current push notification capability and permission state
 */
export async function checkPushStatus(): Promise<PushStatus> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) {
    return { supported: false, permission: 'denied', subscribed: false, subscription: null };
  }

  const permission = Notification.permission;
  let subscription: PushSubscription | null = null;

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      subscription = await reg.pushManager.getSubscription();
    }
  } catch (err) {
    console.warn('[Push] Error checking subscription:', err);
  }

  return {
    supported: true,
    permission,
    subscribed: Boolean(subscription),
    subscription,
  };
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Subscribe user to Web Push notifications.
 * If VITE_VAPID_PUBLIC_KEY is provided in .env, it subscribes to remote server push.
 */
export async function subscribeToPush(vapidPublicKey?: string): Promise<PushSubscription | null> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    throw new Error('Notification permission was not granted by user.');
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error('Service Worker is not registered.');
  }

  const key = vapidPublicKey || (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined);

  if (key) {
    const convertedKey = urlBase64ToUint8Array(key);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as BufferSource,
    });
    return subscription;
  } else {
    // If no VAPID key is configured yet, local background notifications still work via service worker
    console.log('[Push] No VAPID key set. Local background notification capabilities are active.');
    return null;
  }
}

/**
 * Dispatch an instant background notification via the service worker
 */
export async function showLocalPushNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) {
    await reg.showNotification(title, {
      icon: '/favicon.png',
      badge: '/favicon.svg',
      ...options,
    });
  } else {
    // Fallback to window Notification
    new Notification(title, options);
  }
}
