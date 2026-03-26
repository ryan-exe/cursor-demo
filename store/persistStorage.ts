import { Platform } from 'react-native';

/**
 * AsyncStorage's native module is unavailable on web in some setups.
 * Use localStorage on web; AsyncStorage on iOS/Android.
 */
export async function storageGetItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      const ls = (globalThis as { localStorage?: Storage }).localStorage;
      return ls?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  const AsyncStorage = (
    await import('@react-native-async-storage/async-storage')
  ).default;
  return AsyncStorage.getItem(key);
}

export async function storageSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const ls = (globalThis as { localStorage?: Storage }).localStorage;
      ls?.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  const AsyncStorage = (
    await import('@react-native-async-storage/async-storage')
  ).default;
  await AsyncStorage.setItem(key, value);
}
