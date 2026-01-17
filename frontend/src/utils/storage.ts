/**
 * LocalStorage Management Utilities
 */

import { STORAGE_KEYS } from '@/config/storage-keys';

// Re-export for backward compatibility
export { STORAGE_KEYS };

/**
 * Save data to localStorage
 */
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

/**
 * Load data from localStorage
 */
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

/**
 * Clear all application data from localStorage
 */
export const clearAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Check if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};
