/**
 * Enhanced Offline Authentication Hook
 * Provides comprehensive offline authentication functionality
 */

import { useState, useEffect, useCallback } from 'react';
import {
  hasOfflineCredentials,
  shouldReauthenticateOnline,
  clearOfflineSession,
  getOfflineSession,
  validateOfflineCredentials,
  createOfflineSession
} from '../utils/offlineAuth';

interface OfflineAuthState {
  isOffline: boolean;
  hasStoredCredentials: boolean;
  hasOfflineSession: boolean;
  showReauthWarning: boolean;
  lastOnlineLogin: string | null;
  offlineSessionExpiry: string | null;
}

interface UseOfflineAuthReturn extends OfflineAuthState {
  validateCredentials: (email: string, password: string) => Promise<{ valid: boolean; userId?: string; userProfile?: any }>;
  createSession: (userId: string, email: string) => Promise<void>;
  clearSession: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useOfflineAuth = (): UseOfflineAuthReturn => {
  const [state, setState] = useState<OfflineAuthState>({
    isOffline: !navigator.onLine,
    hasStoredCredentials: false,
    hasOfflineSession: false,
    showReauthWarning: false,
    lastOnlineLogin: null,
    offlineSessionExpiry: null,
  });

  const refreshStatus = useCallback(async () => {
    try {
      const [
        hasCredentials,
        offlineSession,
        shouldReauth
      ] = await Promise.all([
        hasOfflineCredentials(),
        getOfflineSession(),
        shouldReauthenticateOnline()
      ]);

      setState(prev => ({
        ...prev,
        isOffline: !navigator.onLine,
        hasStoredCredentials: hasCredentials,
        hasOfflineSession: !!offlineSession,
        showReauthWarning: shouldReauth && navigator.onLine,
        offlineSessionExpiry: offlineSession?.expiresAt || null,
      }));
    } catch (error) {
      console.error('Error refreshing offline auth status:', error);
    }
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setState(prev => ({ ...prev, isOffline: !navigator.onLine }));
    };

    // Initial status check
    refreshStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Periodic status refresh (every 30 seconds)
    const interval = setInterval(refreshStatus, 30000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, [refreshStatus]);

  const validateCredentials = useCallback(async (email: string, password: string) => {
    try {
      const validation = await validateOfflineCredentials(email, password);
      
      if (validation.valid) {
        // Update status after successful validation
        await refreshStatus();
      }
      
      return validation;
    } catch (error) {
      console.error('Error validating offline credentials:', error);
      return { valid: false };
    }
  }, [refreshStatus]);

  const createSession = useCallback(async (userId: string, email: string) => {
    try {
      await createOfflineSession(userId, email);
      await refreshStatus();
    } catch (error) {
      console.error('Error creating offline session:', error);
      throw error;
    }
  }, [refreshStatus]);

  const clearSession = useCallback(async () => {
    try {
      await clearOfflineSession();
      await refreshStatus();
    } catch (error) {
      console.error('Error clearing offline session:', error);
      throw error;
    }
  }, [refreshStatus]);

  return {
    ...state,
    validateCredentials,
    createSession,
    clearSession,
    refreshStatus,
  };
};

export default useOfflineAuth;