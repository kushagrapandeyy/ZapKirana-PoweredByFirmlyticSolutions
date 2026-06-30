const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});
async function run() {
  let supplier = await prisma.supplier.findFirst();
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: 'Metro Cash & Carry',
        contactEmail: 'sales@metro.co.in',
        contactPhone: '+919876543210',
        categories: 'FMCG, Dairy, Staples',
        rating: 4.8
      }
    });
    console.log('Created Supplier');
  }
  await prisma.$disconnect();
}
run();
