import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

export type Role = 'OWNER' | 'MANAGER' | 'PICKER' | 'PARTNER';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  tenantId: string | null;
  phone: string | null;
  login: (phone: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  role: null,
  tenantId: null,
  phone: null,
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
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  
  const segments = useSegments();
  const router = useRouter();

  // Load session on startup
  useEffect(() => {
    const loadSession = async () => {
      const storedAuth = await AsyncStorage.getItem('vendor_auth');
      if (storedAuth) {
        const { role, tenantId, phone } = JSON.parse(storedAuth);
        setRole(role);
        setTenantId(tenantId);
        setPhone(phone);
        setIsAuthenticated(true);
      }
    };
    loadSession();
  }, []);

  // Protected routing logic
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    } else if (!isAuthenticated && !inAuthGroup && segments.length > 0) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments]);

  const login = async (userPhone: string, userRole: Role = 'OWNER') => {
    const defaultTenant = 'tenant_basko_001';
    await AsyncStorage.setItem('vendor_auth', JSON.stringify({ 
      role: userRole, 
      tenantId: defaultTenant, 
      phone: userPhone 
    }));
    
    setRole(userRole);
    setTenantId(defaultTenant);
    setPhone(userPhone);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('vendor_auth');
    setRole(null);
    setTenantId(null);
    setPhone(null);
    setIsAuthenticated(false);
  };

  const updateRole = async (newRole: Role) => {
    const storedAuth = await AsyncStorage.getItem('vendor_auth');
    if (storedAuth) {
      const auth = JSON.parse(storedAuth);
      auth.role = newRole;
      await AsyncStorage.setItem('vendor_auth', JSON.stringify(auth));
      setRole(newRole);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, tenantId, phone, login, logout, updateRole }}>
      {children}
    </AuthContext.Provider>
  );
}
