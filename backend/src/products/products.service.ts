import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * ProductsService — operates on StoreProduct (store-local layer) not the global Product.
 * All pricing reads come from StoreProductPricing (latest active record).
 * All tax reads come from ProductTaxProfile (latest active record).
 * All barcodes come from StoreProductBarcode.
 */

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';

function inferGstClass(categories: string): string {
  const c = categories.toLowerCase();
  if (c.includes('beverage') || c.includes('aerated') || c.includes('cola') || c.includes('soda')) return 'GST_28';
  if (c.includes('biscuit') || c.includes('pasta') || c.includes('noodle') || c.includes('ice cream') || c.includes('chocolate')) return 'GST_18';
  if (c.includes('juice') || c.includes('butter') || c.includes('cheese') || c.includes('ghee') || c.includes('namkeen')) return 'GST_12';
  if (c.includes('oil') || c.includes('sugar') || c.includes('spice') || c.includes('tea') || c.includes('coffee')) return 'GST_5';
  return 'EXEMPT';
}

const GST_RATE_MAP: Record<string, number> = { EXEMPT: 0, GST_5: 5, GST_12: 12, GST_18: 18, GST_28: 28 };

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // STORE PRODUCT QUERIES
  // =====================================================

  /** Full StoreProduct with pricing, tax, barcodes, rack, inventory policy */
  async findAll(storeId: string, opts?: { includeHidden?: boolean; includeInactive?: boolean }) {
    return this.prisma.storeProduct.findMany({
      where: {
        storeId,
        ...(opts?.includeHidden ? {} : { isHidden: false }),
        ...(opts?.includeInactive ? {} : { status: { not: 'INACTIVE' } }),
      },
      include: {
        product: { include: { brand: true, manufacturer: true, category: true } },
        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        inventoryPolicy: true,
        discountPolicy: true,
        rackLocations: true,
        productBarcodes: { where: { isActive: true } },
        stockBalances: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async findOne(storeProductId: string) {
    const sp = await this.prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: {
        product: { include: { brand: true, manufacturer: true, category: true } },
        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        inventoryPolicy: true,
        discountPolicy: true,
        schemes: { where: { isActive: true } },
        rackLocations: true,
        productBarcodes: { where: { isActive: true } },
        priceHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
        costHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        stockBalances: true,
        inventory: true,
      },
    });
    if (!sp) throw new NotFoundException(`StoreProduct ${storeProductId} not found`);
    return sp;
  }

  async findByBarcode(storeId: string, barcode: string) {
    // Look up via StoreProductBarcode first (most accurate)
    const spBarcode = await this.prisma.storeProductBarcode.findFirst({
      where: { barcode, isActive: true, storeProduct: { storeId } },
      include: {
        storeProduct: {
          include: {
            product: { include: { brand: true, category: true } },
            pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
            taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
            inventoryPolicy: true,
            stockBalances: true,
          },
        },
      },
    });
    if (spBarcode) return spBarcode.storeProduct;

    // Fallback: global BarcodeRegistry
    const registry = await this.prisma.barcodeRegistry.findFirst({
      where: { barcodeValue: barcode, isActive: true, OR: [{ storeId }, { storeId: null }] },
      include: { storeProduct: { include: { pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 } } } },
    });
    if (registry?.storeProduct) return registry.storeProduct;

    throw new NotFoundException(`Barcode ${barcode} not found in store ${storeId}`);
  }

  // =====================================================
  // CREATE STORE PRODUCT
  // =====================================================

  async createStoreProduct(data: {
    storeId: string;
    createdBy: string;
    // Basic
    name: string;
    displayName?: string;
    brandName?: string;
    categoryName?: string;
    baseUnit?: string;
    barcode?: string;
    legacyCode?: string;
    status?: string;
    isHidden?: boolean;
    allowDecimalQty?: boolean;
    packagingText?: string;
    itemType?: string;
    type?: string;
    // Pricing
    mrp?: number;
    sellingPrice?: number;
    rateA?: number;
    rateB?: number;
    rateC?: number;
    purchaseRate?: number;
    costPerPiece?: number;
    // Tax
    hsnSacCode?: string;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cessRate?: number;
    isTaxable?: boolean;
    localTaxabilityStatus?: string;
    centralTaxabilityStatus?: string;
    // Inventory Policy
    allowNegativeStock?: boolean;
    minimumQty?: number;
    maximumQty?: number;
    reorderQty?: number;
    defaultSaleQty?: number;
    boxConversionQty?: number;
    shelfLifeDays?: number;
    // Rack
    rackNo?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve or create Brand
      let brandId: string | undefined;
      if (data.brandName) {
        const brand = await tx.brand.upsert({
          where: { name: data.brandName.trim() },
          create: { name: data.brandName.trim(), normalizedName: data.brandName.toLowerCase().trim() },
          update: {},
        });
        brandId = brand.id;
      }

      // 2. Resolve or create Category
      let categoryId: string | undefined;
      if (data.categoryName) {
        const cat = await tx.globalCategory.upsert({
          where: { name: data.categoryName.trim() },
          create: { name: data.categoryName.trim() },
          update: {},
        });
        categoryId = cat.id;
      }

      // 3. Create global Product if not exists (match by name + brand)
      const existingProduct = await tx.product.findFirst({
        where: { name: data.name.trim(), ...(brandId ? { brandId } : {}) },
      });

      const product = existingProduct ?? await tx.product.create({
        data: {
          name: data.name.trim(),
          normalizedName: data.name.toLowerCase().trim(),
          baseUnit: data.baseUnit ?? 'PCS',
          brandId,
          categoryId,
          hsnSacCode: data.hsnSacCode,
          allowDecimalQuantity: data.allowDecimalQty ?? false,
        },
      });

      // 4. Create StoreProduct
      const storeProduct = await tx.storeProduct.create({
        data: {
          storeId: data.storeId,
          productId: product.id,
          legacyCode: data.legacyCode,
          displayName: data.displayName ?? data.name,
          status: data.status ?? 'ACTIVE',
          type: data.type ?? 'NORMAL',
          itemType: data.itemType,
          isHidden: data.isHidden ?? false,
          allowDecimalQty: data.allowDecimalQty ?? false,
          packagingText: data.packagingText,
          source: 'manual',
          createdBy: data.createdBy,
        },
      });

      // 5. Barcode
      if (data.barcode) {
        await tx.storeProductBarcode.create({
          data: { storeProductId: storeProduct.id, barcode: data.barcode, isPrimary: true, source: 'manual' },
        });
      }

      // 6. Pricing
      await tx.storeProductPricing.create({
        data: {
          storeProductId: storeProduct.id,
          mrp: data.mrp != null ? new Decimal(data.mrp) : undefined,
          sellingPrice: data.sellingPrice != null ? new Decimal(data.sellingPrice) : (data.rateA != null ? new Decimal(data.rateA) : undefined),
          rateA: data.rateA != null ? new Decimal(data.rateA) : undefined,
          rateB: data.rateB != null ? new Decimal(data.rateB) : undefined,
          rateC: data.rateC != null ? new Decimal(data.rateC) : undefined,
          purchaseRate: data.purchaseRate != null ? new Decimal(data.purchaseRate) : undefined,
          costPerPiece: data.costPerPiece != null ? new Decimal(data.costPerPiece) : undefined,
          createdBy: data.createdBy,
        },
      });

      // 7. Tax Profile
      const cgst = data.cgstRate ?? 0;
      const sgst = data.sgstRate ?? 0;
      await tx.productTaxProfile.create({
        data: {
          storeProductId: storeProduct.id,
          hsnSacCode: data.hsnSacCode,
          isTaxable: data.isTaxable ?? cgst > 0,
          localTaxabilityStatus: data.localTaxabilityStatus ?? (cgst > 0 ? 'Taxable' : 'Exempt'),
          centralTaxabilityStatus: data.centralTaxabilityStatus ?? (cgst > 0 ? 'Taxable' : 'Exempt'),
          gstRate: cgst + sgst > 0 ? new Decimal(cgst + sgst) : undefined,
          cgstRate: cgst > 0 ? new Decimal(cgst) : undefined,
          sgstRate: sgst > 0 ? new Decimal(sgst) : undefined,
          igstRate: data.igstRate != null ? new Decimal(data.igstRate) : undefined,
          cessRate: data.cessRate != null ? new Decimal(data.cessRate) : undefined,
          createdBy: data.createdBy,
        },
      });

      // 8. Inventory Policy (with sensible defaults)
      await tx.productInventoryPolicy.create({
        data: {
          storeProductId: storeProduct.id,
          allowNegativeStock: data.allowNegativeStock ?? false,
          minimumQty: data.minimumQty != null ? new Decimal(data.minimumQty) : undefined,
          maximumQty: data.maximumQty != null ? new Decimal(data.maximumQty) : undefined,
          reorderQty: data.reorderQty != null ? new Decimal(data.reorderQty) : undefined,
          defaultSaleQty: data.defaultSaleQty != null ? new Decimal(data.defaultSaleQty) : new Decimal(1),
          boxConversionQty: data.boxConversionQty != null ? new Decimal(data.boxConversionQty) : undefined,
          shelfLifeDays: data.shelfLifeDays,
          stockUom: data.baseUnit ?? 'PCS',
          saleUom: data.baseUnit ?? 'PCS',
          purchaseUom: data.baseUnit ?? 'PCS',
          createdBy: data.createdBy,
        },
      });

      // 9. Rack Location
      if (data.rackNo) {
        await tx.productRackLocation.create({
          data: { storeProductId: storeProduct.id, rackNo: data.rackNo },
        });
      }

      // 10. StockBalance starting at 0
      await tx.stockBalance.create({
        data: { storeId: data.storeId, storeProductId: storeProduct.id, balance: 0 },
      });

      return storeProduct;
    });
  }

  // =====================================================
  // UPDATE STORE PRODUCT
  // =====================================================

  async updateStoreProduct(storeProductId: string, storeId: string, data: {
    displayName?: string;
    status?: string;
    isHidden?: boolean;
    packagingText?: string;
    rackNo?: string;
    updatedBy?: string;
  }) {
    const sp = await this.prisma.storeProduct.findFirst({ where: { id: storeProductId, storeId } });
    if (!sp) throw new NotFoundException('StoreProduct not found');
    return this.prisma.storeProduct.update({
      where: { id: storeProductId },
      data: {
        displayName: data.displayName,
        status: data.status,
        isHidden: data.isHidden,
        packagingText: data.packagingText,
        updatedBy: data.updatedBy,
      },
    });
  }

  async updatePricing(storeProductId: string, updatedBy: string, data: {
    mrp?: number;
    sellingPrice?: number;
    rateA?: number;
    rateB?: number;
    rateC?: number;
    purchaseRate?: number;
    costPerPiece?: number;
  }) {
    // Create a new versioned pricing record (append-only)
    return this.prisma.storeProductPricing.create({
      data: {
        storeProductId,
        mrp: data.mrp != null ? new Decimal(data.mrp) : undefined,
        sellingPrice: data.sellingPrice != null ? new Decimal(data.sellingPrice) : undefined,
        rateA: data.rateA != null ? new Decimal(data.rateA) : undefined,
        rateB: data.rateB != null ? new Decimal(data.rateB) : undefined,
        rateC: data.rateC != null ? new Decimal(data.rateC) : undefined,
        purchaseRate: data.purchaseRate != null ? new Decimal(data.purchaseRate) : undefined,
        costPerPiece: data.costPerPiece != null ? new Decimal(data.costPerPiece) : undefined,
        createdBy: updatedBy,
      },
    });
  }

  // =====================================================
  // BARCODE ENRICHMENT (Tier 1: local DB → Tier 2: OFF → Tier 3: partial)
  // =====================================================

  async enrichFromBarcode(barcode: string, storeId: string) {
    // Tier 1 — local StoreProduct via barcode
    try {
      const local = await this.findByBarcode(storeId, barcode);
      if (local) {
        const pricing = local.pricing?.[0];
        const tax = (local as any).taxProfile?.[0];
        return {
          source: 'local_cache',
          storeProductId: local.id,
          name: local.displayName ?? (local as any).product?.name,
          brand: (local as any).product?.brand?.name,
          barcode,
          mrp: pricing?.mrp ? Number(pricing.mrp) : 0,
          sellingPrice: pricing?.sellingPrice ? Number(pricing.sellingPrice) : 0,
          cgstRate: tax?.cgstRate ? Number(tax.cgstRate) : 0,
          sgstRate: tax?.sgstRate ? Number(tax.sgstRate) : 0,
        };
      }
    } catch { /* not found locally */ }

    // Tier 2 — Open Food Facts
    try {
      const res = await fetch(`${OPEN_FOOD_FACTS_URL}/${barcode}.json?fields=product_name,brands,categories,image_url`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.status === 1 && data.product) {
          const p = data.product;
          const categoriesRaw: string = p.categories ?? '';
          const gstClass = inferGstClass(categoriesRaw);
          return {
            source: 'open_food_facts',
            barcode,
            name: p.product_name ?? 'Unknown Product',
            brand: p.brands ?? '',
            category: categoriesRaw.split(',')[0]?.trim() ?? 'Grocery',
            imageUrl: p.image_url ?? null,
            mrp: 0,
            sellingPrice: 0,
            gstClass,
            gstRate: GST_RATE_MAP[gstClass],
          };
        }
      }
    } catch { /* OFF unavailable */ }

    return { source: 'unknown', barcode, name: '', category: '', mrp: 0, sellingPrice: 0 };
  }

  // =====================================================
  // PENDING PRODUCTS (APPROVAL FLOW)
  // =====================================================

  async getPendingProducts(storeId: string) {
    return this.prisma.pendingProduct.findMany({
      where: { storeId, status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true, role: true } } },
    });
  }

  async approvePendingProduct(id: string, approvedBy: string, data: {
    name: string;
    category?: string;
    mrp: number;
    sellingPrice: number;
    cgstRate?: number;
    sgstRate?: number;
    hsnSacCode?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.pendingProduct.findUnique({ where: { id } });
      if (!pending) throw new BadRequestException('Pending product not found');
      if (pending.status !== 'PENDING_REVIEW') throw new BadRequestException('Already processed');

      // Create via createStoreProduct logic
      let categoryId: string | undefined;
      if (data.category) {
        const cat = await tx.globalCategory.upsert({
          where: { name: data.category.trim() },
          create: { name: data.category.trim() },
          update: {},
        });
        categoryId = cat.id;
      }

      const product = await tx.product.create({
        data: {
          name: data.name,
          normalizedName: data.name.toLowerCase(),
          baseUnit: 'PCS',
          categoryId,
          hsnSacCode: data.hsnSacCode,
        },
      });

      const storeProduct = await tx.storeProduct.create({
        data: {
          storeId: pending.storeId,
          productId: product.id,
          displayName: data.name,
          status: 'ACTIVE',
          source: 'approval',
          createdBy: approvedBy,
        },
      });

      if (pending.barcode) {
        await tx.storeProductBarcode.create({
          data: { storeProductId: storeProduct.id, barcode: pending.barcode, isPrimary: true, source: 'approval' },
        });
        await tx.barcodeRegistry.create({
          data: {
            storeId: pending.storeId,
            storeProductId: storeProduct.id,
            barcodeValue: pending.barcode,
            barcodeScope: 'GS1_EXTERNAL_PRODUCT',
          },
        });
      }

      await tx.storeProductPricing.create({
        data: {
          storeProductId: storeProduct.id,
          mrp: data.mrp != null ? new Decimal(data.mrp) : undefined,
          sellingPrice: new Decimal(data.sellingPrice),
          createdBy: approvedBy,
        },
      });

      const cgst = data.cgstRate ?? 0;
      const sgst = data.sgstRate ?? 0;
      await tx.productTaxProfile.create({
        data: {
          storeProductId: storeProduct.id,
          hsnSacCode: data.hsnSacCode,
          isTaxable: cgst > 0,
          gstRate: cgst + sgst > 0 ? new Decimal(cgst + sgst) : undefined,
          cgstRate: cgst > 0 ? new Decimal(cgst) : undefined,
          sgstRate: sgst > 0 ? new Decimal(sgst) : undefined,
          createdBy: approvedBy,
        },
      });

      await tx.productInventoryPolicy.create({
        data: { storeProductId: storeProduct.id, allowNegativeStock: false, defaultSaleQty: new Decimal(1), createdBy: approvedBy },
      });

      await tx.stockBalance.create({
        data: { storeId: pending.storeId, storeProductId: storeProduct.id, balance: 0 },
      });

      await tx.pendingProduct.update({
        where: { id },
        data: { status: 'APPROVED', approvedProductId: storeProduct.id },
      });

      return storeProduct;
    });
  }

  async rejectPendingProduct(id: string) {
    const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
    if (!pending) throw new BadRequestException('Pending product not found');
    return this.prisma.pendingProduct.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  // =====================================================
  // CREATE PENDING PRODUCT FROM UNKNOWN BARCODE SCAN
  // =====================================================
  async createPendingFromBarcode(data: {
    storeId: string;
    barcode: string;
    createdById: string;
    suggestedName?: string;
    mrp?: number;
    sellingPrice?: number;
    supplierId?: string;
  }) {
    const enriched = await this.enrichFromBarcode(data.barcode, data.storeId);
    return this.prisma.pendingProduct.create({
      data: {
        storeId: data.storeId,
        barcode: data.barcode,
        suggestedName: data.suggestedName ?? (enriched as any).name,
        suggestedCategory: (enriched as any).category,
        mrp: data.mrp != null ? new Decimal(data.mrp) : null,
        sellingPrice: data.sellingPrice != null ? new Decimal(data.sellingPrice) : null,
        supplierId: data.supplierId,
        imageUrl: (enriched as any).imageUrl,
        createdById: data.createdById,
        status: 'PENDING_REVIEW',
      },
    });
  }
}
