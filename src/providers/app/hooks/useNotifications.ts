import { useState, useCallback } from 'react';
import { Notification, User } from '../types';
import { notificationService } from '../services';

export const useNotifications = (isOnline: boolean, currentUser: User | null) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        await notificationService.create(notification, isOnline, currentUser?.companyId);
    }, [isOnline, currentUser?.companyId]);

    const markNotificationAsRead = useCallback(async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        await notificationService.markAsRead(notificationId, isOnline);
    }, [isOnline]);

    const markAllNotificationsAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read: true } : n));
        await notificationService.markAllAsRead(isOnline);
    }, [notifications, isOnline]);

    return {
        notifications,
        setNotifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead
    };
};
