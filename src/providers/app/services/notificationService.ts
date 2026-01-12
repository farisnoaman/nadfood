/**
 * Notification service - CRUD operations for notifications
 */

import { supabase } from '../../../utils/supabaseClient';
import { Notification } from '../../../types';
import { notificationFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const notificationService = {
    async fetchAll(signal?: AbortSignal): Promise<Notification[]> {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('timestamp', { ascending: false });

        if (signal) {
            query = query.abortSignal(signal);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching notifications:', error);
            throw error;
        }

        return (data || []).map(notificationFromRow);
    },

    async create(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, isOnline: boolean): Promise<void> {
        const notificationData = {
            id: window.crypto.randomUUID(),
            message: notification.message,
            category: notification.category,
            target_roles: notification.targetRoles,
            target_user_ids: notification.targetUserIds,
            timestamp: new Date().toISOString(),
            read: false,
        };

        if (isOnline) {
            const { error } = await supabase
                .from('notifications')
                .insert([notificationData]);

            if (error) {
                logger.error('Error adding notification:', error);
                throw error;
            }
        } else {
            const tempId = notificationData.id;
            const tempNotification: Notification = {
                id: tempId,
                ...notification,
                timestamp: notificationData.timestamp,
                read: false,
            };
            await IndexedDB.saveToStore(STORES.NOTIFICATIONS, tempNotification);
            await IndexedDB.addToMutationQueue({
                type: 'INSERT',
                table: 'notifications',
                data: notificationData,
                tempId,
            });
        }
    },

    async markAsRead(notificationId: string, isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) {
                logger.error('Error marking notification as read:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'UPDATE',
                table: 'notifications',
                id: notificationId,
                data: { read: true },
            });
        }
    },

    async markAllAsRead(isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('read', false);

            if (error) {
                logger.error('Error marking all notifications as read:', error);
                throw error;
            }
        } else {
            // Queue mutation for all unread notifications
            const notifications = await IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS);
            const unreadNotifications = notifications.filter(n => !n.read);

            for (const notification of unreadNotifications) {
                await IndexedDB.addToMutationQueue({
                    type: 'UPDATE',
                    table: 'notifications',
                    id: notification.id,
                    data: { read: true },
                });
            }
        }
    },
};
