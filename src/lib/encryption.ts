/**
 * Simple encryption utility for API keys using Web Crypto API
 * Uses AES-GCM encryption with a key derived from a static secret and browser fingerprint
 */

// Static secret for key derivation (in production, this should be environment-specific)
const ENCRYPTION_SECRET = 'ddl-tool-encryption-key-2025';

// Generate a consistent key based on browser characteristics and static secret
async function generateEncryptionKey(): Promise<CryptoKey> {
  // Create a fingerprint from browser characteristics
  const fingerprint = [
    new Date().getTimezoneOffset().toString(),
    ENCRYPTION_SECRET
  ].join('|');

  // Create key material from fingerprint
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(fingerprint),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('ddl-tool-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt a string using AES-GCM
 */
export async function encryptApiKey(plaintext: string): Promise<string> {
  if (!plaintext) return '';

  try {
    const key = await generateEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 with prefix to identify encrypted data
    return 'encrypted:' + btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return plaintext; // Return original on failure
  }
}

/**
 * Decrypt a string using AES-GCM
 * Provides backward compatibility with unencrypted API keys
 */
export async function decryptApiKey(encryptedText: string): Promise<string> {
  if (!encryptedText) return '';

  // Check if it's encrypted data - backward compatibility for existing unencrypted keys
  if (!encryptedText.startsWith('encrypted:')) {
    return encryptedText; // Return as-is if not encrypted (backward compatibility)
  }

  try {
    const key = await generateEncryptionKey();
    
    // Remove prefix and decode base64
    const base64Data = encryptedText.substring('encrypted:'.length);
    const combined = new Uint8Array(
      atob(base64Data).split('').map(char => char.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return ''; // Return empty string on decryption failure
  }
}

/**
 * Check if a string is encrypted
 */
export function isEncrypted(text: string): boolean {
  return text.startsWith('encrypted:');
}

/**
 * Utility function to safely handle API key encryption/decryption
 */
export class ApiKeyManager {
  static async encryptForStorage(apiKey: string): Promise<string> {
    return await encryptApiKey(apiKey);
  }

  static async decryptFromStorage(encryptedApiKey: string): Promise<string> {
    return await decryptApiKey(encryptedApiKey);
  }

  static isEncrypted(apiKey: string): boolean {
    return isEncrypted(apiKey);
  }
}
