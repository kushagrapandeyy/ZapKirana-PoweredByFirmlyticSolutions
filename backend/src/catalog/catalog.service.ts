import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';

function inferGstClass(categories: string): string {
  const c = categories.toLowerCase();
  if (c.includes('beverage') || c.includes('aerated') || c.includes('cola') || c.includes('soda')) return 'GST_28';
  if (c.includes('biscuit') || c.includes('pasta') || c.includes('noodle') || c.includes('ice cream') || c.includes('chocolate')) return 'GST_18';
  if (c.includes('juice') || c.includes('butter') || c.includes('cheese') || c.includes('ghee') || c.includes('namkeen')) return 'GST_12';
  if (c.includes('oil') || c.includes('sugar') || c.includes('spice') || c.includes('tea') || c.includes('coffee') || c.includes('packed')) return 'GST_5';
  return 'EXEMPT';
}

const GST_RATE_MAP: Record<string, number> = { EXEMPT: 0, GST_5: 5, GST_12: 12, GST_18: 18, GST_28: 28 };

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Unified barcode resolver.
   * Resolution chain:
   *   1. BarcodeRegistry (internal + registered external)
   *   2. Product table by barcode field (store-scoped)
   *   3. Open Food Facts (GS1 barcodes only)
   *   4. UNKNOWN → prompt pending product intake
   *
   * GET /api/v1/catalog/resolve-barcode/:barcode?storeId=x
   */
  async resolveBarcode(barcode: string, storeId?: string) {
    // 1. BarcodeRegistry
    const registryEntry = await this.prisma.barcodeRegistry.findFirst({
      where: {
        barcodeValue: barcode,
        isActive: true,
        OR: [
          ...(storeId ? [{ storeId }] : []),
          { storeId: null },
        ],
      },
      include: { product: true },
    });

    if (registryEntry?.product) {
      return {
        status: 'FOUND',
        source: 'barcode_registry',
        barcodeScope: registryEntry.barcodeScope,
        product: this.formatProduct(registryEntry.product),
      };
    }

    // 2. Product table (store-scoped)
    if (storeId) {
      const product = await this.prisma.product.findFirst({
        where: { barcode, storeId, isActive: true },
      });
      if (product) {
        return {
          status: 'FOUND',
          source: 'product_table',
          barcodeScope: 'GS1_EXTERNAL_PRODUCT',
          product: this.formatProduct(product),
        };
      }
    }

    // 3. Open Food Facts (only for digit-only barcodes likely to be GS1)
    if (/^\d{8,14}$/.test(barcode)) {
      try {
        const res = await fetch(`${OPEN_FOOD_FACTS_URL}/${barcode}.json?fields=product_name,brands,categories,image_url`);
        if (res.ok) {
          const data = await res.json() as any;
          if (data.status === 1 && data.product) {
            const p = data.product;
            const categoriesRaw: string = p.categories ?? '';
            const gstClass = inferGstClass(categoriesRaw);
            return {
              status: 'FOUND_EXTERNAL',
              source: 'open_food_facts',
              barcodeScope: 'GS1_EXTERNAL_PRODUCT',
              product: {
                barcode,
                name: p.product_name ?? 'Unknown Product',
                brand: p.brands ?? '',
                category: categoriesRaw.split(',')[0]?.trim() ?? 'Grocery',
                imageUrl: p.image_url ?? null,
                mrp: 0,
                sellingPrice: 0,
                gstClass,
                gstRate: GST_RATE_MAP[gstClass],
              },
              nextAction: 'ADD_TO_STORE_CATALOG',
            };
          }
        }
      } catch {
        // OFF unavailable — fall through
      }
    }

    // 4. Unknown
    return {
      status: 'UNKNOWN',
      source: null,
      barcodeScope: 'UNKNOWN',
      product: null,
      nextAction: 'CREATE_PENDING_PRODUCT',
    };
  }

  private formatProduct(p: any) {
    return {
      productId: p.id,
      name: p.name,
      category: p.category,
      barcode: p.barcode,
      mrp: p.mrp,
      sellingPrice: p.sellingPrice,
      gstRate: p.gstRate,
      gstClass: p.gstClass,
      imageUrl: p.imageUrl,
      internalSku: p.internalSku,
    };
  }

  /**
   * Submit an unknown barcode as a pending product for admin approval.
   *
   * POST /api/v1/catalog/pending-products
   */
  async createPendingProduct(data: {
    storeId: string;
    barcode?: string;
    suggestedName?: string;
    suggestedBrand?: string;
    suggestedCategory?: string;
    mrp?: number;
    sellingPrice?: number;
    purchasePrice?: number;
    gstRate?: number;
    imageUrl?: string;
    createdById?: string;
    notes?: string;
  }) {
    // Don't create duplicates for the same barcode in the same store
    if (data.barcode) {
      const existing = await this.prisma.pendingProduct.findFirst({
        where: {
          storeId: data.storeId,
          barcode: data.barcode,
          status: 'PENDING_REVIEW',
        },
      });
      if (existing) {
        return { ...existing, alreadyPending: true };
      }
    }

    return this.prisma.pendingProduct.create({
      data: {
        storeId: data.storeId,
        barcode: data.barcode ?? null,
        suggestedName: data.suggestedName ?? null,
        suggestedBrand: data.suggestedBrand ?? null,
        suggestedCategory: data.suggestedCategory ?? null,
        mrp: data.mrp ?? null,
        sellingPrice: data.sellingPrice ?? null,
        purchasePrice: data.purchasePrice ?? null,
        gstRate: data.gstRate ?? 0,
        imageUrl: data.imageUrl ?? null,
        createdById: data.createdById ?? null,
        notes: data.notes ?? null,
        status: 'PENDING_REVIEW',
      },
    });
  }

  /**
   * List pending products for a store.
   *
   * GET /api/v1/catalog/pending-products?storeId=x&status=PENDING_REVIEW
   */
  async listPendingProducts(storeId: string, status?: string) {
    return this.prisma.pendingProduct.findMany({
      where: {
        storeId,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true, role: true } } },
    });
  }

  /**
   * Approve a pending product — creates a real Product record and registers its barcode.
   *
   * POST /api/v1/catalog/pending-products/:id/approve
   */
  async approvePendingProduct(
    id: string,
    overrides: {
      name?: string;
      brand?: string;
      category?: string;
      mrp?: number;
      sellingPrice?: number;
      purchasePrice?: number;
      gstRate?: number;
      internalSku?: string;
    },
  ) {
    const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
    if (!pending) throw new NotFoundException('Pending product not found');
    if (pending.status !== 'PENDING_REVIEW') throw new BadRequestException('Product is not pending review');

    const name = overrides.name ?? pending.suggestedName;
    if (!name) throw new BadRequestException('Product name is required');
    if (!overrides.mrp && !pending.mrp) throw new BadRequestException('MRP is required');

    // Generate a unique internal SKU if not provided
    const internalSku = overrides.internalSku ?? `SKU-${pending.storeId.substring(0, 4).toUpperCase()}-${Date.now()}`;

    // Create the product
    const product = await this.prisma.product.create({
      data: {
        storeId: pending.storeId,
        barcode: pending.barcode ?? null,
        internalSku,
        name,
        category: overrides.category ?? pending.suggestedCategory ?? 'Grocery',
        mrp: overrides.mrp ?? pending.mrp ?? 0,
        sellingPrice: overrides.sellingPrice ?? pending.sellingPrice ?? 0,
        purchaseCost: overrides.purchasePrice ?? pending.purchasePrice ?? null,
        gstRate: overrides.gstRate ?? pending.gstRate ?? 0,
        imageUrl: pending.imageUrl ?? null,
        isActive: true,
      },
    });

    // Register barcode if we have one
    if (pending.barcode) {
      const existingReg = await this.prisma.barcodeRegistry.findFirst({
        where: { barcodeValue: pending.barcode, storeId: pending.storeId },
      });

      if (!existingReg) {
        const isInternal = pending.barcode.startsWith('BK') || pending.barcode.startsWith('29');
        await this.prisma.barcodeRegistry.create({
          data: {
            storeId: pending.storeId,
            productId: product.id,
            barcodeValue: pending.barcode,
            symbology: isInternal ? 'CODE_128' : 'EAN_13',
            barcodeScope: isInternal ? 'INTERNAL_FIXED_PACK' : 'GS1_EXTERNAL_PRODUCT',
            isInternal,
            isPrimary: true,
            isActive: true,
          },
        });
      }
    }

    // Mark pending product as approved
    await this.prisma.pendingProduct.update({
      where: { id },
      data: { status: 'APPROVED', approvedProductId: product.id },
    });

    return {
      status: 'APPROVED',
      productId: product.id,
      internalSku: product.internalSku,
      barcodeRegistered: !!pending.barcode,
    };
  }

  /**
   * Reject a pending product.
   *
   * POST /api/v1/catalog/pending-products/:id/reject
   */
  async rejectPendingProduct(id: string, reason?: string) {
    const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
    if (!pending) throw new NotFoundException('Pending product not found');
    if (pending.status !== 'PENDING_REVIEW') throw new BadRequestException('Product is not pending review');

    return this.prisma.pendingProduct.update({
      where: { id },
      data: { status: 'REJECTED', notes: reason ?? pending.notes ?? null },
    });
  }
}
