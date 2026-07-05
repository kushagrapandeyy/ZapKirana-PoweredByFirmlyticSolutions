import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

interface AuthState {
  token: string | null;
  storeId: string | null;
  deviceId: string | null;
  staffId: string | null;
  sessionId: string | null;
  role: string | null;
  isLoading: boolean;
  login: (token: string, storeId: string, deviceId: string, staffId: string, sessionId: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  storeId: null,
  deviceId: null,
  staffId: null,
  sessionId: null,
  role: null,
  isLoading: true,
  login: async (token, storeId, deviceId, staffId, sessionId, role) => {
    await AsyncStorage.setItem('scanner_token', token);
    await AsyncStorage.setItem('scanner_store_id', storeId);
    await AsyncStorage.setItem('scanner_device_id', deviceId);
    await AsyncStorage.setItem('scanner_staff_id', staffId);
    await AsyncStorage.setItem('scanner_session_id', sessionId);
    await AsyncStorage.setItem('scanner_role', role);
    set({ token, storeId, deviceId, staffId, sessionId, role });
  },
  logout: async () => {
    const token = await AsyncStorage.getItem('scanner_token');
    if (token) {
      // Call backend to close session
      

      try {
        await fetch(`${API_BASE_URL}/auth/scanner/logout`, {
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
      'scanner_session_id',
      'scanner_role'
    ]);
    set({ token: null, storeId: null, deviceId: null, staffId: null, sessionId: null, role: null });
  },
  initAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('scanner_token');
      const storeId = await AsyncStorage.getItem('scanner_store_id');
      const deviceId = await AsyncStorage.getItem('scanner_device_id');
      const staffId = await AsyncStorage.getItem('scanner_staff_id');
      const sessionId = await AsyncStorage.getItem('scanner_session_id');
      const role = await AsyncStorage.getItem('scanner_role');
      set({ token, storeId, deviceId, staffId, sessionId, role, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
