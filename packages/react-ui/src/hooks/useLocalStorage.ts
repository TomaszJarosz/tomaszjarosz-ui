import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseLocalStorageOptions<T> {
  /** Custom serializer function (default: JSON.stringify) */
  serializer?: (value: T) => string;
  /** Custom deserializer function (default: JSON.parse) */
  deserializer?: (value: string) => T;
  /** Called when an error occurs during storage operations */
  onError?: (error: Error, operation: 'read' | 'write' | 'remove') => void;
  /** Sync state across browser tabs (default: true) */
  syncTabs?: boolean;
}

type SetValue<T> = T | ((prevValue: T) => T);

export interface UseLocalStorageReturn<T> {
  /** Current stored value */
  value: T;
  /** Update the stored value */
  setValue: (value: SetValue<T>) => void;
  /** Remove the value from storage */
  removeValue: () => void;
  /** Last error that occurred, if any */
  error: Error | null;
}

/**
 * Generic hook for managing state persisted in localStorage.
 *
 * Features:
 * - Type-safe storage access
 * - Automatic JSON serialization/deserialization
 * - Cross-tab synchronization via storage events
 * - Proper error handling with optional callback
 * - Functional updates (like useState)
 *
 * @param key - localStorage key
 * @param initialValue - Default value when key doesn't exist
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { value, setValue, removeValue } = useLocalStorage('user-prefs', { theme: 'dark' });
 *
 * // Update value
 * setValue({ theme: 'light' });
 *
 * // Functional update
 * setValue(prev => ({ ...prev, theme: 'light' }));
 *
 * // Remove from storage
 * removeValue();
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError,
    syncTabs = true,
  } = options;

  const [error, setError] = useState<Error | null>(null);

  // Use ref to track if we're the source of the change (to avoid infinite loops)
  const isLocalChange = useRef(false);

  // Initialize state from localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return deserializer(item);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error, 'read');
      return initialValue;
    }
  });

  // Persist value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow functional updates like useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);
        setError(null);

        if (typeof window !== 'undefined') {
          isLocalChange.current = true;
          localStorage.setItem(key, serializer(valueToStore));
          isLocalChange.current = false;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error, 'write');
      }
    },
    [key, serializer, storedValue, onError]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      setError(null);

      if (typeof window !== 'undefined') {
        isLocalChange.current = true;
        localStorage.removeItem(key);
        isLocalChange.current = false;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error, 'remove');
    }
  }, [key, initialValue, onError]);

  // Sync state across tabs via storage event
  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      // Only respond to changes for our key from other tabs
      if (event.key !== key || isLocalChange.current) {
        return;
      }

      try {
        if (event.newValue === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(deserializer(event.newValue));
        }
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error, 'read');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, deserializer, syncTabs, onError]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    error,
  };
}

/**
 * Read a value from localStorage without subscribing to changes.
 * Useful for one-time reads or in non-React code.
 *
 * @param key - localStorage key
 * @param defaultValue - Default value when key doesn't exist or on error
 */
export function getLocalStorageValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item === null ? defaultValue : JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

/**
 * Write a value to localStorage.
 * Useful for one-time writes or in non-React code.
 *
 * @param key - localStorage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function setLocalStorageValue<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export default useLocalStorage;
