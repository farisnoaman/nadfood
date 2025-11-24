/**
 * Offline Authentication Service
 * Handles credential storage and validation for offline login
 */

import { initDB, getFromStore, saveToStore, deleteFromStore, STORES, getMetadata, setMetadata } from './indexedDB';

// Store name for auth data
const AUTH_STORE = STORES.SETTINGS;

// Keys for auth data
const AUTH_KEYS = {
  CREDENTIALS: 'offline_credentials',
  SESSION: 'offline_session',
  LAST_ONLINE_LOGIN: 'last_online_login',
  USER_PROFILE: 'cached_user_profile',
};

// Types
export interface OfflineCredentials {
  key: string;
  email: string;
  passwordHash: string;
  userId: string;
  createdAt: string;
  lastUsed: string;
}

export interface OfflineSession {
  key: string;
  userId: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface CachedUserProfile {
  key: string;
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

/**
 * Simple hash function for password (not cryptographically secure, but sufficient for offline validation)
 * In production, use Web Crypto API for better security
 */
const hashPassword = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Store credentials after successful online login
 */
export const storeOfflineCredentials = async (
  email: string,
  password: string,
  userId: string,
  userProfile: any
): Promise<void> => {
  try {
    await initDB();
    
    // Create password hash with email as salt
    const passwordHash = await hashPassword(password, email.toLowerCase());
    
    const credentials: OfflineCredentials = {
      key: AUTH_KEYS.CREDENTIALS,
      email: email.toLowerCase(),
      passwordHash,
      userId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };
    
    await saveToStore(AUTH_STORE, credentials);
    
    // Store user profile for offline use
    const cachedProfile: CachedUserProfile = {
      key: AUTH_KEYS.USER_PROFILE,
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      role: userProfile.role,
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at || new Date().toISOString(),
    };
    
    await saveToStore(AUTH_STORE, cachedProfile);
    
    // Record last online login
    await setMetadata(AUTH_KEYS.LAST_ONLINE_LOGIN, new Date().toISOString());
    
    console.log('Offline credentials stored successfully');
  } catch (error) {
    console.error('Error storing offline credentials:', error);
    throw error;
  }
};

/**
 * Validate credentials for offline login
 */
export const validateOfflineCredentials = async (
  email: string,
  password: string
): Promise<{ valid: boolean; userId?: string; userProfile?: CachedUserProfile }> => {
  try {
    await initDB();
    
    const credentials = await getFromStore<OfflineCredentials>(AUTH_STORE, AUTH_KEYS.CREDENTIALS);
    
    if (!credentials) {
      console.log('No offline credentials found');
      return { valid: false };
    }
    
    // Check if email matches (case insensitive)
    if (credentials.email !== email.toLowerCase()) {
      console.log('Email mismatch:', { stored: credentials.email, provided: email.toLowerCase() });
      return { valid: false };
    }
    
    // Validate password hash
    const passwordHash = await hashPassword(password, email.toLowerCase());
    
    if (credentials.passwordHash !== passwordHash) {
      console.log('Password hash mismatch');
      return { valid: false };
    }
    
    // Update last used timestamp
    credentials.lastUsed = new Date().toISOString();
    await saveToStore(AUTH_STORE, credentials);
    
    // Get cached user profile
    const userProfile = await getFromStore<CachedUserProfile>(AUTH_STORE, AUTH_KEYS.USER_PROFILE);
    
    console.log('Offline credentials validated successfully', { userId: credentials.userId });
    
    return {
      valid: true,
      userId: credentials.userId,
      userProfile: userProfile || undefined,
    };
  } catch (error) {
    console.error('Error validating offline credentials:', error);
    return { valid: false };
  }
};

/**
 * Create offline session after successful offline login
 */
export const createOfflineSession = async (userId: string, email: string): Promise<void> => {
  try {
    await initDB();
    
    // Session expires in 30 days for offline use
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const session: OfflineSession = {
      key: AUTH_KEYS.SESSION,
      userId,
      email,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    await saveToStore(AUTH_STORE, session);
    console.log('Offline session created successfully', { userId, email, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('Error creating offline session:', error);
    throw error;
  }
};

/**
 * Get current offline session
 */
export const getOfflineSession = async (): Promise<OfflineSession | null> => {
  try {
    await initDB();
    
    const session = await getFromStore<OfflineSession>(AUTH_STORE, AUTH_KEYS.SESSION);
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await clearOfflineSession();
      return null;
    }
    
    return session.isActive ? session : null;
  } catch (error) {
    console.error('Error getting offline session:', error);
    return null;
  }
};

/**
 * Get cached user profile
 */
export const getCachedUserProfile = async (): Promise<CachedUserProfile | null> => {
  try {
    await initDB();
    return await getFromStore<CachedUserProfile>(AUTH_STORE, AUTH_KEYS.USER_PROFILE);
  } catch (error) {
    console.error('Error getting cached user profile:', error);
    return null;
  }
};

/**
 * Clear offline session (logout)
 */
export const clearOfflineSession = async (): Promise<void> => {
  try {
    await initDB();
    
    const session = await getFromStore<OfflineSession>(AUTH_STORE, AUTH_KEYS.SESSION);
    
    if (session) {
      session.isActive = false;
      await saveToStore(AUTH_STORE, session);
    }
    
    console.log('Offline session cleared');
  } catch (error) {
    console.error('Error clearing offline session:', error);
  }
};

/**
 * Clear all offline auth data (full logout)
 * Note: This preserves app data but clears credentials
 */
export const clearOfflineAuth = async (): Promise<void> => {
  try {
    await initDB();
    
    await deleteFromStore(AUTH_STORE, AUTH_KEYS.CREDENTIALS);
    await deleteFromStore(AUTH_STORE, AUTH_KEYS.SESSION);
    await deleteFromStore(AUTH_STORE, AUTH_KEYS.USER_PROFILE);
    
    console.log('Offline auth data cleared');
  } catch (error) {
    console.error('Error clearing offline auth:', error);
  }
};

/**
 * Check if offline credentials exist
 */
export const hasOfflineCredentials = async (): Promise<boolean> => {
  try {
    await initDB();
    const credentials = await getFromStore<OfflineCredentials>(AUTH_STORE, AUTH_KEYS.CREDENTIALS);
    return credentials !== null;
  } catch (error) {
    console.error('Error checking offline credentials:', error);
    return false;
  }
};

/**
 * Get last online login timestamp
 */
export const getLastOnlineLogin = async (): Promise<string | null> => {
  try {
    return await getMetadata<string | null>(AUTH_KEYS.LAST_ONLINE_LOGIN, null);
  } catch (error) {
    console.error('Error getting last online login:', error);
    return null;
  }
};

/**
 * Check if user should re-authenticate online
 * Returns true if last online login was more than 7 days ago
 */
export const shouldReauthenticateOnline = async (): Promise<boolean> => {
    try {
        const lastOnlineLogin = await getLastOnlineLogin();

        if (!lastOnlineLogin) {
            return true;
        }

        const lastLogin = new Date(lastOnlineLogin);
        const now = new Date();
        const daysSinceLastLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

        return daysSinceLastLogin > 7;
    } catch (error) {
        console.error('Error checking reauth requirement:', error);
        return false;
    }
};

/**
 * Check if offline session should be cleared on app launch
 * Returns true if app is online (should clear offline session for security)
 */
export const shouldClearOfflineSessionOnLaunch = async (): Promise<boolean> => {
    // Always clear offline session when app launches online for security
    // This prevents automatic login bypass when reopening app online
    return navigator.onLine;
};
