const fs = require('fs');

const files = [
  'app-scanner/src/app/(tabs)/scanner.tsx',
  'app-scanner/src/app/(tabs)/action.tsx',
  'app-scanner/src/app/(auth)/login.tsx',
  'app-scanner/src/store/useAuthStore.ts'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  
  if (f.includes('scanner.tsx')) {
    content = content.replace(/const hostUri = Constants\.expoConfig\?\.hostUri;[\s\S]*?const API_URL = `http:\/\/\$\{ip\}:3000\/api\/v1`;/, "import { API_BASE_URL } from '../../constants/api';\nconst API_URL = `${API_BASE_URL}/api/v1`;");
  }
  
  if (f.includes('action.tsx') || f.includes('login.tsx')) {
    content = content.replace(/const hostUri = Constants\.expoConfig\?\.hostUri;[\s\S]*?const BASE_URL = `http:\/\/\$\{ip\}:3000`;/, "import { API_BASE_URL } from '../../constants/api';\nconst BASE_URL = API_BASE_URL;");
  }

  if (f.includes('useAuthStore.ts')) {
    content = content.replace(/import Constants from 'expo-constants';/, "import { API_BASE_URL } from '../constants/api';");
    content = content.replace(/const hostUri = Constants\.expoConfig\?\.hostUri;[\s\S]*?const ip = [^;]+;/, "");
    content = content.replace(/`http:\/\/\$\{ip\}:3000\/auth\/scanner\/logout`/, "`${API_BASE_URL}/auth/scanner/logout`");
  }
  
  fs.writeFileSync(f, content);
});
