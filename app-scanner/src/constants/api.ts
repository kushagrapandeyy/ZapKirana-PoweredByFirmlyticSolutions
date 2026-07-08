/**
 * Scanner App API constants.
 * The storeId and staffId come from the scanner auth session (useAuthStore).
 * Never hardcode these.
 */

import Constants from 'expo-constants';

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

/** DataKart API — Indian product master database */
export const DATAKART_API_URL = process.env.EXPO_PUBLIC_DATAKART_URL ?? 'https://api.datakart.in/v1';
export const DATAKART_API_KEY = process.env.EXPO_PUBLIC_DATAKART_KEY ?? '';
