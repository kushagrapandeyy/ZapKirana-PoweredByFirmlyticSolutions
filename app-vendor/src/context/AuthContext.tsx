import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

export type Role = 'OWNER' | 'MANAGER' | 'STAFF' | 'DELIVERY' | 'PARTNER';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  storeId: string | null;      // ← from JWT / login response; never hardcoded
  staffId: string | null;      // ← from JWT / login response; never hardcoded
  tenantId: string | null;
  phone: string | null;
  token: string | null;
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
}

interface LoginParams {
  phone: string;
  role: Role;
  token: string;
  tenantId: string;
  storeId: string;
  staffId: string;
}

const STORAGE_KEY = 'vendor_auth_v2';

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  role: null,
  storeId: null,
  staffId: null,
  tenantId: null,
  phone: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  updateRole: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<Role | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const segments = useSegments();
  const router = useRouter();

  // ── Restore persisted session on app start ──────────────────────────────
  useEffect(() => {
    const loadSession = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const auth = JSON.parse(raw) as LoginParams;
          setRole(auth.role);
          setStoreId(auth.storeId);
          setStaffId(auth.staffId);
          setTenantId(auth.tenantId);
          setPhone(auth.phone);
          setToken(auth.token);
          setIsAuthenticated(true);
        }
      } catch {
        // Corrupted storage — clear and force re-login
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    };
    loadSession();
  }, []);

  // ── Route protection ────────────────────────────────────────────────────
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    } else if (!isAuthenticated && !inAuthGroup && segments.length > 0) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments]);

  const login = async (params: LoginParams) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    setRole(params.role);
    setStoreId(params.storeId);
    setStaffId(params.staffId);
    setTenantId(params.tenantId);
    setPhone(params.phone);
    setToken(params.token);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setRole(null);
    setStoreId(null);
    setStaffId(null);
    setTenantId(null);
    setPhone(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const updateRole = async (newRole: Role) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const auth = JSON.parse(raw);
      auth.role = newRole;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      setRole(newRole);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, storeId, staffId, tenantId, phone, token, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}
