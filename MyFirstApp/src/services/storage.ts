import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryFallbackStore = new Map<string, string>();

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback to memory
    }
  }

  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch {
    // If SecureStore throws or is unavailable
  }

  memoryFallbackStore.set(key, value);
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to memory
    }
  }

  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      return await SecureStore.getItemAsync(key);
    }
  } catch {
    // Fallback to memory
  }

  return memoryFallbackStore.get(key) ?? null;
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback to memory
    }
  }

  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch {
    // Fallback to memory
  }

  memoryFallbackStore.delete(key);
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'dp_access_token',
  REFRESH_TOKEN: 'dp_refresh_token',
  USER_DATA: 'dp_user_data',
  WORKSPACE_ID: 'dp_workspace_id',
  SETTINGS: 'dp_app_settings',
};
