import { NotificationItem } from '../types';

const NOTIFIED_CACHE_KEY = 'rosxsa_desktop_notified_ids';

export function isDesktopNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getDesktopNotificationPermission(): NotificationPermission {
  if (!isDesktopNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (!isDesktopNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting desktop notification permission:', e);
    return 'denied';
  }
}

function getAlreadyNotifiedIds(): Set<string> {
  try {
    const saved = sessionStorage.getItem(NOTIFIED_CACHE_KEY);
    if (!saved) return new Set();
    return new Set(JSON.parse(saved));
  } catch (e) {
    return new Set();
  }
}

function markNotifiedId(id: string): void {
  try {
    const existing = getAlreadyNotifiedIds();
    existing.add(id);
    sessionStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(Array.from(existing)));
  } catch (e) {}
}

export function triggerDesktopAlert(
  title: string,
  body: string,
  tag?: string,
  onClick?: () => void
): boolean {
  if (!isDesktopNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notification = new Notification(title, {
      body,
      tag: tag || `rosxsa-${Date.now()}`,
      icon: '/vite.svg',
      badge: '/vite.svg',
      silent: false,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      if (onClick) {
        onClick();
      }
      notification.close();
    };

    return true;
  } catch (e) {
    console.error('Failed to trigger desktop notification:', e);
    return false;
  }
}

export function checkAndFireDesktopNotifications(
  notifications: NotificationItem[],
  isAdmin: boolean,
  onOpenDrawer?: () => void
): void {
  if (!isDesktopNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const notifiedIds = getAlreadyNotifiedIds();

  const unreadAlerts = notifications.filter((n) => {
    if (n.isRead) return false;
    if (!isAdmin && n.type === 'meeting_approval') return false;
    return !notifiedIds.has(n.id);
  });

  if (unreadAlerts.length === 0) return;

  unreadAlerts.forEach((alert) => {
    markNotifiedId(alert.id);

    let title = 'ROSxSA Portal Alert';
    if (alert.type === 'invoice_overdue') {
      title = `⚠️ Overdue Invoice: ${alert.title}`;
    } else if (alert.type === 'meeting_approval') {
      title = `📋 Action Required: ${alert.title}`;
    }

    triggerDesktopAlert(title, alert.message, alert.id, onOpenDrawer);
  });
}
