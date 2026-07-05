const fs = require('fs');
const path = require('path');

const files = [
  'web-admin/src/Login.tsx',
  'web-admin/src/App.tsx',
  'README.md',
  'backend/src/scanner-management/scanner-management.service.ts',
  'backend/src/delivery/delivery.gateway.ts',
  'backend/src/procurement/purchase-order/purchase-order.service.ts',
  'backend/src/storage/storage.service.ts',
  'backend/src/auth/jwt.strategy.ts',
  'backend/src/auth/auth.service.ts',
  'backend/src/main.ts',
  'backend/src/platform/platform.service.ts',
  'backend/src/payments/payments.service.ts',
  'backend/prisma/seed_synthetic.ts',
  'backend/prisma/seed.ts',
  'app-vendor/src/app/(auth)/signup.tsx',
  'app-vendor/src/app/(tabs)/dashboard.tsx',
  'backend/.env'
];

files.forEach(file => {
  const filePath = path.resolve(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/Basko/g, 'Zapkirana');
    content = content.replace(/basko/g, 'zapkirana');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Replaced in ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
