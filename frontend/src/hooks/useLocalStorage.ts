/**
 * Custom hook for localStorage management
 */

import { useState, useEffect, useCallback } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils';

/**
 * Hook to manage state with localStorage persistence
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return loadFromLocalStorage(key, initialValue);
  });

  // Return a wrapped version of useState's setter function that persists to localStorage
  // Use setStoredValue with functional update to avoid storedValue dependency
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Save state - use functional update to get current value
      setStoredValue((currentValue) => {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(currentValue) : value;
        
        // Save to localStorage
        saveToLocalStorage(key, valueToStore);
        
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // Sync state with localStorage when key changes
  // Remove initialValue from dependencies to prevent infinite loop
  useEffect(() => {
    const value = loadFromLocalStorage(key, initialValue);
    setStoredValue(value);
  }, [key]);

  return [storedValue, setValue] as const;
}
