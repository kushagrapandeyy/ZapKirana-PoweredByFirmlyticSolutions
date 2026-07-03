import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const brands = ['Aashirvaad', 'Tata', 'Fortune', 'Amul', 'Everest', 'MDH', 'Britannia', 'Parle', 'Maggi', 'Nestle', 'Surf Excel', 'Vim', 'Dettol', 'Colgate', 'Dove', 'Saffola', 'Lays', 'Haldiram', 'Sunfeast', 'Bru', 'Taj Mahal', 'Kissan', 'Himalaya'];
const adjectives = ['Premium', 'Organic', 'Fresh', 'Pure', 'Natural', 'Classic', 'Super', 'Gold', 'Select', 'Rich', 'Lite', 'Plus', 'Extra'];
const bases = ['Atta', 'Rice', 'Dal', 'Oil', 'Ghee', 'Turmeric', 'Salt', 'Sugar', 'Milk', 'Paneer', 'Cookies', 'Biscuits', 'Noodles', 'Tea', 'Coffee', 'Shampoo', 'Soap', 'Face Wash', 'Chips', 'Bhujia', 'Ketchup', 'Jam', 'Butter'];
const units = ['kg', 'g', 'L', 'ml', 'pack'];
const categories = ['staples', 'pulses', 'oil_ghee', 'spices', 'dairy', 'snacks', 'beverages', 'personal_care', 'home_care', 'packaged_food'];
const gstClasses = ['EXEMPT', 'GST_5', 'GST_12', 'GST_18', 'GST_28'];
const images = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1584308666744-24d5e4a77918?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1581005834898-13ce32eef0bd?auto=format&fit=crop&q=80&w=300'
];

function rInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log('Starting massive synthetic seed (100s of products per store)...');
  
  // We already created the synthetic org and stores in seed_synthetic.ts. 
  // Let's get all stores except the dev-store-id
  const stores = await prisma.store.findMany({ where: { id: { not: 'dev-store-id' } } });
  
  if (stores.length === 0) {
    console.error('No Kirana stores found. Did you run the previous seed?');
    return;
  }
  
  const suppliers = await prisma.supplier.findMany();
  
  for (const store of stores) {
    console.log(`Seeding 500 products for store: ${store.name} (${store.id})`);
    const productsData = [];
    const inventoryData = [];
    
    for (let i = 0; i < 500; i++) {
      const brand = rItem(brands);
      const adj = Math.random() > 0.5 ? rItem(adjectives) + ' ' : '';
      const base = rItem(bases);
      const size = rInt(1, 10);
      const unit = rItem(units);
      const mrp = rInt(10, 100) * 10;
      
      const internalSku = `MASSIVE_${store.id}_${i}_${Date.now()}`;
      
      // We will create the product one by one to also create inventory, or use createMany if possible.
      // createMany is faster.
      productsData.push({
        storeId: store.id,
        internalSku: internalSku,
        name: `${brand} ${adj}${base} ${size}${unit}`,
        category: rItem(categories),
        mrp: mrp,
        sellingPrice: mrp - rInt(0, 5) * 10,
        gstRate: 0,
        gstClass: rItem(gstClasses) as any,
        imageUrl: rItem(images)
      });
    }

    // Insert 500 products
    await prisma.product.createMany({ data: productsData, skipDuplicates: true });

    // Fetch the inserted products to create inventory and supplier catalogs
    const insertedProducts = await prisma.product.findMany({
      where: { storeId: store.id, internalSku: { startsWith: `MASSIVE_${store.id}_` } }
    });

    const invData = [];
    const supCatData = [];
    
    for (const p of insertedProducts) {
      invData.push({
        storeId: store.id,
        productId: p.id,
        batchNo: 'DEFAULT',
        onHandQty: rInt(20, 200),
        lowStockThreshold: 10
      });
      
      if (suppliers.length > 0) {
        supCatData.push({
          supplierId: rItem(suppliers).id,
          productId: p.id,
          price: p.mrp * 0.8
        });
      }
    }
    
    await prisma.inventory.createMany({ data: invData, skipDuplicates: true });
    
    if (supCatData.length > 0) {
      await prisma.supplierProduct.createMany({ data: supCatData, skipDuplicates: true });
    }
    
    console.log(`✅ Store ${store.name} populated with 500 products!`);
  }
  
  console.log('Massive seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
