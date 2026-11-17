// Device backends. General app data: SQLite key-value store bundled with Expo.
// Secrets (tokens): the platform keychain/keystore via expo-secure-store (values must stay small, ~2 KB).
import Storage from 'expo-sqlite/kv-store';
import * as SecureStore from 'expo-secure-store';
import type { KeyValueBackend } from './store';

export const deviceBackend: KeyValueBackend = {
  getItem: (key) => Storage.getItem(key),
  setItem: (key, value) => Storage.setItem(key, value),
  removeItem: (key) => Storage.removeItem(key),
};

// SecureStore keys allow only [A-Za-z0-9._-].
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');
export const secureBackend: KeyValueBackend = {
  getItem: (key) => SecureStore.getItemAsync(safeKey(key)),
  setItem: (key, value) => SecureStore.setItemAsync(safeKey(key), value),
  removeItem: (key) => SecureStore.deleteItemAsync(safeKey(key)),
};
