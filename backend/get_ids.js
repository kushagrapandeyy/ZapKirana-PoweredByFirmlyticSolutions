const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});
async function run() {
  const store = await prisma.store.findFirst();
  let prod = await prisma.product.findFirst();
  if (!prod) {
    prod = await prisma.product.create({
      data: {
        storeId: store.id, internalSku: 'SKU-001', name: 'Amul Taaza Milk 1L',
        barcode: '8901234567890', category: 'Dairy', mrp: 68, sellingPrice: 68, purchaseCost: 55
      }
    });
    console.log('Created Product');
  }
  await prisma.$disconnect();
}
run();
