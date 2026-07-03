import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedDevPassword = await bcrypt.hash('dev123', 10);

  // 1. Create an Organization
  const org = await prisma.organization.upsert({
    where: { id: 'dev-org-id' },
    update: {},
    create: {
      id: 'dev-org-id',
      name: 'Dev Organization',
      plan: 'PRO',
    },
  });

  // 2. Create a Store
  const store = await prisma.store.upsert({
    where: { id: 'dev-store-id' },
    update: {},
    create: {
      id: 'dev-store-id',
      organizationId: org.id,
      name: 'Dev Supermart',
      location: '123 Dev Street',
      latitude: 12.9716,
      longitude: 77.5946,
      isActive: true,
    },
  });

  // 3. Create a universal dev account
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@basko.com' },
    update: { password: hashedDevPassword, role: 'OWNER', organizationId: org.id, storeId: store.id },
    create: {
      email: 'dev@basko.com',
      phone: '+1234567890',
      password: hashedDevPassword,
      name: 'Dev Tester',
      role: 'OWNER',
      organizationId: org.id,
      storeId: store.id,
    },
  });

  // 4. Create UserStoreRole
  await prisma.userStoreRole.upsert({
    where: {
      storeId_userId: {
        storeId: store.id,
        userId: devUser.id,
      },
    },
    update: { role: 'OWNER' },
    create: {
      organizationId: org.id,
      storeId: store.id,
      userId: devUser.id,
      role: 'OWNER',
    },
  });

  // 5. Create a Scanner Staff account
  const hashedScannerPassword = await bcrypt.hash('scanner123', 10);
  const scannerUser = await prisma.user.upsert({
    where: { email: 'scanner@basko.com' },
    update: { password: hashedScannerPassword, role: 'SCANNER_STAFF', organizationId: org.id, storeId: store.id, pin: '1234' },
    create: {
      email: 'scanner@basko.com',
      phone: '+1987654321',
      password: hashedScannerPassword,
      name: 'Scanner Staff',
      role: 'SCANNER_STAFF',
      organizationId: org.id,
      storeId: store.id,
      pin: '1234',
    },
  });

  await prisma.userStoreRole.upsert({
    where: {
      storeId_userId: {
        storeId: store.id,
        userId: scannerUser.id,
      },
    },
    update: { role: 'SCANNER_STAFF' },
    create: {
      organizationId: org.id,
      storeId: store.id,
      userId: scannerUser.id,
      role: 'SCANNER_STAFF',
    },
  });

  // 6. Create a default Scanner Device
  const scannerDevice = await prisma.scannerDevice.upsert({
    where: { deviceCode: 'DVC-DEV' },
    update: { storeId: store.id, status: 'ACTIVE' },
    create: {
      deviceCode: 'DVC-DEV',
      deviceName: 'Dev Tester Scanner',
      storeId: store.id,
      status: 'ACTIVE',
    },
  });

  console.log(`Created universal dev user: ${devUser.email} / +1234567890 with password: dev123`);
  console.log(`Created scanner dev user: ${scannerUser.email} / PIN: 1234`);
  console.log(`Created scanner dev device code: DVC-DEV`);
  console.log(`Linked to Store: ${store.name} and Organization: ${org.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
