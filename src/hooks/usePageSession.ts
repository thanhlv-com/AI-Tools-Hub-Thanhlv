import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing page-specific session storage
 * Each page maintains its own isolated session that persists across navigation
 */
export function usePageSession<T>(pageId: string, defaultValue: T) {
  const storageKey = `page-session-${pageId}`;

  // Initialize state with stored value or default
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save session for page ${pageId}:`, error);
    }
  }, [state, storageKey, pageId]);

  // Clear session data for this page
  const clearSession = useCallback(() => {
    localStorage.removeItem(storageKey);
    setState(defaultValue);
  }, [storageKey, defaultValue]);

  return [state, setState, clearSession] as const;
}

/**
 * Hook for managing individual field session storage within a page
 * Allows fine-grained control over specific form fields or state pieces
 */
export function useFieldSession<T>(pageId: string, fieldName: string, defaultValue: T) {
  const storageKey = `page-session-${pageId}-${fieldName}`;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to save field session for ${pageId}.${fieldName}:`, error);
    }
  }, [state, storageKey, pageId, fieldName]);

  const clearField = useCallback(() => {
    localStorage.removeItem(storageKey);
    setState(defaultValue);
  }, [storageKey, defaultValue]);

  return [state, setState, clearField] as const;
}