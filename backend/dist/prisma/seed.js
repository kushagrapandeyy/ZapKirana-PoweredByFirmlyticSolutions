"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const store = await prisma.store.create({
        data: {
            name: 'FreshMart Society Store',
            location: 'Tower B, Ground Floor',
            gstin: '29GGGGG1314R9Z6',
        },
    });
    console.log(`Created store: ${store.name}`);
    const owner = await prisma.user.create({
        data: {
            email: 'owner@freshmart.com',
            name: 'Store Owner',
            role: 'OWNER',
            storeId: store.id,
        },
    });
    console.log(`Created user: ${owner.email}`);
    const products = [
        {
            storeId: store.id,
            internalSku: 'SKU-001',
            name: 'Amul Taaza Milk 1L',
            barcode: '8901234567890',
            category: 'Dairy',
            mrp: 68,
            sellingPrice: 68,
            purchaseCost: 55,
        },
        {
            storeId: store.id,
            internalSku: 'SKU-002',
            name: 'Britannia Whole Wheat Bread',
            barcode: '8901234567891',
            category: 'Bread & Eggs',
            mrp: 45,
            sellingPrice: 45,
            purchaseCost: 35,
        },
        {
            storeId: store.id,
            internalSku: 'SKU-003',
            name: 'Tata Salt 1kg',
            barcode: '8901234567892',
            category: 'Staples',
            mrp: 28,
            sellingPrice: 28,
            purchaseCost: 22,
        },
    ];
    for (const p of products) {
        await prisma.product.create({ data: p });
    }
    console.log('Created initial product master.');
    console.log('Seeding complete!');
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