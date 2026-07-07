import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

// Default category-to-GST class mapping for Indian grocery stores
const DEFAULT_GST_RULES: Record<string, { gstClass: string; gstRate: number }> = {
  // 0% EXEMPT - Essential items
  'Milk & Dairy': { gstClass: 'EXEMPT', gstRate: 0 },
  'Fresh Vegetables': { gstClass: 'EXEMPT', gstRate: 0 },
  'Fresh Fruits': { gstClass: 'EXEMPT', gstRate: 0 },
  'Eggs': { gstClass: 'EXEMPT', gstRate: 0 },
  'Rice': { gstClass: 'EXEMPT', gstRate: 0 },
  'Wheat & Flour': { gstClass: 'EXEMPT', gstRate: 0 },
  'Bread': { gstClass: 'EXEMPT', gstRate: 0 },
  'Salt': { gstClass: 'EXEMPT', gstRate: 0 },
  'Fresh Meat': { gstClass: 'EXEMPT', gstRate: 0 },
  'Fresh Fish': { gstClass: 'EXEMPT', gstRate: 0 },

  // 5% GST - Packaged food
  'Packaged Food': { gstClass: 'GST_5', gstRate: 5 },
  'Edible Oil': { gstClass: 'GST_5', gstRate: 5 },
  'Sugar': { gstClass: 'GST_5', gstRate: 5 },
  'Tea': { gstClass: 'GST_5', gstRate: 5 },
  'Coffee': { gstClass: 'GST_5', gstRate: 5 },
  'Spices': { gstClass: 'GST_5', gstRate: 5 },

  // 12% GST - Processed food
  'Processed Food': { gstClass: 'GST_12', gstRate: 12 },
  'Butter & Cheese': { gstClass: 'GST_12', gstRate: 12 },
  'Ghee': { gstClass: 'GST_12', gstRate: 12 },
  'Fruit Juices': { gstClass: 'GST_12', gstRate: 12 },
  'Namkeen & Snacks': { gstClass: 'GST_12', gstRate: 12 },
  'Frozen Food': { gstClass: 'GST_12', gstRate: 12 },

  // 18% GST - Premium processed
  'Biscuits & Cookies': { gstClass: 'GST_18', gstRate: 18 },
  'Pasta & Noodles': { gstClass: 'GST_18', gstRate: 18 },
  'Cereals & Cornflakes': { gstClass: 'GST_18', gstRate: 18 },
  'Soups': { gstClass: 'GST_18', gstRate: 18 },
  'Sauces & Ketchup': { gstClass: 'GST_18', gstRate: 18 },
  'Chocolate': { gstClass: 'GST_18', gstRate: 18 },
  'Cleaning Supplies': { gstClass: 'GST_18', gstRate: 18 },
  'Personal Care': { gstClass: 'GST_18', gstRate: 18 },

  // 28% GST - Luxury / Aerated
  'Aerated Beverages': { gstClass: 'GST_28', gstRate: 28 },
  'Energy Drinks': { gstClass: 'GST_28', gstRate: 28 },
  'Pan Masala': { gstClass: 'GST_28', gstRate: 28 },
  'Chewing Gum': { gstClass: 'GST_28', gstRate: 28 },
};

@Injectable()
export class GstService {
  constructor(private prisma: PrismaService) {}

  // Seed default GST rules
  async seedDefaultRules() {
    const results: any[] = [];
    for (const [category, rule] of Object.entries(DEFAULT_GST_RULES)) {
      const existing = await this.prisma.gSTCategoryRule.findUnique({ where: { category } });
      if (!existing) {
        const created = await this.prisma.gSTCategoryRule.create({
          data: { category, gstClass: rule.gstClass as any, gstRate: rule.gstRate },
        });
        results.push(created);
      }
    }
    return { seeded: results.length, rules: results };
  }

  // Get all GST rules
  async getRules() {
    return this.prisma.gSTCategoryRule.findMany({ orderBy: { gstRate: 'asc' } });
  }

  // Create or update a GST rule
  async upsertRule(category: string, gstClass: any, gstRate: number) {
    return this.prisma.gSTCategoryRule.upsert({
      where: { category },
      update: { gstClass, gstRate },
      create: { category, gstClass, gstRate },
    });
  }

  // Delete a GST rule
  async deleteRule(id: string) {
    return this.prisma.gSTCategoryRule.delete({ where: { id } });
  }

