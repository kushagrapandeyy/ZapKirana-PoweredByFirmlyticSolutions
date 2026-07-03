import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

interface AuthState {
  token: string | null;
  storeId: string | null;
  deviceId: string | null;
  staffId: string | null;
  sessionId: string | null;
  isLoading: boolean;
  login: (token: string, storeId: string, deviceId: string, staffId: string, sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  storeId: null,
  deviceId: null,
  staffId: null,
  sessionId: null,
  isLoading: true,
  login: async (token, storeId, deviceId, staffId, sessionId) => {
    await AsyncStorage.setItem('scanner_token', token);
    await AsyncStorage.setItem('scanner_store_id', storeId);
    await AsyncStorage.setItem('scanner_device_id', deviceId);
    await AsyncStorage.setItem('scanner_staff_id', staffId);
    await AsyncStorage.setItem('scanner_session_id', sessionId);
    set({ token, storeId, deviceId, staffId, sessionId });
  },
  logout: async () => {
    const token = await AsyncStorage.getItem('scanner_token');
    if (token) {
      // Call backend to close session
      const hostUri = Constants.expoConfig?.hostUri;
      const ip = hostUri ? hostUri.split(':')[0] : 'localhost';

      try {
        await fetch(`http://${ip}:3000/auth/scanner/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Logout error', e);
      }
    }
    await AsyncStorage.multiRemove([
      'scanner_token',
      'scanner_store_id',
      'scanner_device_id',
      'scanner_staff_id',
      'scanner_session_id'
    ]);
    set({ token: null, storeId: null, deviceId: null, staffId: null, sessionId: null });
  },
  initAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('scanner_token');
      const storeId = await AsyncStorage.getItem('scanner_store_id');
      const deviceId = await AsyncStorage.getItem('scanner_device_id');
      const staffId = await AsyncStorage.getItem('scanner_staff_id');
      const sessionId = await AsyncStorage.getItem('scanner_session_id');
      set({ token, storeId, deviceId, staffId, sessionId, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
