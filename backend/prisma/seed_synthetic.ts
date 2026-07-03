import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Loading synthetic seed data...');
  
  const seedFilePath = path.join(__dirname, '../seed_data.json');
  if (!fs.existsSync(seedFilePath)) {
    console.error('seed_data.json not found!');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));
  console.log(`Loaded dataset: ${data.metadata.dataset_name}`);

  // Create a synthetic organization
  const org = await prisma.organization.upsert({
    where: { id: 'synth-org' },
    update: {},
    create: {
      id: 'synth-org',
      name: 'Kwick Synthetic Network',
      plan: 'PRO'
    }
  });

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 0. Inject Permanent Mock User for E2E Dev Testing
  console.log('Injecting permanent Mock User for E2E testing...');
  const mockUserId = 'de283b71-1972-47b7-996f-6633d0f7b7f5';
  await prisma.user.upsert({
    where: { id: mockUserId },
    update: { role: 'OWNER' },
    create: {
      id: mockUserId,
      email: 'mock.dev@kwick.com',
      password: defaultPassword,
      name: 'Kwick Mock User',
      phone: '+919999999999',
      role: 'OWNER',
      organizationId: org.id
    }
  });

  // 1. Insert Stores
  console.log(`Inserting ${data.stores.length} stores...`);
  for (const s of data.stores) {
    await prisma.store.upsert({
      where: { id: s.store_id },
      update: {},
      create: {
        id: s.store_id,
        organizationId: org.id,
        name: s.store_name,
        location: `${s.address_line_1}, ${s.neighborhood}, ${s.city}, ${s.state} - ${s.pincode}`,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
        isActive: s.is_active,
        operatingHours: JSON.stringify({
          mon: { open: s.opening_time, close: s.closing_time },
          tue: { open: s.opening_time, close: s.closing_time },
          wed: { open: s.opening_time, close: s.closing_time },
          thu: { open: s.opening_time, close: s.closing_time },
          fri: { open: s.opening_time, close: s.closing_time },
          sat: { open: s.opening_time, close: s.closing_time },
          sun: { open: s.opening_time, close: s.closing_time },
        })
      }
    });
  }

  // 2. Insert Staff
  console.log(`Inserting ${data.store_staff.length} staff members...`);
  for (const staff of data.store_staff) {
    const userRole = staff.role === 'manager' ? 'MANAGER' : 'STAFF';
    
    const u = await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        id: staff.staff_id,
        organizationId: org.id,
        storeId: staff.store_id,
        name: staff.full_name,
        email: staff.email,
        phone: staff.phone,
        password: defaultPassword,
        role: userRole,
        isVerified: true
      }
    });

    await prisma.userStoreRole.upsert({
      where: { storeId_userId: { storeId: staff.store_id, userId: u.id } },
      update: {},
      create: {
        organizationId: org.id,
        storeId: staff.store_id,
        userId: u.id,
        role: userRole,
        permissionsJson: JSON.stringify(staff.responsibilities)
      }
    });
  }

  // 3. Insert Users
  console.log(`Inserting ${data.users.length} users...`);
  for (const user of data.users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        password: defaultPassword,
        role: 'CUSTOMER',
        isVerified: true,
        createdAt: new Date(user.created_at)
      }
    });

    // Add default address
    await prisma.savedAddress.create({
      data: {
        userId: user.user_id,
        label: 'Home',
        address: `${user.default_address}, ${user.neighborhood}, ${user.city}, ${user.state} - ${user.pincode}`,
        latitude: parseFloat(user.latitude),
        longitude: parseFloat(user.longitude),
        isDefault: true,
      }
    });
  }

  // 4. Insert Suppliers
  console.log(`Inserting ${data.suppliers.length} suppliers...`);
  for (const sup of data.suppliers) {
    await prisma.supplier.upsert({
      where: { id: sup.supplier_id },
      update: {},
      create: {
        id: sup.supplier_id,
        name: sup.supplier_name,
        contactEmail: sup.email,
        contactPhone: sup.phone,
        address: `${sup.city}, ${sup.state}`,
        categories: sup.supplier_type,
        isActive: sup.is_active
      }
    });
  }

  // 5. Insert Catalog Items
  console.log(`Inserting ${data.catalog_items.length} products...`);
  // Since our schema maps products per store, we should insert them into the global store or copy to each store.
  // The synthetic JSON has store_inventory referencing item_id. 
  // Let's create these as global products or duplicate per store. 
  // Wait, in Basko/Kwick, products are store-scoped. Let's create them for every store!
  const totalItems = data.catalog_items.length;
  for (let i = 0; i < totalItems; i++) {
    const item = data.catalog_items[i];
    if (i % 50 === 0) console.log(`Products Progress: ${Math.round((i / totalItems) * 100)}%`);
    for (const store of data.stores) {
      const gstClassMap: Record<number, string> = { 0: 'EXEMPT', 5: 'GST_5', 12: 'GST_12', 18: 'GST_18', 28: 'GST_28' };
      const gClass = gstClassMap[item.gst_rate_percent] || 'EXEMPT';

      await prisma.product.upsert({
        where: { internalSku: `${store.store_id}_${item.item_id}` },
        update: {},
        create: {
          storeId: store.store_id,
          internalSku: `${store.store_id}_${item.item_id}`,
          name: `${item.brand !== 'generic' ? item.brand + ' ' : ''}${item.item_name} ${item.pack_size}`,
          category: item.category,
          mrp: item.mrp_inr,
          sellingPrice: item.mrp_inr,
          gstRate: item.gst_rate_percent,
          gstClass: gClass as any,
          imageUrl: item.verified_source_url // using the URL provided in the dataset
        }
      });
    }
  }

  // 6. Insert Store Inventory
  console.log(`Inserting ${data.store_inventory.length} inventory records...`);
  const totalInv = data.store_inventory.length;
  for (let i = 0; i < totalInv; i++) {
    const inv = data.store_inventory[i];
    if (i % 100 === 0) console.log(`Inventory Progress: ${Math.round((i / totalInv) * 100)}%`);
    const product = await prisma.product.findUnique({
      where: { internalSku: `${inv.store_id}_${inv.item_id}` }
    });

    if (product) {
      await prisma.inventory.upsert({
        // using batchNo "DEFAULT" as unique combo
        where: { storeId_productId_batchNo: { storeId: inv.store_id, productId: product.id, batchNo: 'DEFAULT' } },
        update: {
          onHandQty: 50,
          lowStockThreshold: inv.reorder_level
        },
        create: {
          storeId: inv.store_id,
          productId: product.id,
          batchNo: 'DEFAULT',
          onHandQty: 50,
          lowStockThreshold: inv.reorder_level
        }
      });

      // Update the selling price in product
      await prisma.product.update({
        where: { id: product.id },
        data: { sellingPrice: inv.selling_price_inr }
      });
    }
  }

  // 7. Insert Supplier Catalog
  console.log(`Inserting ${data.supplier_catalog.length} supplier catalog items...`);
  // Map supplier catalog items to the specific products in each store
  const totalSupp = data.supplier_catalog.length;
  for (let i = 0; i < totalSupp; i++) {
    const sc = data.supplier_catalog[i];
    if (i % 50 === 0) console.log(`Supplier Catalog Progress: ${Math.round((i / totalSupp) * 100)}%`);
    for (const store of data.stores) {
      const product = await prisma.product.findUnique({
        where: { internalSku: `${store.store_id}_${sc.item_id}` }
      });

      if (product) {
        // Upsert Supplier connection
        await prisma.storeSupplierConnection.upsert({
          where: { storeId_supplierId: { storeId: store.store_id, supplierId: sc.supplier_id } },
          update: {},
          create: { storeId: store.store_id, supplierId: sc.supplier_id, status: 'CONNECTED' }
        });

        // Add supplier product price
        await prisma.supplierProduct.upsert({
          where: { supplierId_productId: { supplierId: sc.supplier_id, productId: product.id } },
          update: { price: sc.wholesale_price_inr },
          create: {
            supplierId: sc.supplier_id,
            productId: product.id,
            price: sc.wholesale_price_inr
          }
        });
      }
    }
  }

  // 8. Generate Realistic Mock Orders
  console.log(`Generating realistic mock orders...`);
  const allStores = data.stores;
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });
  
  if (customers.length > 0) {
    for (const store of allStores) {
      const storeProducts = await prisma.product.findMany({ where: { storeId: store.store_id }, take: 20 });
      if (storeProducts.length === 0) continue;

      const statuses: any[] = ['PAID', 'PICKING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'];
      
      for (let i = 0; i < 15; i++) {
        const customer = customers[i % customers.length];
        const status = statuses[i % statuses.length];
        const numItems = Math.floor(Math.random() * 5) + 1;
        const selectedProducts = storeProducts.sort(() => 0.5 - Math.random()).slice(0, numItems);
        
        let totalAmount = 0;
        const orderItems = selectedProducts.map(p => {
          const qty = Math.floor(Math.random() * 3) + 1;
          const price = p.sellingPrice || 100;
          totalAmount += qty * price;
          return {
            product: { connect: { id: p.id } },
            quantity: qty,
            priceAtOrder: price,
            gstAtOrder: price * 0.05,
            gstClass: 'GST_5' as any
          };
        });

        await prisma.order.create({
          data: {
            storeId: store.store_id,
            customerId: customer.id,
            status,
            totalAmount,
            deliveryFee: 30,
            gstAmount: totalAmount * 0.05,
            deliveryAddress: 'Mock Delivery Address, Sector 4, Kwick City',
            deliveryLat: 28.5,
            deliveryLng: 77.2,
            requireOtp: status === 'OUT_FOR_DELIVERY',
            otp: '1234',
            items: {
              create: orderItems
            }
          }
        });
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
