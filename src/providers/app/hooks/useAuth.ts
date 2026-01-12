import { useState, useEffect, useCallback } from 'react';
import { User, Role, NotificationCategory, Product } from '../types';
import { supabase } from '../../utils/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import * as IndexedDB from '../../utils/indexedDB';
import { STORES } from '../../utils/constants';
import { clearOfflineSession, getOfflineSession } from '../../utils/offlineAuth';
import { getSyncQueueCount } from '../../utils/syncQueue';
import logger from '../../utils/logger';
import { userService } from '../services';

interface UseAuthProps {
    clearData: () => void;
    loadData: (hasCachedData: boolean, isOnline: boolean, offlineSession: any, userProfile: User | null) => Promise<void>;
    addNotification: (notification: Omit<any, 'id' | 'timestamp' | 'read'>) => Promise<void>;
}

export const useAuth = ({ clearData, loadData, addNotification }: UseAuthProps) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProfileLoaded, setIsProfileLoaded] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const loadMinimalData = useCallback(async (user: any) => {
        try {
            logger.info('Loading minimal data as fallback...');
            const cachedUsers = await IndexedDB.getAllFromStore<User>(STORES.USERS, 2000);
            const userProfile = cachedUsers.find(u => u.id === user.id) || null;
            if (userProfile) {
                setCurrentUser(userProfile);
                setIsProfileLoaded(true);
            }
        } catch (err) {
            logger.error('Minimal data load failed:', err);
        }
    }, []);

    const loadUserProfileAndData = useCallback(async (user: any, isOnline: boolean, hasCachedData: boolean) => {
        try {
            let userProfile = null;

            if (isOnline) {
                try {
                    userProfile = await userService.fetchById(user.id);
                    if (userProfile) {
                        logger.info('Loaded user profile from server');
                    }
                } catch (err) {
                    logger.warn('Server profile fetch failed, trying cache:', err);
                }
            }

            if (!userProfile) {
                try {
                    const cachedUsers = await IndexedDB.getAllFromStore<User>(STORES.USERS, 2000);
                    userProfile = cachedUsers.find(u => u.id === user.id) || null;
                    if (userProfile) {
                        logger.info('Loaded user profile from cache');
                    }
                } catch (err) {
                    logger.warn('Cache profile fetch failed:', err);
                }
            }

            if (userProfile) {
                setCurrentUser(userProfile);
                setIsProfileLoaded(true);
            }

            // Load application data
            loadData(hasCachedData, isOnline, null, userProfile).catch(err => {
                logger.error('Data loading failed:', err);
            });

            // Check for pending offline mutations
            if (isOnline && userProfile) {
                setTimeout(async () => {
                    try {
                        const pendingCount = await getSyncQueueCount();
                        if (pendingCount > 0) {
                            await addNotification({
                                message: `يوجد ${pendingCount} عمليات غير مزامنة من الجلسات السابقة. يمكنك مزامنتها يدوياً من خلال أيقونة المزامنة`,
                                category: NotificationCategory.SYSTEM,
                                targetRoles: [userProfile.role]
                            });
                        }
                    } catch (checkError) {
                        logger.warn('Failed to check pending operations on login:', checkError);
                    }
                }, 2000);
            }
        } catch (err) {
            logger.error('Error in loadUserProfileAndData:', err);
        }
    }, [loadData, addNotification]);

    const handleLogout = useCallback(async () => {
        try {
            await clearOfflineSession();
            clearData();
            setCurrentUser(null);

            if (!navigator.onLine) {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.includes('supabase') || key.includes('auth') || key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });
            }

            const { error } = await supabase.auth.signOut();
            if (error) logger.error("Error signing out from Supabase:", error);
        } catch (error) {
            logger.error("Error during logout:", error);
        }
    }, [clearData]);

    const loadOfflineUser = useCallback(async () => {
        try {
            const offlineSession = await getOfflineSession();
            if (offlineSession) {
                const cachedUsers = await IndexedDB.getAllFromStore<User>(STORES.USERS);
                const userProfile = cachedUsers.find(u => u.id === offlineSession.userId);
                if (userProfile) {
                    setCurrentUser(userProfile);
                    setIsProfileLoaded(true);
                    await loadData(true, navigator.onLine, userProfile, userProfile);
                }
            }
        } catch (error) {
            logger.error('Error loading offline user:', error);
        }
    }, [loadData]);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
            logger.info('Auth state change:', event, 'Initial load:', isInitialLoad);

            if (event === 'SIGNED_OUT') {
                clearData();
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            if (session?.user) {
                const isOnline = navigator.onLine;
                setCurrentUser({
                    id: session.user.id,
                    username: session.user.email || 'unknown',
                    email: session.user.email || '',
                    role: Role.SALES,
                    isActive: true
                });
                setIsProfileLoaded(false);
                setLoading(false);

                getOfflineSession().then(() => {
                    const cacheCheckPromise = Promise.all([
                        IndexedDB.getAllFromStore<User>(STORES.USERS, 3000),
                        IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS, 3000)
                    ]);

                    return Promise.race([
                        cacheCheckPromise,
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Cache check timeout')), 3000)
                        )
                    ]);
                }).then(([cachedUsers, cachedProducts]) => {
                    const hasCachedData = cachedUsers.length > 0 && cachedProducts.length > 0;
                    return loadUserProfileAndData(session.user, isOnline, hasCachedData);
                }).catch(err => {
                    logger.warn('Background session/data loading failed:', err);
                    return loadMinimalData(session.user);
                });

                if (isInitialLoad) setIsInitialLoad(false);
            } else {
                const offlineSession = await getOfflineSession();

                if (offlineSession) {
                    try {
                        const offlineUserPromise = IndexedDB.getAllFromStore<User>(STORES.USERS);
                        const cachedUsers = await offlineUserPromise;
                        const userProfile = cachedUsers.find(u => u.id === offlineSession.userId) || null;

                        if (userProfile) {
                            setCurrentUser(userProfile);
                            await loadData(true, navigator.onLine, offlineSession, userProfile);
                        } else {
                            await clearOfflineSession();
                        }
                    } catch (err) {
                        logger.error('Error restoring offline session:', err);
                        await clearOfflineSession();
                    }
                } else {
                    clearData();
                    setCurrentUser(null);
                }

                setLoading(false);
                setIsInitialLoad(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [clearData, isInitialLoad, loadData, loadUserProfileAndData, loadMinimalData]);

    return {
        currentUser,
        setCurrentUser,
        loading,
        setLoading,
        error,
        setError,
        isProfileLoaded,
        setIsProfileLoaded,
        isInitialLoad,
        setIsInitialLoad,
        handleLogout,
        loadOfflineUser
    };
};