  // Auto-classify a product based on its category
  async classifyProduct(storeProductId: string) {
    const storeProduct = await this.prisma.storeProduct.findUnique({ 
      where: { id: storeProductId },
      include: { product: { include: { category: true } } }
    });
    if (!storeProduct) throw new NotFoundException('Product not found');

    const rule = storeProduct.product?.category?.name
      ? await this.prisma.gSTCategoryRule.findUnique({ where: { category: storeProduct.product.category.name } })
      : null;

    const gstRate = rule?.gstRate || 0;

    return this.prisma.productTaxProfile.create({
      data: {
        storeProductId,
        gstRate: new Decimal(gstRate),
        effectiveFrom: new Date()
      }
    });
  }

  // Bulk auto-classify all products in a store
  async bulkClassify(storeId: string) {
    const storeProducts = await this.prisma.storeProduct.findMany({ 
      where: { storeId },
      include: { product: { include: { category: true } } }
    });
    const rules = await this.prisma.gSTCategoryRule.findMany();
    const ruleMap = new Map(rules.map(r => [r.category, r]));

    let classified = 0;
    for (const sp of storeProducts) {
      const rule = sp.product?.category?.name ? ruleMap.get(sp.product.category.name) : null;
      if (rule) {
        await this.prisma.productTaxProfile.create({
          data: { 
            storeProductId: sp.id, 
            gstRate: new Decimal(rule.gstRate),
            effectiveFrom: new Date()
          },
        });
        classified++;
      }
    }
    return { total: storeProducts.length, classified };
  }

  // Calculate GST breakdown for an order
  calculateGSTBreakdown(items: { priceAtOrder: number; quantity: number; gstRate: number }[]) {
    const breakdown: Record<string, { rate: number; taxable: number; tax: number; items: number }> = {};
    let totalGST = 0;

    for (const item of items) {
      const rate = item.gstRate;
      const taxableAmount = item.priceAtOrder * item.quantity;
      const gstAmount = (taxableAmount * rate) / (100 + rate); // GST is inclusive in MRP

      const key = `GST_${rate}`;
      if (!breakdown[key]) {
        breakdown[key] = { rate, taxable: 0, tax: 0, items: 0 };
      }
      breakdown[key].taxable += taxableAmount - gstAmount;
      breakdown[key].tax += gstAmount;
      breakdown[key].items += 1;
      totalGST += gstAmount;
    }

    return { breakdown, totalGST: Math.round(totalGST * 100) / 100 };
  }

  // GST Report: Summary by slab for a store
  async getGSTReport(storeId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        status: 'DELIVERED',
        ...(startDate || endDate ? { createdAt: dateFilter } : {}),
      },
      include: { items: { include: { storeProduct: { include: { taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 } } } } } },
    });

    const slabSummary: Record<string, { rate: number; orderCount: number; taxableValue: number; cgst: number; sgst: number; totalTax: number }> = {};

    for (const order of orders) {
      for (const item of order.items) {
        const rate = item.cgstRateSnapshot?.plus(item.sgstRateSnapshot || 0)?.plus(item.igstRateSnapshot || 0)?.toNumber() 
          || item.storeProduct?.taxProfile?.[0]?.gstRate?.toNumber() 
          || 0;
          
        const gstClass = `GST_${rate}`;
        const taxableAmount = item.priceAtOrderSnapshot?.toNumber() * item.quantity.toNumber();
        const gstAmount = (taxableAmount * rate) / (100 + rate);
        const halfGST = gstAmount / 2; // CGST + SGST split

        if (!slabSummary[gstClass]) {
          slabSummary[gstClass] = { rate, orderCount: 0, taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0 };
        }
        slabSummary[gstClass].orderCount += 1;
        slabSummary[gstClass].taxableValue += taxableAmount - gstAmount;
        slabSummary[gstClass].cgst += halfGST;
        slabSummary[gstClass].sgst += halfGST;
        slabSummary[gstClass].totalTax += gstAmount;
      }
    }

    // Round all values
    for (const key of Object.keys(slabSummary)) {
      slabSummary[key].taxableValue = Math.round(slabSummary[key].taxableValue * 100) / 100;
      slabSummary[key].cgst = Math.round(slabSummary[key].cgst * 100) / 100;
      slabSummary[key].sgst = Math.round(slabSummary[key].sgst * 100) / 100;
      slabSummary[key].totalTax = Math.round(slabSummary[key].totalTax * 100) / 100;
    }

    return {
      storeId,
      period: { startDate, endDate },
      totalOrders: orders.length,
      slabSummary,
    };
  }
}
