import {useFetcher} from 'react-router';
import {useEffect, useState, useCallback, useMemo} from 'react';
import type {Notification} from '~/content/notifications';

const STORAGE_KEY = 'wakey-read-notifications';

/**
 * Get read notification IDs from localStorage
 */
function getReadIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      return new Set(parsed);
    }
  } catch {
    // Invalid JSON or storage error
  }
  return new Set();
}

/**
 * Save read notification IDs to localStorage
 */
function saveReadIds(ids: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage error (e.g., quota exceeded)
  }
}

interface NotificationsResponse {
  notifications: Notification[];
}

/**
 * Hook for managing notifications with read state tracking in localStorage.
 *
 * @returns Object with:
 * - notifications: Array of all notifications
 * - unreadCount: Number of unread notifications
 * - hasUnread: Boolean indicating if there are unread notifications
 * - markAsRead: Function to mark a specific notification as read
 * - markAllAsRead: Function to mark all notifications as read
 */
export function useNotifications() {
  const fetcher = useFetcher<NotificationsResponse>();
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds());

  // Fetch notifications on mount
  useEffect(() => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      void fetcher.load('/api/notifications');
    }
  }, [fetcher]);

  // Sync readIds from localStorage on mount (for SSR hydration)
  useEffect(() => {
    setReadIds(getReadIds());
  }, []);

  const notifications = fetcher.data?.notifications ?? [];

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.has(n.id)).length;
  }, [notifications, readIds]);

  const hasUnread = unreadCount > 0;

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    hasUnread,
    markAsRead,
    markAllAsRead,
    readIds,
    isLoading: fetcher.state === 'loading',
  };
}
