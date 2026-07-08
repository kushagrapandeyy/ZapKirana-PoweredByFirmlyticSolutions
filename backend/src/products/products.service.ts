import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { OPEN_FOOD_FACTS_URL, GST_RATE_MAP, inferGstClass, OffEnrichmentResult } from '../common/gst/gst.utils';


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
  // PRODUCT MASTER VIEW — COMPOSED ENDPOINT
  // =====================================================

  /**
   * Returns a single ProductMasterView — every sub-table in one call.
   * The UI gets one clean object. No waterfall fetches.
   */
  async findOneMaster(storeProductId: string) {
    const sp = await this.prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: {
        product: {
          include: {
            brand: true,
            manufacturer: true,
            category: true,
          },
        },
        group: true,
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
      },
    });
    if (!sp) throw new NotFoundException(`StoreProduct ${storeProductId} not found`);
    return sp;
  }

  /**
   * Validates a product payload WITHOUT saving.
   * Returns field errors + a live GST calculation preview.
   * Used by the UI before showing the save confirmation.
   */
  validateMaster(data: ProductMasterPayload): ProductValidationResult {
    const errors: string[] = [];

    const cgst = Number(data.taxProfile?.cgstRate ?? 0);
    const sgst = Number(data.taxProfile?.sgstRate ?? 0);
    const igst = Number(data.taxProfile?.igstRate ?? 0);
    const gstTotal = cgst + sgst;

    if (cgst > 0 && sgst > 0 && Math.abs(cgst - sgst) > 0.001) {
      errors.push('CGST and SGST should be equal for local sales (each = GST/2).');
    }
    if (igst > 0 && Math.abs(igst - gstTotal) > 0.001) {
      errors.push('IGST must equal CGST + SGST for interstate transactions.');
    }

    const mrp = Number(data.pricing?.mrp ?? 0);
    const selling = Number(data.pricing?.sellingPrice ?? mrp);
    const purchaseRate = Number(data.pricing?.purchaseRate ?? 0);

    if (mrp > 0 && selling > mrp) {
      errors.push('Selling price cannot exceed MRP unless rate override is explicitly allowed.');
    }
    if (purchaseRate > 0 && mrp > 0 && purchaseRate > mrp) {
      errors.push('Purchase rate is higher than MRP — confirm this is intentional.');
    }

    if (data.taxProfile?.hsnSacCode && /^\d+$/.test(data.taxProfile.hsnSacCode) === false) {
      errors.push('HSN/SAC code should contain only digits (stored as a string to preserve leading zeros).');
    }

    // GST Preview Calculation
    let gstPreview: GstPreview | null = null;
    if (mrp > 0 && gstTotal > 0) {
      const taxInclusive = data.taxProfile?.taxInclusive !== false; // default true
      if (taxInclusive) {
        const taxableValue = mrp / (1 + gstTotal / 100);
        const gstAmount = mrp - taxableValue;
        gstPreview = {
          mrp,
          taxInclusive,
          gstRate: gstTotal,
          cgstRate: cgst,
          sgstRate: sgst,
          igstRate: igst,
          taxableValue: Math.round(taxableValue * 100) / 100,
          gstAmount: Math.round(gstAmount * 100) / 100,
          finalSalePrice: mrp,
        };
      } else {
        const gstAmount = mrp * gstTotal / 100;
        gstPreview = {
          mrp,
          taxInclusive,
          gstRate: gstTotal,
          cgstRate: cgst,
          sgstRate: sgst,
          igstRate: igst,
          taxableValue: mrp,
          gstAmount: Math.round(gstAmount * 100) / 100,
          finalSalePrice: Math.round((mrp + gstAmount) * 100) / 100,
        };
      }
    }

    return { valid: errors.length === 0, errors, gstPreview };
  }

  /**
   * Full transactional fan-out update of all sub-tables.
   * Appends price history on any pricing change.
   */
  async updateMaster(storeProductId: string, data: ProductMasterPayload, updatedBy: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.storeProduct.findUnique({ where: { id: storeProductId } });
      if (!existing) throw new NotFoundException('StoreProduct not found');

      // 1. StoreProduct core fields
      if (data.storeProduct) {
        await tx.storeProduct.update({
          where: { id: storeProductId },
          data: {
            displayName: data.storeProduct.displayName,
            status: data.storeProduct.status,
            type: data.storeProduct.type,
            itemType: data.storeProduct.itemType,
            isHidden: data.storeProduct.isHidden,
            allowDecimalQty: data.storeProduct.allowDecimalQty,
            packagingText: data.storeProduct.packagingText,
            colorType: data.storeProduct.colorType,
            manufacturerLegacyRef: data.storeProduct.manufacturerLegacyRef,
            updatedBy,
          },
        });
      }

      // 2. Global Product (name, HSN, unit)
      if (data.product) {
        await tx.product.update({
          where: { id: existing.productId },
          data: {
            name: data.product.name,
            baseUnit: data.product.baseUnit,
            hsnSacCode: data.taxProfile?.hsnSacCode ?? data.product.hsnSacCode,
            allowDecimalQuantity: data.storeProduct?.allowDecimalQty,
          },
        });
      }

      // 3. Pricing — append a new versioned row, record history
      if (data.pricing) {
        const prevPricing = await tx.storeProductPricing.findFirst({
          where: { storeProductId },
          orderBy: { effectiveFrom: 'desc' },
        });

        await tx.storeProductPricing.create({
          data: {
            storeProductId,
            mrp: data.pricing.mrp != null ? new Decimal(data.pricing.mrp) : undefined,
            sellingPrice: data.pricing.sellingPrice != null ? new Decimal(data.pricing.sellingPrice) : undefined,
            rateA: data.pricing.rateA != null ? new Decimal(data.pricing.rateA) : undefined,
            rateB: data.pricing.rateB != null ? new Decimal(data.pricing.rateB) : undefined,
            rateC: data.pricing.rateC != null ? new Decimal(data.pricing.rateC) : undefined,
            purchaseRate: data.pricing.purchaseRate != null ? new Decimal(data.pricing.purchaseRate) : undefined,
            costPerPiece: data.pricing.costPerPiece != null ? new Decimal(data.pricing.costPerPiece) : undefined,
            landingCost: data.pricing.landingCost != null ? new Decimal(data.pricing.landingCost) : undefined,
            createdBy: updatedBy,
          },
        });

        // Append to price history for audit
        const fields: Array<keyof typeof data.pricing> = ['mrp', 'sellingPrice', 'rateA', 'rateB', 'rateC'];
        for (const field of fields) {
          const newVal = data.pricing[field];
          const oldVal = prevPricing ? Number((prevPricing as any)[field] ?? 0) : null;
          if (newVal != null && oldVal != null && Number(newVal) !== oldVal) {
            await tx.productPriceHistory.create({
              data: {
                storeProductId,
                changedField: field as string,
                oldValue: new Decimal(oldVal),
                newValue: new Decimal(newVal),
                reason: 'manual_master_edit',
                changedBy: updatedBy,
              },
            });
          }
        }
      }

      // 4. Tax Profile — append versioned row
      if (data.taxProfile) {
        const cgst = data.taxProfile.cgstRate ?? 0;
        const sgst = data.taxProfile.sgstRate ?? 0;
        await tx.productTaxProfile.create({
          data: {
            storeProductId,
            hsnSacCode: data.taxProfile.hsnSacCode,
            localTaxabilityStatus: data.taxProfile.localTaxabilityStatus,
            centralTaxabilityStatus: data.taxProfile.centralTaxabilityStatus,
            isTaxable: data.taxProfile.isTaxable ?? cgst > 0,
            taxInclusive: data.taxProfile.taxInclusive ?? true,
            gstRate: cgst + sgst > 0 ? new Decimal(cgst + sgst) : undefined,
            cgstRate: cgst > 0 ? new Decimal(cgst) : undefined,
            sgstRate: sgst > 0 ? new Decimal(sgst) : undefined,
            igstRate: data.taxProfile.igstRate != null ? new Decimal(data.taxProfile.igstRate) : undefined,
            cessRate: data.taxProfile.cessRate != null ? new Decimal(data.taxProfile.cessRate) : undefined,
            cessAmountPerUnit: data.taxProfile.cessAmountPerUnit != null ? new Decimal(data.taxProfile.cessAmountPerUnit) : undefined,
            updatedBy,
          },
        });
      }

      // 5. Inventory Policy — upsert (one-to-one)
      if (data.inventoryPolicy) {
        const ip = {
          allowNegativeStock: data.inventoryPolicy.allowNegativeStock,
          minimumQty: data.inventoryPolicy.minimumQty != null ? new Decimal(data.inventoryPolicy.minimumQty) : undefined,
          maximumQty: data.inventoryPolicy.maximumQty != null ? new Decimal(data.inventoryPolicy.maximumQty) : undefined,
          reorderQty: data.inventoryPolicy.reorderQty != null ? new Decimal(data.inventoryPolicy.reorderQty) : undefined,
          defaultSaleQty: data.inventoryPolicy.defaultSaleQty != null ? new Decimal(data.inventoryPolicy.defaultSaleQty) : undefined,
          boxConversionQty: data.inventoryPolicy.boxConversionQty != null ? new Decimal(data.inventoryPolicy.boxConversionQty) : undefined,
          shelfLifeDays: data.inventoryPolicy.shelfLifeDays,
          trackBatch: data.inventoryPolicy.trackBatch,
          trackExpiry: data.inventoryPolicy.trackExpiry,
          trackSerial: data.inventoryPolicy.trackSerial,
          stockUom: data.inventoryPolicy.stockUom,
          saleUom: data.inventoryPolicy.saleUom,
          purchaseUom: data.inventoryPolicy.purchaseUom,
          updatedBy,
        };
        await tx.productInventoryPolicy.upsert({
          where: { storeProductId },
          create: { storeProductId, ...ip },
          update: ip,
        });
      }

      // 6. Discount Policy — upsert
      if (data.discountPolicy) {
        const dp = {
          discountApplicable: data.discountPolicy.discountApplicable,
          visibleDiscountOn: data.discountPolicy.visibleDiscountOn != null ? new Decimal(data.discountPolicy.visibleDiscountOn) : undefined,
          itemDiscount1Percent: data.discountPolicy.itemDiscount1Percent != null ? new Decimal(data.discountPolicy.itemDiscount1Percent) : undefined,
          itemDiscount2Percent: data.discountPolicy.itemDiscount2Percent != null ? new Decimal(data.discountPolicy.itemDiscount2Percent) : undefined,
          specialDiscountPercent: data.discountPolicy.specialDiscountPercent != null ? new Decimal(data.discountPolicy.specialDiscountPercent) : undefined,
          maximumDiscountPercent: data.discountPolicy.maximumDiscountPercent != null ? new Decimal(data.discountPolicy.maximumDiscountPercent) : undefined,
          purchaseDiscountPercent: data.discountPolicy.purchaseDiscountPercent != null ? new Decimal(data.discountPolicy.purchaseDiscountPercent) : undefined,
          discountLessPercent: data.discountPolicy.discountLessPercent != null ? new Decimal(data.discountPolicy.discountLessPercent) : undefined,
          rateOverrideAllowed: data.discountPolicy.rateOverrideAllowed,
          updatedBy,
        };
        await tx.productDiscountPolicy.upsert({
          where: { storeProductId },
          create: { storeProductId, ...dp },
          update: dp,
        });
      }

      // 7. Rack — upsert primary rack
      if (data.rack) {
        const existingRack = await tx.productRackLocation.findFirst({ where: { storeProductId } });
        if (existingRack) {
          await tx.productRackLocation.update({
            where: { id: existingRack.id },
            data: {
              rackNo: data.rack.rackNo,
              shelfNo: data.rack.shelfNo,
              binNo: data.rack.binNo,
              zone: data.rack.zone,
            },
          });
        } else {
          await tx.productRackLocation.create({
            data: { storeProductId, ...data.rack },
          });
        }
      }

      return this.findOneMaster(storeProductId);
    });
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

