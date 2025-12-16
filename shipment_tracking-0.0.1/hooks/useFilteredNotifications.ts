/**
 * Shared Notification Filtering Hook
 * Fix for M-07: Extract notification filtering logic to prevent inconsistency
 */

import { useMemo } from 'react';
import { Notification, NotificationCategory, User } from '../types';

interface UseFilteredNotificationsProps {
  notifications: Notification[];
  currentUser: User | null;
  filter?: NotificationCategory | 'all';
  settings?: Record<NotificationCategory, boolean>;
  includeRead?: boolean;
}

/**
 * Filter notifications based on user role, category filter, and settings
 * This hook centralizes notification filtering logic to prevent inconsistencies
 */
export const useFilteredNotifications = ({
  notifications,
  currentUser,
  filter = 'all',
  settings,
  includeRead = false,
}: UseFilteredNotificationsProps) => {
  return useMemo(() => {
    if (!currentUser) return [];

    return notifications.filter(notification => {
      // Filter out read notifications unless explicitly included
      if (!includeRead && notification.read) return false;

      // Apply notification settings (if user has disabled certain categories)
      if (settings && !settings[notification.category]) return false;

      // Check if notification is for this user's role
      const roleMatch = notification.targetRoles?.includes(currentUser.role);

      // Check if notification is for this specific user
      const userMatch = notification.targetUserIds?.includes(currentUser.id);

      // Notification must match either role or user
      if (!roleMatch && !userMatch) return false;

      // Apply category filter
      const categoryMatch = filter === 'all' || notification.category === filter;

      return categoryMatch;
    });
  }, [notifications, currentUser, filter, settings, includeRead]);
};

/**
 * Get unread notification count
 */
export const useUnreadNotificationCount = (
  notifications: Notification[],
  currentUser: User | null,
  settings?: Record<NotificationCategory, boolean>
): number => {
  const unreadNotifications = useFilteredNotifications({
    notifications,
    currentUser,
    settings,
    includeRead: false,
  });

  return unreadNotifications.length;
};
