"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding dummy products...');
    const store = await prisma.store.findFirst();
    if (!store) {
        console.log('No store found.');
        return;
    }
    const dummyProducts = [
        { name: 'Organic Bananas (1 Dozen)', barcode: '8901234567890', skuCode: 'SKU-001', mrp: 60, saleRateA: 55, saleRateB: 50, sellingPrice: 58, unit: 'DOZEN' },
        { name: 'Aashirvaad Atta 5kg', barcode: '8901234567891', skuCode: 'SKU-002', mrp: 250, saleRateA: 240, saleRateB: 235, sellingPrice: 245, unit: 'PCS' },
        { name: 'Amul Butter 500g', barcode: '8901234567892', skuCode: 'SKU-003', mrp: 260, saleRateA: 255, saleRateB: 250, sellingPrice: 260, unit: 'PCS' },
        { name: 'Tata Salt 1kg', barcode: '8901234567893', skuCode: 'SKU-004', mrp: 28, saleRateA: 25, saleRateB: 24, sellingPrice: 26, unit: 'PCS' },
        { name: 'Maggi 2-Min Noodles (Pack of 4)', barcode: '8901234567894', skuCode: 'SKU-005', mrp: 56, saleRateA: 54, saleRateB: 52, sellingPrice: 56, unit: 'PACK' },
        { name: 'Brooke Bond Red Label Tea 500g', barcode: '8901234567895', skuCode: 'SKU-006', mrp: 300, saleRateA: 290, saleRateB: 280, sellingPrice: 295, unit: 'PCS' },
    ];
    for (const p of dummyProducts) {
        await prisma.product.upsert({
            where: { skuCode: p.skuCode },
            update: {},
            create: {
                storeId: store.id,
                name: p.name,
                barcode: p.barcode,
                skuCode: p.skuCode,
                mrp: p.mrp,
                sellingPrice: p.sellingPrice,
                saleRateA: p.saleRateA,
                saleRateB: p.saleRateB,
                unit: p.unit,
                category: 'Grocery',
                status: 'ACTIVE',
                isActive: true,
            }
        });
    }
    console.log('Seeded products.');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-products.js.map