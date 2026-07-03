"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedDevPassword = await bcrypt.hash('dev123', 10);
    const org = await prisma.organization.upsert({
        where: { id: 'dev-org-id' },
        update: {},
        create: {
            id: 'dev-org-id',
            name: 'Dev Organization',
            plan: 'PRO',
        },
    });
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
//# sourceMappingURL=seed.js.map