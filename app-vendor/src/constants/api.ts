import Constants from 'expo-constants';

const getApiUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://100.70.73.205:3000';
};

export const API_BASE_URL = getApiUrl();

// Seeded database IDs for testing
export const CURRENT_STORE_ID = '5981f6aa-23ee-4acf-bd1d-8ceb2a92ea0c';
export const CURRENT_STAFF_ID = 'de283b71-1972-47b7-996f-6633d0f7b7f5';
