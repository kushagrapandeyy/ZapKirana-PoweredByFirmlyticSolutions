import Constants from 'expo-constants';

/**
 * Consumer App API constants.
 *
 * ⚠ CURRENT_STORE_ID has been removed.
 * The active store is selected by the consumer via the store picker and persisted
 * at AsyncStorage key '@selected_store_id'. Read it like this:
 *
 *   const storeId = await AsyncStorage.getItem('@selected_store_id');
 *   if (!storeId) { // redirect to store picker }
 */

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
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
