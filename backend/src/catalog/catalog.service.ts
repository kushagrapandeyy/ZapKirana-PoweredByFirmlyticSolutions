import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';
import { Decimal } from '@prisma/client/runtime/library';

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

  async resolveBarcode(barcode: string, storeId?: string) {
    // 1. StoreProductBarcode
    if (storeId) {
      const spb = await this.prisma.storeProductBarcode.findFirst({
        where: { barcode, storeProduct: { storeId } },
        include: { storeProduct: { include: { product: true, pricing: true, taxProfile: true } } },
      });
      if (spb?.storeProduct) {
        return {
          status: 'FOUND',
          source: 'store_product_barcode',
          barcodeScope: spb.barcodeType,
          product: this.formatStoreProduct(spb.storeProduct, barcode),
        };
      }
    }

    // 2. BarcodeRegistry
    const registryEntry = await this.prisma.barcodeRegistry.findFirst({
      where: {
        barcodeValue: barcode,
        isActive: true,
        OR: [
          ...(storeId ? [{ storeId }] : []),
          { storeId: null },
        ],
      },
      include: { storeProduct: { include: { product: true, pricing: true, taxProfile: true } } },
    });

    if ((registryEntry as any)?.storeProduct) {
      return {
        status: 'FOUND',
        source: 'barcode_registry',
        barcodeScope: registryEntry?.barcodeScope,
        product: this.formatStoreProduct((registryEntry as any).storeProduct, barcode),
      };
    }

    // 3. Open Food Facts
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
      } catch {}
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

  private formatStoreProduct(sp: any, barcode: string) {
    return {
      productId: sp.id, // we return storeProductId as productId for legacy clients
      name: sp.displayName ?? sp.product?.name,
      category: sp.product?.categoryId,
      barcode: barcode,
      mrp: sp.pricing?.[0]?.mrp?.toNumber() ?? 0,
      sellingPrice: sp.pricing?.[0]?.sellingPrice?.toNumber() ?? 0,
      gstRate: sp.taxProfile?.[0]?.gstRate?.toNumber() ?? 0,
      gstClass: `GST_${sp.taxProfile?.[0]?.gstRate?.toNumber() ?? 0}`,
      imageUrl: sp.product?.imageUrl,
      internalSku: sp.product?.id,
    };
  }

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
        mrp: data.mrp != null ? new Decimal(data.mrp) : null,
        sellingPrice: data.sellingPrice != null ? new Decimal(data.sellingPrice) : null,
        purchasePrice: data.purchasePrice != null ? new Decimal(data.purchasePrice) : null,
        gstRate: data.gstRate != null ? new Decimal(data.gstRate) : new Decimal(0),
        imageUrl: data.imageUrl ?? null,
        createdById: data.createdById ?? null,
        notes: data.notes ?? null,
        status: 'PENDING_REVIEW',
      },
    });
  }

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

    const internalSku = overrides.internalSku ?? `SKU-${pending.storeId.substring(0, 4).toUpperCase()}-${Date.now()}`;

    // Create global Product first
    const product = await this.prisma.product.create({
      data: {
        name,
        imageUrl: pending.imageUrl ?? null,
      },
    });

    // Create StoreProduct
    const storeProduct = await this.prisma.storeProduct.create({
      data: {
        storeId: pending.storeId,
        productId: product.id,
        displayName: name,
        status: 'ACTIVE',
      },
    });

    // Create Pricing
    await this.prisma.storeProductPricing.create({
      data: {
        storeProductId: storeProduct.id,
        mrp: overrides.mrp ?? pending.mrp ?? 0,
        sellingPrice: overrides.sellingPrice ?? pending.sellingPrice ?? 0,
        purchaseRate: overrides.purchasePrice ?? pending.purchasePrice ?? null,
      },
    });

    // Create Tax Profile
    await this.prisma.productTaxProfile.create({
      data: {
        storeProductId: storeProduct.id,
        gstRate: overrides.gstRate ?? pending.gstRate ?? 0,
      },
    });
    // Create Barcode
    if (pending.barcode) {
      await this.prisma.storeProductBarcode.create({
        data: {
          storeProductId: storeProduct.id,
          barcode: pending.barcode,
          barcodeType: 'ITEM',
          isPrimary: true,
        },
      });

      // Legacy support for BarcodeRegistry
      const isInternal = pending.barcode.startsWith('BK') || pending.barcode.startsWith('29');
      await this.prisma.barcodeRegistry.create({
        data: {
          storeId: pending.storeId,
          storeProductId: storeProduct.id,
          barcodeValue: pending.barcode,
          symbology: isInternal ? 'CODE_128' : 'EAN_13',
          barcodeScope: isInternal ? 'INTERNAL_FIXED_PACK' : 'GS1_EXTERNAL_PRODUCT',
          isInternal,
          isPrimary: true,
          isActive: true,
        },
      });
    }

    // Mark pending product as approved
    await this.prisma.pendingProduct.update({
      where: { id },
      data: { status: 'APPROVED', approvedProductId: storeProduct.id },
    });

    return {
      status: 'APPROVED',
      productId: storeProduct.id,
      skuCode: internalSku,
      barcodeRegistered: !!pending.barcode,
    };
  }

  async rejectPendingProduct(id: string, reason?: string) {
    const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
    if (!pending) throw new NotFoundException('Pending product not found');
    if (pending.status !== 'PENDING_REVIEW') throw new BadRequestException('Product is not pending review');

    return this.prisma.pendingProduct.update({
      where: { id },
      data: { status: 'REJECTED', notes: reason ?? pending.notes ?? null },
    });
  }

  async getPersonalizedRecommendations(storeId: string, userId?: string) {
    if (!userId) {
      return this.prisma.storeProduct.findMany({
        where: { storeId, status: 'ACTIVE' },
        take: 8,
        include: { product: true, pricing: true },
      });
    }

    const pastOrders = await this.prisma.order.findMany({
      where: { storeId, customerId: userId, status: 'DELIVERED' },
      include: { items: true }
    });

    if (pastOrders.length === 0) {
      return this.prisma.storeProduct.findMany({
        where: { storeId, status: 'ACTIVE' },
        take: 8,
        include: { product: true, pricing: true },
      });
    }

    const productCounts: Record<string, number> = {};
    pastOrders.forEach(order => {
      order.items.forEach((item: any) => {
        productCounts[item.storeProductId] = (productCounts[item.storeProductId] || 0) + item.quantity;
      });
    });

    const sortedProductIds = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 8);

    const personalizedProducts = await this.prisma.storeProduct.findMany({
      where: {
        storeId,
        id: { in: sortedProductIds },
        status: 'ACTIVE',
      },
      include: { product: true, pricing: true }
    });

    if (personalizedProducts.length < 8) {
      const fillProducts = await this.prisma.storeProduct.findMany({
        where: { 
          storeId, 
          status: 'ACTIVE',
          id: { notIn: sortedProductIds }
        },
        include: { product: true, pricing: true },
        take: 8 - personalizedProducts.length,
      });
      personalizedProducts.push(...fillProducts);
    }

    return personalizedProducts;
  }
}
