import Constants from 'expo-constants';

/**
 * Resolves the API base URL from Expo's hostUri at runtime.
 * In dev: points at the machine running `npm run dev`.
 * In production: reads from EXPO_PUBLIC_API_URL env var.
 *
 * ⚠ CURRENT_STORE_ID and CURRENT_STAFF_ID have been intentionally removed.
 * These values must come from the authenticated session (AuthContext / useAuth()).
 * If you find yourself needing these, read from useAuth().storeId / useAuth().staffId.
 */

const getApiUrl = (): string => {
  // Production: set EXPO_PUBLIC_API_URL in eas.json / app.json
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Dev: derive from Expo hostUri so it works on real devices (not just simulators)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:3000`;
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = getApiUrl();

export const SUPABASE_URL = 'https://gfgmjrzniszsvucszptf.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmZ21qcnpuaXN6c3Z1Y3N6cHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDMzMjYsImV4cCI6MjA5ODIxOTMyNn0.dVcTq_cQDIFEqD9N8QW42VZiQLxIyS_IS5frBgoAy4o';
