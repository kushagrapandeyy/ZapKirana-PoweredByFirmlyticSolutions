/**
 * ZapKirnana ERP Seed
 * Seeds a complete test environment: organization, store, brands, categories,
 * global products, store products with full ERP fields (pricing, tax, inventory policy,
 * discount policy, rack locations), suppliers as party ledgers, and a sample MARG import mapping.
 */

import { PrismaClient, LegacySystem, ImportEntityType } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-hashed password for "ZapKirnana@2025" using bcrypt
const DEMO_PASSWORD_HASH = '$2b$10$6aKPlfhZ5jE8I1w3FzR2Ee.XEq4B/01wHLEAVWGW55R/D2FSmjW5u';

async function main() {
  console.log('🌱 Seeding ZapKirnana ERP Database...\n');

  // =====================================================
  // 1. ORGANIZATION
  // =====================================================
  const org = await prisma.organization.upsert({
    where: { id: 'org_zapkirnana_01' },
    create: {
      id: 'org_zapkirnana_01',
      name: 'ZapKirnana Demo Organization',
      legalName: 'ZapKirnana Retail Solutions Pvt. Ltd.',
      gstin: '07ZAPKI9999Z1ZF',
      pan: 'ZAPKI9999Z',
      plan: 'PRO',
      status: 'ACTIVE',
    },
    update: {},
  });
  console.log('✅ Organization:', org.name);

  // =====================================================
  // 2. STORE
  // =====================================================
  const store = await prisma.store.upsert({
    where: { id: 'store_main_01' },
    create: {
      id: 'store_main_01',
      organizationId: org.id,
      name: 'ZapKirnana - Connaught Place',
      location: 'Connaught Place, New Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
      operatingRadiusKm: 5,
      gstin: '07AAFCA9197E1ZF',
      pan: 'AAFCA9197E',
      fssaiLicenseNo: '10019044000088',
      stateCode: '07',
      stateName: 'Delhi',
      isActive: true,
      operatingHours: {
        mon: { open: '08:00', close: '22:00' },
        tue: { open: '08:00', close: '22:00' },
        wed: { open: '08:00', close: '22:00' },
        thu: { open: '08:00', close: '22:00' },
        fri: { open: '08:00', close: '22:00' },
        sat: { open: '08:00', close: '23:00' },
        sun: { open: '09:00', close: '21:00' },
      },
      rating: 4.7,
      description: 'Premium curated grocery store in the heart of Delhi',
    },
    update: {},
  });
  console.log('✅ Store:', store.name);

  // =====================================================
  // 3. USERS (Owner, Manager, Cashier, Customer)
  // =====================================================
  // password pre-hashed

  const owner = await prisma.user.upsert({
    where: { email: 'owner@zapkirnana.com' },
    create: {
      email: 'owner@zapkirnana.com',
      password: DEMO_PASSWORD_HASH,
      name: 'Rajesh Kumar',
      phone: '+919876543210',
      role: 'OWNER',
      storeId: store.id,
      organizationId: org.id,
      isVerified: true,
    },
    update: {},
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@zapkirnana.com' },
    create: {
      email: 'manager@zapkirnana.com',
      password: DEMO_PASSWORD_HASH,
      name: 'Priya Sharma',
      phone: '+919876543211',
      role: 'MANAGER',
      storeId: store.id,
      organizationId: org.id,
      isVerified: true,
    },
    update: {},
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@zapkirnana.com' },
    create: {
      email: 'cashier@zapkirnana.com',
      password: DEMO_PASSWORD_HASH,
      name: 'Amit Verma',
      phone: '+919876543212',
      role: 'POS_CASHIER',
      storeId: store.id,
      organizationId: org.id,
      isVerified: true,
    },
    update: {},
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    create: {
      email: 'customer@example.com',
      password: DEMO_PASSWORD_HASH,
      name: 'Suresh Gupta',
      phone: '+919876543213',
      role: 'CUSTOMER',
      isVerified: true,
    },
    update: {},
  });
  console.log('✅ Users: owner, manager, cashier, customer');

  // =====================================================
  // 4. BRANDS & MANUFACTURERS
  // =====================================================
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { name: 'AMUL' }, create: { name: 'AMUL', normalizedName: 'amul', country: 'India' }, update: {} }),
    prisma.brand.upsert({ where: { name: 'BRITANNIA' }, create: { name: 'BRITANNIA', normalizedName: 'britannia', country: 'India' }, update: {} }),
    prisma.brand.upsert({ where: { name: 'PARLE' }, create: { name: 'PARLE', normalizedName: 'parle', country: 'India' }, update: {} }),
    prisma.brand.upsert({ where: { name: 'ITC' }, create: { name: 'ITC', normalizedName: 'itc', country: 'India' }, update: {} }),
    prisma.brand.upsert({ where: { name: 'NESTLE' }, create: { name: 'NESTLE', normalizedName: 'nestle', country: 'Switzerland' }, update: {} }),
    prisma.brand.upsert({ where: { name: 'COCA COLA' }, create: { name: 'COCA COLA', normalizedName: 'coca cola', country: 'USA' }, update: {} }),
    prisma.brand.upsert({ where: { name: 'DABUR' }, create: { name: 'DABUR', normalizedName: 'dabur', country: 'India' }, update: {} }),
    prisma.brand.upsert({ where: { name: 'PATANJALI' }, create: { name: 'PATANJALI', normalizedName: 'patanjali', country: 'India' }, update: {} }),
  ]);
  console.log(`✅ Brands: ${brands.length} created`);

  const amulBrand = brands[0];
  const britanniaBrand = brands[1];
  const parleBrand = brands[2];
  const itcBrand = brands[3];
  const nestleBrand = brands[4];
  const cocaColaBrand = brands[5];

  const amulMfr = await prisma.manufacturer.upsert({
    where: { name: 'AMUL INDIA LTD.' },
    create: { name: 'AMUL INDIA LTD.', normalizedName: 'amul india ltd', gstin: '24AAACA0615B1ZQ', country: 'India' },
    update: {},
  });

  // =====================================================
  // 5. CATEGORIES
  // =====================================================
  const catDairy = await prisma.globalCategory.upsert({ where: { name: 'Dairy & Beverages' }, create: { name: 'Dairy & Beverages', sortOrder: 1 }, update: {} });
  const catBiscuits = await prisma.globalCategory.upsert({ where: { name: 'Biscuits & Snacks' }, create: { name: 'Biscuits & Snacks', sortOrder: 2 }, update: {} });
  const catBeverages = await prisma.globalCategory.upsert({ where: { name: 'Cold Drinks & Juices' }, create: { name: 'Cold Drinks & Juices', sortOrder: 3 }, update: {} });
  const catEdibleOil = await prisma.globalCategory.upsert({ where: { name: 'Edible Oil & Ghee' }, create: { name: 'Edible Oil & Ghee', sortOrder: 4 }, update: {} });
  const catRice = await prisma.globalCategory.upsert({ where: { name: 'Rice, Atta & Dal' }, create: { name: 'Rice, Atta & Dal', sortOrder: 5 }, update: {} });
  const catSpices = await prisma.globalCategory.upsert({ where: { name: 'Spices & Masala' }, create: { name: 'Spices & Masala', sortOrder: 6 }, update: {} });
  const catPersonalCare = await prisma.globalCategory.upsert({ where: { name: 'Personal Care' }, create: { name: 'Personal Care', sortOrder: 7 }, update: {} });
  const catCleaning = await prisma.globalCategory.upsert({ where: { name: 'Household & Cleaning' }, create: { name: 'Household & Cleaning', sortOrder: 8 }, update: {} });
  console.log('✅ Global Categories: 8 created');

  // Store-local product group (MARG: GROUP)
  const grpOthers = await prisma.productGroup.upsert({
    where: { storeId_name: { storeId: store.id, name: 'OTHERS' } },
    create: { storeId: store.id, name: 'OTHERS' },
    update: {},
  });

  // =====================================================
  // 6. GST CATEGORY RULES
  // =====================================================
  const gstRules = [
    { category: 'Dairy & Beverages', gstClass: 'GST_5', gstRate: 5 },
    { category: 'Biscuits & Snacks', gstClass: 'GST_18', gstRate: 18 },
    { category: 'Cold Drinks & Juices', gstClass: 'GST_28', gstRate: 28 },
    { category: 'Edible Oil & Ghee', gstClass: 'GST_5', gstRate: 5 },
    { category: 'Rice, Atta & Dal', gstClass: 'EXEMPT', gstRate: 0 },
    { category: 'Spices & Masala', gstClass: 'GST_5', gstRate: 5 },
    { category: 'Personal Care', gstClass: 'GST_18', gstRate: 18 },
    { category: 'Household & Cleaning', gstClass: 'GST_18', gstRate: 18 },
  ];
  for (const r of gstRules) {
    await prisma.gSTCategoryRule.upsert({
      where: { category: r.category },
      create: { category: r.category, gstClass: r.gstClass as any, gstRate: r.gstRate },
      update: {},
    });
  }
  console.log('✅ GST Category Rules: 8 created');

  // =====================================================
  // 7. GLOBAL PRODUCTS
  // =====================================================
  const productData = [
    { name: 'AMUL CHAAS 200ML', baseUnit: 'Pcs', brandId: amulBrand.id, manufacturerId: amulMfr.id, categoryId: catDairy.id, hsnSacCode: '04039090', itemType: 'NORMAL' },
    { name: 'AMUL BUTTER 100GM', baseUnit: 'Pcs', brandId: amulBrand.id, manufacturerId: amulMfr.id, categoryId: catDairy.id, hsnSacCode: '04051000', itemType: 'NORMAL' },
    { name: 'BRITANNIA GOOD DAY 200GM', baseUnit: 'Pcs', brandId: britanniaBrand.id, categoryId: catBiscuits.id, hsnSacCode: '19053100', itemType: 'NORMAL' },
    { name: 'PARLE G 200GM', baseUnit: 'Pcs', brandId: parleBrand.id, categoryId: catBiscuits.id, hsnSacCode: '19053100', itemType: 'NORMAL' },
    { name: 'COCA COLA 600ML', baseUnit: 'Pcs', brandId: cocaColaBrand.id, categoryId: catBeverages.id, hsnSacCode: '22021010', itemType: 'NORMAL' },
    { name: 'FORTUNE SUNFLOWER OIL 1LTR', baseUnit: 'Pcs', categoryId: catEdibleOil.id, hsnSacCode: '15121190', itemType: 'NORMAL' },
    { name: 'INDIA GATE BASMATI RICE 5KG', baseUnit: 'Pcs', categoryId: catRice.id, hsnSacCode: '10063010', itemType: 'NORMAL' },
    { name: 'MDH GARAM MASALA 100GM', baseUnit: 'Pcs', categoryId: catSpices.id, hsnSacCode: '09109100', itemType: 'NORMAL' },
    { name: 'COLGATE ACTIVE SALT 200GM', baseUnit: 'Pcs', categoryId: catPersonalCare.id, hsnSacCode: '33061000', itemType: 'NORMAL' },
    { name: 'VIM DISHWASH GEL 750ML', baseUnit: 'Pcs', categoryId: catCleaning.id, hsnSacCode: '34022090', itemType: 'NORMAL' },
  ];

  const globalProducts: any[] = [];
  for (const p of productData) {
    const prod = await prisma.product.upsert({
      where: { id: `prod_${p.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}` },
      create: { id: `prod_${p.name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)}`, ...p },
      update: {},
    });
    globalProducts.push(prod);
  }
  console.log(`✅ Global Products: ${globalProducts.length} created`);

  // =====================================================
  // 8. STORE PRODUCTS WITH FULL ERP FIELDS
  // =====================================================

  // Mirrors the MARG ERP screen example: AMUL CHAAS 200ML.*15
  const spAmulChaas = await prisma.storeProduct.upsert({
    where: { storeId_legacyCode: { storeId: store.id, legacyCode: '001078' } },
    create: {
      storeId: store.id,
      productId: globalProducts[0].id,
      legacyCode: '001078',          // MARG: CODE (stored as text)
      displayName: 'AMUL CHAZ 200ML.*15',
      status: 'ACTIVE',              // MARG: STATUS = CONTINUE
      type: 'NORMAL',                // MARG: TYPE
      itemType: '1 NORMAL',          // MARG: ITEM TYPE
      isHidden: false,               // MARG: HIDE = No
      allowDecimalQty: false,        // MARG: DECIMAL = No
      packagingText: '15 PCS/BOX',   // MARG: PACKING
      colorType: null,               // MARG: COLOR TYPE → metadata
      groupId: grpOthers.id,         // MARG: GROUP
      source: 'erp_import',
      createdBy: owner.id,
    },
    update: {},
  });

  // Pricing (MARG screen values)
  await prisma.storeProductPricing.create({
    data: {
      storeProductId: spAmulChaas.id,
      mrp: 15.00,            // MARG: M.R.P.
      sellingPrice: 13.57,   // MARG: Rate-A (default selling)
      rateA: 13.57,          // MARG: Rate-A
      rateB: 12.95,          // MARG: Rate-B
      rateC: 14.38,          // MARG: Rate-C
      purchaseRate: 12.85,   // MARG: P.RATE
      costPerPiece: 12.72150,// MARG: COST/PCS
      priceIncludesTax: true,
      createdBy: owner.id,
    },
  });

  // Tax Profile (MARG: SGST 2.5%, CGST 2.5%, IGST 5%)
  await prisma.productTaxProfile.create({
    data: {
      storeProductId: spAmulChaas.id,
      hsnSacCode: '04039090',           // MARG: HSN/SAC
      localTaxabilityStatus: 'Taxable', // MARG: LOCAL
      centralTaxabilityStatus: 'Taxable',// MARG: CENTRAL
      isTaxable: true,
      gstRate: 5.00,
      cgstRate: 2.50,                   // MARG: CGST %
      sgstRate: 2.50,                   // MARG: SGST %
      igstRate: 5.00,                   // MARG: IGST %
      cessRate: 0.00,                   // MARG: CESS %
      cessAmountPerUnit: 0.00,
      taxInclusive: true,
      source: 'erp_import',
      createdBy: owner.id,
    },
  });

  // Inventory Policy (MARG fields)
  await prisma.productInventoryPolicy.create({
    data: {
      storeProductId: spAmulChaas.id,
      allowNegativeStock: false,  // MARG: NEGATIVE = No
      minimumQty: 5,
      maximumQty: 200,
      reorderQty: 30,
      defaultSaleQty: 1,
      boxConversionQty: 15,       // MARG: CONV.BOX = 15
      shelfLifeDays: 258,         // MARG: SHELFLIFE = 258 DAYS
      trackBatch: true,
      trackExpiry: true,
      stockUom: 'Pcs',
      purchaseUom: 'Box',
      saleUom: 'Pcs',
      createdBy: owner.id,
    },
  });

  // Discount Policy (MARG: DISCOUNT = Applicable)
  await prisma.productDiscountPolicy.create({
    data: {
      storeProductId: spAmulChaas.id,
      discountApplicable: true,   // MARG: DISCOUNT = Applicable
      itemDiscount1Percent: 2.00,
      itemDiscount2Percent: 0.50,
      maximumDiscountPercent: 5.00,
      rateOverrideAllowed: false,
      createdBy: owner.id,
    },
  });

  // Rack Location (MARG: RACK NO)
  await prisma.productRackLocation.create({
    data: { storeProductId: spAmulChaas.id, rackNo: 'A3', shelfNo: 'S2', zone: 'DAIRY' },
  });

  // Barcode
  await prisma.storeProductBarcode.upsert({
    where: { storeProductId_barcode: { storeProductId: spAmulChaas.id, barcode: '8901063013040' } },
    create: { storeProductId: spAmulChaas.id, barcode: '8901063013040', barcodeType: 'EAN_13', isPrimary: true, source: 'erp_import' },
    update: {},
  });

  // Seed more store products
  const moreProducts = [
    { product: globalProducts[1], legacyCode: '001079', displayName: 'AMUL BUTTER 100GM', mrp: 60.00, rateA: 56.00, purchaseRate: 52.00, barcode: '8901063011978', rack: 'A3', hsnSac: '04051000', cgst: 6, sgst: 6, igst: 12 },
    { product: globalProducts[2], legacyCode: '001080', displayName: 'BRITANNIA GOOD DAY 200GM', mrp: 35.00, rateA: 33.00, purchaseRate: 29.00, barcode: '8901063123456', rack: 'B1', hsnSac: '19053100', cgst: 9, sgst: 9, igst: 18 },
    { product: globalProducts[3], legacyCode: '001081', displayName: 'PARLE G BISCUIT 200GM', mrp: 25.00, rateA: 23.50, purchaseRate: 20.00, barcode: '8901063034567', rack: 'B2', hsnSac: '19053100', cgst: 9, sgst: 9, igst: 18 },
    { product: globalProducts[4], legacyCode: '001082', displayName: 'COCA COLA 600ML', mrp: 40.00, rateA: 38.00, purchaseRate: 34.00, barcode: '5449000000439', rack: 'C1', hsnSac: '22021010', cgst: 14, sgst: 14, igst: 28 },
    { product: globalProducts[5], legacyCode: '001083', displayName: 'FORTUNE SUNFLOWER OIL 1L', mrp: 145.00, rateA: 140.00, purchaseRate: 128.00, barcode: '8901063045678', rack: 'D1', hsnSac: '15121190', cgst: 2.5, sgst: 2.5, igst: 5 },
    { product: globalProducts[6], legacyCode: '001084', displayName: 'INDIA GATE BASMATI 5KG', mrp: 450.00, rateA: 430.00, purchaseRate: 390.00, barcode: '8901063056789', rack: 'E1', hsnSac: '10063010', cgst: 0, sgst: 0, igst: 0 },
    { product: globalProducts[8], legacyCode: '001085', displayName: 'COLGATE ACTIVE SALT 200G', mrp: 85.00, rateA: 80.00, purchaseRate: 72.00, barcode: '8901063067890', rack: 'F1', hsnSac: '33061000', cgst: 9, sgst: 9, igst: 18 },
    { product: globalProducts[9], legacyCode: '001086', displayName: 'VIM DISHWASH GEL 750ML', mrp: 110.00, rateA: 105.00, purchaseRate: 92.00, barcode: '8901063078901', rack: 'G1', hsnSac: '34022090', cgst: 9, sgst: 9, igst: 18 },
  ];

  for (const sp of moreProducts) {
    const storeProduct = await prisma.storeProduct.upsert({
      where: { storeId_legacyCode: { storeId: store.id, legacyCode: sp.legacyCode } },
      create: {
        storeId: store.id,
        productId: sp.product.id,
        legacyCode: sp.legacyCode,
        displayName: sp.displayName,
        status: 'ACTIVE',
        type: 'NORMAL',
        isHidden: false,
        allowDecimalQty: false,
        groupId: grpOthers.id,
        source: 'erp_import',
        createdBy: owner.id,
      },
      update: {},
    });

    await prisma.storeProductPricing.create({ data: { storeProductId: storeProduct.id, mrp: sp.mrp, sellingPrice: sp.rateA, rateA: sp.rateA, purchaseRate: sp.purchaseRate, priceIncludesTax: true, createdBy: owner.id } });
    await prisma.productTaxProfile.create({ data: { storeProductId: storeProduct.id, hsnSacCode: sp.hsnSac, isTaxable: sp.cgst > 0, gstRate: sp.cgst + sp.sgst, cgstRate: sp.cgst, sgstRate: sp.sgst, igstRate: sp.igst, taxInclusive: true, createdBy: owner.id } });
    await prisma.productInventoryPolicy.create({ data: { storeProductId: storeProduct.id, allowNegativeStock: false, minimumQty: 5, reorderQty: 20, stockUom: 'Pcs', saleUom: 'Pcs', purchaseUom: 'Pcs', createdBy: owner.id } });
    await prisma.productRackLocation.create({ data: { storeProductId: storeProduct.id, rackNo: sp.rack } });
    await prisma.storeProductBarcode.upsert({
      where: { storeProductId_barcode: { storeProductId: storeProduct.id, barcode: sp.barcode } },
      create: { storeProductId: storeProduct.id, barcode: sp.barcode, barcodeType: 'EAN_13', isPrimary: true, source: 'erp_import' },
      update: {},
    });
  }
  console.log(`✅ Store Products: ${moreProducts.length + 1} created with full ERP fields`);

  // =====================================================
  // 9. INVENTORY (Opening Stock)
  // =====================================================
  const storeProducts = await prisma.storeProduct.findMany({ where: { storeId: store.id } });
  for (const sp of storeProducts) {
    await prisma.inventory.upsert({
      where: { storeId_storeProductId_batchNo: { storeId: store.id, storeProductId: sp.id, batchNo: 'OPENING' } },
      create: { storeId: store.id, storeProductId: sp.id, batchNo: 'OPENING', quantityBase: 50 },
      update: {},
    });
    // StockMovement for audit
    await prisma.stockMovement.create({
      data: {
        storeId: store.id,
        storeProductId: sp.id,
        type: 'OPENING_STOCK',
        quantityDelta: 50,
        newQty: 50,
        sourceType: 'SEED',
        note: 'Opening stock from seed',
        createdBy: owner.id,
      },
    });
    // StockBalance
    await prisma.stockBalance.upsert({
      where: { storeId_storeProductId: { storeId: store.id, storeProductId: sp.id } },
      create: { storeId: store.id, storeProductId: sp.id, balance: 50 },
      update: { balance: 50 },
    });
  }
  console.log(`✅ Inventory: Opening stock set for ${storeProducts.length} products`);

  // =====================================================
  // 10. PARTY LEDGER (MARG-style Supplier)
  // =====================================================

  // MARG screen example: AMAZON DISTRIBUTORS PVT.LTD.
  const amazonLedger = await prisma.partyLedger.upsert({
    where: { storeId_name: { storeId: store.id, name: 'AMAZON DISTRIBUTORS PVT.LTD.' } },
    create: {
      storeId: store.id,
      name: 'AMAZON DISTRIBUTORS PVT.LTD.',
      legacyCode: 'SUP001',
      station: 'DELHI',
      accountGroup: 'SUNDRY CREDITORS',
      balancingMethod: 'Bill by Bill',
      ledgerType: 'REGISTERED',
      category: 'OTHERS',
      ledgerDate: new Date('2013-04-24'),
      isHidden: false,
      erpToErpEnabled: false,
    },
    update: {},
  });

  // Opening Balance (MARG: 43399.00 Cr)
  await prisma.ledgerOpeningBalance.create({
    data: {
      partyLedgerId: amazonLedger.id,
      financialYear: '2024-25',
      amount: 43399.00,
      balanceType: 'CR',
      asOfDate: new Date('2024-04-01'),
      createdBy: owner.id,
    },
  });

  // Contact (MARG: PUSH PENDR / 9897333147)
  await prisma.supplierContact.create({
    data: {
      partyLedgerId: amazonLedger.id,
      name: 'PUSH PENDR',
      mobile: '+919897333147',
      isPrimary: true,
    },
  });

  // Address
  await prisma.supplierAddress.create({
    data: {
      partyLedgerId: amazonLedger.id,
      addressType: 'BILLING',
      city: 'Delhi',
      stateCode: '07',
      stateName: 'Delhi',
      country: 'INDIA',
      isDefaultBilling: true,
    },
  });

  // Tax Profile (MARG: GSTIN, PAN, State)
  await prisma.supplierTaxProfile.create({
    data: {
      partyLedgerId: amazonLedger.id,
      gstHeading: 'Local',
      gstin: '07AAFCA9197E1ZF',   // MARG: GSTIN
      gstRegistrationType: 'REGISTERED',
      pan: 'AAFCA9197E',          // Extracted from GSTIN chars 3-12
      stateCode: '07',             // From GSTIN first 2 digits
      stateName: 'Delhi',
      gstnVerified: false,
    },
  });

  // Payment Policy (MARG: Hold Payment = No)
  await prisma.supplierPaymentPolicy.create({
    data: {
      partyLedgerId: amazonLedger.id,
      holdPayment: false,
      creditDays: 30,
      paymentTerms: 'Net 30',
      gstr1ComplianceRequired: true,
    },
  });

  // Supplier (legacy table) linked to PartyLedger
  const amazonSupplier = await prisma.supplier.upsert({
    where: { storeId_gstin: { storeId: store.id, gstin: '07AAFCA9197E1ZF' } },
    create: {
      storeId: store.id,
      name: 'AMAZON DISTRIBUTORS PVT.LTD.',
      ledgerName: 'AMAZON DISTRIBUTORS PVT.LTD.',
      accountGroup: 'SUNDRY CREDITORS',
      gstin: '07AAFCA9197E1ZF',
      pan: 'AAFCA9197E',
      mobile: '+919897333147',
      state: 'Delhi',
      country: 'INDIA',
      openingBalance: 43399.00,
      openingBalanceType: 'CR',
    },
    update: {},
  });

  // Link SupplierProfile
  await prisma.supplierProfile.upsert({
    where: { partyLedgerId: amazonLedger.id },
    create: { partyLedgerId: amazonLedger.id, supplierId: amazonSupplier.id },
    update: {},
  });

  // More suppliers
  const amulSupplier = await prisma.supplier.upsert({
    where: { storeId_gstin: { storeId: store.id, gstin: '24AAACA0615B1ZQ' } },
    create: {
      storeId: store.id,
      name: 'AMUL DAIRY DISTRIBUTORS',
      accountGroup: 'SUNDRY CREDITORS',
      gstin: '24AAACA0615B1ZQ',
      pan: 'AAACA0615B',
      mobile: '+919898001234',
      state: 'Gujarat',
      country: 'INDIA',
      openingBalance: 12500.00,
      openingBalanceType: 'CR',
    },
    update: {},
  });

  console.log('✅ Party Ledgers & Suppliers: Amazon Distributors, Amul Dairy');

  // =====================================================
  // 11. LEGACY ENTITY MAPPING (MARG import trace)
  // =====================================================
  await prisma.legacyEntityMapping.upsert({
    where: {
      storeId_legacySystem_legacyEntityType_legacyEntityId: {
        storeId: store.id,
        legacySystem: LegacySystem.MARG_ERP,
        legacyEntityType: ImportEntityType.PRODUCT,
        legacyEntityId: '001078',
      },
    },
    create: {
      storeId: store.id,
      legacySystem: LegacySystem.MARG_ERP,
      legacyEntityType: ImportEntityType.PRODUCT,
      legacyEntityId: '001078',
      rawLegacyPayload: {
        CODE: '001078',
        PRODUCT: 'AMUL CHAZ 200ML.*15',
        UNIT: 'Pcs',
        TYPE: 'NORMAL',
        'ITEM TYPE': '1 NORMAL',
        STATUS: 'CONTINUE',
        HIDE: 'No',
        BARCODE: '8901063013040',
        PACKING: '15 PCS/BOX',
        DECIMAL: 'No',
        COMPANY: 'AMUL INDIA LTD.',
        GROUP: 'OTHERS',
        CATEGORY: 'DRINK',
        'HSN/SAC': '04039090',
        'LOCAL TAX STATUS': 'Taxable',
        'CENTRAL TAX STATUS': 'Taxable',
        'M.R.P.': '15.00',
        'Rate-A': '13.57',
        'P.RATE': '12.85',
        'Rate-B': '12.95',
        'Rate-C': '14.38',
        'COST/PCS': '12.72150',
        'SGST %': '2.50',
        'CGST %': '2.50',
        'IGST %': '5.00',
        'CESS %': '0.00',
        'CONV.BOX': '15',
        SHELFLIFE: '258',
        NEGATIVE: 'No',
        DISCOUNT: 'Applicable',
        source: 'MARG_ERP',
        importedAt: new Date().toISOString(),
      },
      zapKirnanaEntityType: 'StoreProduct',
      zapKirnanaEntityId: spAmulChaas.id,
    },
    update: {},
  });

  // MARG supplier mapping
  await prisma.legacyEntityMapping.upsert({
    where: {
      storeId_legacySystem_legacyEntityType_legacyEntityId: {
        storeId: store.id,
        legacySystem: LegacySystem.MARG_ERP,
        legacyEntityType: ImportEntityType.LEDGER,
        legacyEntityId: 'SUP001',
      },
    },
    create: {
      storeId: store.id,
      legacySystem: LegacySystem.MARG_ERP,
      legacyEntityType: ImportEntityType.LEDGER,
      legacyEntityId: 'SUP001',
      rawLegacyPayload: {
        'Ledger Name': 'AMAZON DISTRIBUTORS PVT.LTD.',
        'Account Group': 'SUNDRY CREDITORS (SUPPLIERS)',
        'Balancing Method': 'Bill by Bill',
        Opening: '43399.00',
        'Cr/Dr': 'Cr',
        'GST Heading': 'Local',
        GSTIN: '07AAFCA9197E1ZF',
        'I.T. PAN No.': 'AAFCA9197E',
        State: '07-DELHI',
        'Ledger Type': 'REGISTERED',
        'Contact Person': 'PUSH PENDR',
        Mobile: '9897333147',
        'Hold Payment': 'No',
        'Ledger Date': '24-04-2013',
        source: 'MARG_ERP',
      },
      zapKirnanaEntityType: 'PartyLedger',
      zapKirnanaEntityId: amazonLedger.id,
    },
    update: {},
  });
  console.log('✅ Legacy Entity Mappings: MARG import traces created');

  // =====================================================
  // 12. TILL (POS Cash Drawer)
  // =====================================================
  const till = await prisma.till.create({
    data: {
      storeId: store.id,
      status: 'OPEN',
      openingBalance: 2000.00,
      expectedBalance: 2000.00,
    },
  });
  console.log('✅ Till: Opened with ₹2000 opening balance');

  // =====================================================
  // 13. SCANNER DEVICE
  // =====================================================
  await prisma.scannerDevice.upsert({
    where: { deviceCode: 'SCAN_DEV_001' },
    create: {
      deviceCode: 'SCAN_DEV_001',
      storeId: store.id,
      deviceName: 'Counter Scanner 1',
      deviceType: 'ANDROID_PHONE',
      assignedToId: cashier.id,
      status: 'ACTIVE',
    },
    update: {},
  });
  console.log('✅ Scanner Device: SCAN_DEV_001 assigned to cashier');

  // =====================================================
  // SUMMARY
  // =====================================================
  const productCount = await prisma.storeProduct.count({ where: { storeId: store.id } });
  const supplierCount = await prisma.supplier.count({ where: { storeId: store.id } });
  const ledgerCount = await prisma.partyLedger.count({ where: { storeId: store.id } });

  console.log('\n🎉 ZapKirnana ERP Seed Complete!\n');
  console.log(`   Store:            ${store.name}`);
  console.log(`   Store Products:   ${productCount} (with pricing, tax, inventory, discount, rack)`);
  console.log(`   Suppliers:        ${supplierCount}`);
  console.log(`   Party Ledgers:    ${ledgerCount} (with contacts, addresses, tax profiles, payment policy)`);
  console.log(`   Legacy Mappings:  2 (MARG ERP product + ledger traces preserved)`);
  console.log(`\n   Login: owner@zapkirnana.com / ZapKirnana@2025`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
