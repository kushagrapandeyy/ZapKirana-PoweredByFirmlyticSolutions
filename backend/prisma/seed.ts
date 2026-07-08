/**
 * Basko ERP — Minimal Structural Seed
 *
 * This seed file is intentionally EMPTY of fake data.
 * It only ensures required enum lookups, system categories, and
 * the Prisma client extension are available.
 *
 * To add real data:
 * 1. Boot the backend: npm run start:dev
 * 2. Use the Vendor App to create your organization, store, staff, and products.
 * 3. OR use the admin panel at /admin once you are ready.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * ⚠  DO NOT add hardcoded UUIDs, fake emails, demo passwords, or fake GST
 *    numbers to this file. That creates invisible dependencies that silently
 *    break production deploys.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Running Basko structural seed...');

  // Seed global product categories (reference data only — no store data)
  const systemCategories = [
    'Dairy & Eggs',
    'Fruits & Vegetables',
    'Staples & Grains',
    'Snacks & Biscuits',
    'Beverages',
    'Personal Care',
    'Household & Cleaning',
    'Bakery & Bread',
    'Frozen Foods',
    'Baby & Kids',
    'Health & Wellness',
    'Masala & Spices',
    'Oils & Ghee',
    'Packed & Instant Foods',
    'Pet Supplies',
    'Miscellaneous',
  ];

  for (const name of systemCategories) {
    await prisma.globalCategory.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  console.log(`✅ Seeded ${systemCategories.length} global product categories.`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Start the backend: npm run start:dev');
  console.log('   2. Register your organization via POST /auth/register');
  console.log('   3. Create your store via POST /admin/stores');
  console.log('   4. Log in to the Vendor App with your credentials.');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
