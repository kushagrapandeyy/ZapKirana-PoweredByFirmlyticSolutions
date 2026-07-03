import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  storeId: string | null;
  deviceId: string | null;
  staffId: string | null;
  isLoading: boolean;
  login: (token: string, storeId: string, deviceId: string, staffId: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  storeId: null,
  deviceId: null,
  staffId: null,
  isLoading: true,
  login: async (token, storeId, deviceId, staffId) => {
    await AsyncStorage.setItem('scanner_token', token);
    await AsyncStorage.setItem('scanner_store_id', storeId);
    await AsyncStorage.setItem('scanner_device_id', deviceId);
    await AsyncStorage.setItem('scanner_staff_id', staffId);
    set({ token, storeId, deviceId, staffId });
  },
  logout: async () => {
    await AsyncStorage.multiRemove([
      'scanner_token',
      'scanner_store_id',
      'scanner_device_id',
      'scanner_staff_id'
    ]);
    set({ token: null, storeId: null, deviceId: null, staffId: null });
  },
  initAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('scanner_token');
      const storeId = await AsyncStorage.getItem('scanner_store_id');
      const deviceId = await AsyncStorage.getItem('scanner_device_id');
      const staffId = await AsyncStorage.getItem('scanner_staff_id');
      set({ token, storeId, deviceId, staffId, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
