import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';

// GST class heuristic from category keywords
function inferGstClass(categories: string): string {
  const c = categories.toLowerCase();
  if (c.includes('beverage') || c.includes('aerated') || c.includes('cola') || c.includes('soda')) return 'GST_28';
  if (c.includes('biscuit') || c.includes('pasta') || c.includes('noodle') || c.includes('ice cream') || c.includes('chocolate')) return 'GST_18';
  if (c.includes('juice') || c.includes('butter') || c.includes('cheese') || c.includes('ghee') || c.includes('namkeen')) return 'GST_12';
  if (c.includes('oil') || c.includes('sugar') || c.includes('spice') || c.includes('tea') || c.includes('coffee') || c.includes('packed')) return 'GST_5';
  return 'EXEMPT';
}

const GST_RATE_MAP: Record<string, number> = {
  EXEMPT: 0, GST_5: 5, GST_12: 12, GST_18: 18, GST_28: 28,
};


@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async createProduct(data: {
    storeId: string;
    barcode?: string;
    skuCode: string;
    name: string;
    description?: string;
    category?: string;
    mrp: number;
    sellingPrice: number;
    purchaseRate?: number;
    gstRate?: number;
    imageUrl?: string;
  }) {
    return this.prisma.product.create({
      data,
    });
  }

  async findAll(storeId: string) {
    return this.prisma.product.findMany({
      where: { storeId, isActive: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async findByBarcode(storeId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { storeId, barcode, isActive: true },
    });
    if (!product) throw new NotFoundException(`Barcode ${barcode} not found`);
    return product;
  }

  async updatePrice(id: string, mrp: number, sellingPrice: number) {
    return this.prisma.product.update({
      where: { id },
      data: { mrp, sellingPrice },
    });
  }

  async updateSubscriptionDiscount(id: string, subscriptionDiscount: number) {
    return this.prisma.product.update({
      where: { id },
      data: { subscriptionDiscount },
    });
  }

  /**
   * Tier 1: local DB  Tier 2: Open Food Facts  Tier 3: returns partial data
   * GET /products/enrich/:barcode?storeId=x
   */
  async enrichFromBarcode(barcode: string, storeId: string) {
    // Tier 1 — local DB
    const local = await this.prisma.product.findFirst({ where: { barcode, storeId, isActive: true } });
    if (local) return { ...local, source: 'local_cache' };

    // Tier 2 — Open Food Facts (free, no key required)
    try {
      const res = await fetch(`${OPEN_FOOD_FACTS_URL}/${barcode}.json?fields=product_name,brands,categories,image_url,nutriments`);
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
            mrp: 0,          // MRP not available in OFF — user must fill
            sellingPrice: 0,
            gstClass,
            gstRate: GST_RATE_MAP[gstClass],
          };
        }
      }
    } catch {
      // OFF unavailable — fall through
    }

    // Tier 3 — return partial so UI can prompt manual entry
    return { source: 'unknown', barcode, name: '', category: '', mrp: 0, sellingPrice: 0, gstClass: 'EXEMPT', gstRate: 0 };
  }

  /**
   * Enrich barcode + auto-create product in one shot.
   * POST /products/from-barcode
   * Body: { storeId, barcode, mrp, sellingPrice, internalSku }
   * Body: { storeId, barcode, mrp, sellingPrice, skuCode }
   */
  async createFromBarcode(data: { storeId: string; barcode: string; mrp: number; sellingPrice: number; skuCode: string; purchaseRate?: number }) {
    const enriched = await this.enrichFromBarcode(data.barcode, data.storeId);

    return this.prisma.product.create({
      data: {
        storeId: data.storeId,
        barcode: data.barcode,
        skuCode: data.skuCode,
        name: (enriched as any).name || 'Unknown Product',
        category: (enriched as any).category || 'Grocery',
        imageUrl: (enriched as any).imageUrl ?? null,
        mrp: data.mrp,
        sellingPrice: data.sellingPrice,
        purchaseRate: data.purchaseRate,
        gstClass: (enriched as any).gstClass ?? 'EXEMPT',
        gstRate: (enriched as any).gstRate ?? 0,
        isActive: true,
      },
    });
  }
}