// =====================================================
// PAYLOAD & RESULT TYPES
// =====================================================

export interface ProductMasterPayload {
  storeProduct?: Partial<{
    displayName: string;
    legacyCode: string;
    status: string;
    type: string;
    itemType: string;
    isHidden: boolean;
    allowDecimalQty: boolean;
    packagingText: string;
    colorType: string;
    manufacturerLegacyRef: string;
  }>;
  product?: Partial<{
    name: string;
    baseUnit: string;
    hsnSacCode: string;
  }>;
  pricing?: Partial<{
    mrp: number;
    sellingPrice: number;
    rateA: number;
    rateB: number;
    rateC: number;
    purchaseRate: number;
    costPerPiece: number;
    landingCost: number;
  }>;
  taxProfile?: Partial<{
    hsnSacCode: string;
    localTaxabilityStatus: string;
    centralTaxabilityStatus: string;
    isTaxable: boolean;
    taxInclusive: boolean;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cessRate: number;
    cessAmountPerUnit: number;
  }>;
  inventoryPolicy?: Partial<{
    allowNegativeStock: boolean;
    minimumQty: number;
    maximumQty: number;
    reorderQty: number;
    defaultSaleQty: number;
    boxConversionQty: number;
    shelfLifeDays: number;
    trackBatch: boolean;
    trackExpiry: boolean;
    trackSerial: boolean;
    stockUom: string;
    saleUom: string;
    purchaseUom: string;
  }>;
  discountPolicy?: Partial<{
    discountApplicable: boolean;
    visibleDiscountOn: number;
    itemDiscount1Percent: number;
    itemDiscount2Percent: number;
    specialDiscountPercent: number;
    maximumDiscountPercent: number;
    purchaseDiscountPercent: number;
    discountLessPercent: number;
    rateOverrideAllowed: boolean;
  }>;
  rack?: Partial<{
    rackNo: string;
    shelfNo: string;
    binNo: string;
    zone: string;
  }>;
}

export interface GstPreview {
  mrp: number;
  taxInclusive: boolean;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  taxableValue: number;
  gstAmount: number;
  finalSalePrice: number;
}

export interface ProductValidationResult {
  valid: boolean;
  errors: string[];
  gstPreview: GstPreview | null;
}

