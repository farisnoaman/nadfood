/**
 * Encryption Utilities for Sync Data
 * Provides AES-GCM encryption/decryption for sensitive data storage
 */

import logger from './logger';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12, // 96 bits for GCM
};

// Storage keys
const ENCRYPTION_KEY_KEY = 'encryption_key';
const KEY_CREATED_KEY = 'key_created_at';



/**
 * Generate a new encryption key
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ENCRYPTION_CONFIG.ALGORITHM,
      length: ENCRYPTION_CONFIG.KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export key to base64 string
 */
async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import key from base64 string
 */
async function importKey(keyData: string): Promise<CryptoKey> {
  const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    ENCRYPTION_CONFIG.ALGORITHM,
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create encryption key
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  try {
    // Check if Web Crypto API is available
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    // Check if we have a stored key
    const storedKeyData = localStorage.getItem(ENCRYPTION_KEY_KEY);
    const keyCreated = localStorage.getItem(KEY_CREATED_KEY);

    if (storedKeyData && keyCreated) {
      const keyAge = Date.now() - parseInt(keyCreated);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      if (keyAge < maxAge) {
        // Key is still valid
        return await importKey(storedKeyData);
      } else {
        // Key is too old, generate new one
        logger.info('Encryption key expired, generating new key');
        localStorage.removeItem(ENCRYPTION_KEY_KEY);
        localStorage.removeItem(KEY_CREATED_KEY);
      }
    }

    // Generate new key
    const newKey = await generateEncryptionKey();
    const exportedKey = await exportKey(newKey);



    localStorage.setItem(ENCRYPTION_KEY_KEY, exportedKey);
    localStorage.setItem(KEY_CREATED_KEY, Date.now().toString());

    logger.info('New encryption key generated and stored');
    return newKey;

  } catch (error) {
    logger.error('Error managing encryption key:', error);
    // Return a fallback that throws an error for all operations
    throw new Error('Failed to initialize encryption');
  }
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH));
}

/**
 * Encrypt data
 */
export async function encryptData(data: any): Promise<string> {
  try {
    // Check if encryption is available
    if (!crypto || !crypto.subtle) {
      logger.warn('Web Crypto API not available, storing data unencrypted');
      return JSON.stringify({ unencrypted: true, data });
    }

    const key = await getEncryptionKey();
    const iv = generateIV();

    // Convert data to JSON string
    const dataString = JSON.stringify(data);
    const encodedData = new TextEncoder().encode(dataString);

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv: iv as any,
      },
      key,
      encodedData as any
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));

  } catch (error) {
    logger.error('Error encrypting data:', error);
    // Fallback: return unencrypted data with marker
    logger.warn('Encryption failed, storing data unencrypted as fallback');
    return JSON.stringify({ unencrypted: true, data });
  }
}

/**
 * Decrypt data
 */
export async function decryptData(encryptedData: string): Promise<any> {
  try {
    // Check if data is unencrypted fallback
    try {
      const parsed = JSON.parse(encryptedData);
      if (parsed.unencrypted && parsed.data) {
        logger.debug('Decrypting unencrypted fallback data');
        return parsed.data;
      }
    } catch {
      // Not JSON, continue with normal decryption
    }

    // Check if Web Crypto API is available
    if (!crypto || !crypto.subtle) {
      logger.warn('Web Crypto API not available, cannot decrypt data');
      throw new Error('Web Crypto API not available');
    }

    const key = await getEncryptionKey();

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, ENCRYPTION_CONFIG.IV_LENGTH);
    const encrypted = combined.slice(ENCRYPTION_CONFIG.IV_LENGTH);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );

    // Convert back to object
    const dataString = new TextDecoder().decode(decrypted);
    return JSON.parse(dataString);

  } catch (error) {
    logger.error('Error decrypting data:', error);
    // If decryption fails, try to return the original data if it's valid JSON
    try {
      return JSON.parse(encryptedData);
    } catch {
      throw new Error('Failed to decrypt data and data is not valid JSON');
    }
  }
}

/**
 * Check if data is encrypted (simple check)
 */
export function isEncrypted(data: string): boolean {
  try {
    // Try to decode as base64 and check length
    const decoded = atob(data);
    return decoded.length > ENCRYPTION_CONFIG.IV_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Clear encryption keys (for logout or reset)
 */
export function clearEncryptionKeys(): void {
  try {
    localStorage.removeItem(ENCRYPTION_KEY_KEY);
    localStorage.removeItem(KEY_CREATED_KEY);
    logger.info('Encryption keys cleared');
  } catch (error) {
    logger.error('Error clearing encryption keys:', error);
  }
}

/**
 * Get encryption status for debugging
 */
export function getEncryptionStatus(): { hasKey: boolean; keyAge?: number; keyVersion?: number } {
  try {
    const hasKey = !!localStorage.getItem(ENCRYPTION_KEY_KEY);
    const keyCreated = localStorage.getItem(KEY_CREATED_KEY);

    if (hasKey && keyCreated) {
      const keyAge = Date.now() - parseInt(keyCreated);
      return { hasKey: true, keyAge, keyVersion: 1 };
    }

    return { hasKey: false };
  } catch (error) {
    logger.error('Error getting encryption status:', error);
    return { hasKey: false };
  }
}