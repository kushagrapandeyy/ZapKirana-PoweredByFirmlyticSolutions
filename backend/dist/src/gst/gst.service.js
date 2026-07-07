"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GstService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const DEFAULT_GST_RULES = {
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
    'Packaged Food': { gstClass: 'GST_5', gstRate: 5 },
    'Edible Oil': { gstClass: 'GST_5', gstRate: 5 },
    'Sugar': { gstClass: 'GST_5', gstRate: 5 },
    'Tea': { gstClass: 'GST_5', gstRate: 5 },
    'Coffee': { gstClass: 'GST_5', gstRate: 5 },
    'Spices': { gstClass: 'GST_5', gstRate: 5 },
    'Processed Food': { gstClass: 'GST_12', gstRate: 12 },
    'Butter & Cheese': { gstClass: 'GST_12', gstRate: 12 },
    'Ghee': { gstClass: 'GST_12', gstRate: 12 },
    'Fruit Juices': { gstClass: 'GST_12', gstRate: 12 },
    'Namkeen & Snacks': { gstClass: 'GST_12', gstRate: 12 },
    'Frozen Food': { gstClass: 'GST_12', gstRate: 12 },
    'Biscuits & Cookies': { gstClass: 'GST_18', gstRate: 18 },
    'Pasta & Noodles': { gstClass: 'GST_18', gstRate: 18 },
    'Cereals & Cornflakes': { gstClass: 'GST_18', gstRate: 18 },
    'Soups': { gstClass: 'GST_18', gstRate: 18 },
    'Sauces & Ketchup': { gstClass: 'GST_18', gstRate: 18 },
    'Chocolate': { gstClass: 'GST_18', gstRate: 18 },
    'Cleaning Supplies': { gstClass: 'GST_18', gstRate: 18 },
    'Personal Care': { gstClass: 'GST_18', gstRate: 18 },
    'Aerated Beverages': { gstClass: 'GST_28', gstRate: 28 },
    'Energy Drinks': { gstClass: 'GST_28', gstRate: 28 },
    'Pan Masala': { gstClass: 'GST_28', gstRate: 28 },
    'Chewing Gum': { gstClass: 'GST_28', gstRate: 28 },
};
let GstService = class GstService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDefaultRules() {
        const results = [];
        for (const [category, rule] of Object.entries(DEFAULT_GST_RULES)) {
            const existing = await this.prisma.gSTCategoryRule.findUnique({ where: { category } });
            if (!existing) {
                const created = await this.prisma.gSTCategoryRule.create({
                    data: { category, gstClass: rule.gstClass, gstRate: rule.gstRate },
                });
                results.push(created);
            }
        }
        return { seeded: results.length, rules: results };
    }
    async getRules() {
        return this.prisma.gSTCategoryRule.findMany({ orderBy: { gstRate: 'asc' } });
    }
    async upsertRule(category, gstClass, gstRate) {
        return this.prisma.gSTCategoryRule.upsert({
            where: { category },
            update: { gstClass, gstRate },
            create: { category, gstClass, gstRate },
        });
    }
    async deleteRule(id) {
        return this.prisma.gSTCategoryRule.delete({ where: { id } });
    }
    async classifyProduct(productId) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const rule = product.category
            ? await this.prisma.gSTCategoryRule.findUnique({ where: { category: product.category } })
            : null;
        const gstClass = rule?.gstClass || 'EXEMPT';
        const gstRate = rule?.gstRate || 0;
        return this.prisma.product.update({
            where: { id: productId },
            data: { gstClass, gstRate },
        });
    }
    async bulkClassify(storeId) {
        const products = await this.prisma.product.findMany({ where: { storeId } });
        const rules = await this.prisma.gSTCategoryRule.findMany();
        const ruleMap = new Map(rules.map(r => [r.category, r]));
        let classified = 0;
        for (const product of products) {
            const rule = product.category ? ruleMap.get(product.category) : null;
            if (rule) {
                await this.prisma.product.update({
                    where: { id: product.id },
                    data: { gstClass: rule.gstClass, gstRate: rule.gstRate },
                });
                classified++;
            }
        }
        return { total: products.length, classified };
    }
    calculateGSTBreakdown(items) {
        const breakdown = {};
        let totalGST = 0;
        for (const item of items) {
            const rate = this.getGSTRate(item.gstClass);
            const taxableAmount = item.priceAtOrder * item.quantity;
            const gstAmount = (taxableAmount * rate) / (100 + rate);
            const key = item.gstClass;
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
    async getGSTReport(storeId, startDate, endDate) {
        const dateFilter = {};
        if (startDate)
            dateFilter.gte = startDate;
        if (endDate)
            dateFilter.lte = endDate;
        const orders = await this.prisma.order.findMany({
            where: {
                storeId,
                status: 'DELIVERED',
                ...(startDate || endDate ? { createdAt: dateFilter } : {}),
            },
            include: { items: { include: { product: true } } },
        });
        const slabSummary = {};
        for (const order of orders) {
            for (const item of order.items) {
                const gstClass = item.product.gstClass || 'EXEMPT';
                const rate = this.getGSTRate(gstClass);
                const taxableAmount = item.priceAtOrder * item.quantity;
                const gstAmount = (taxableAmount * rate) / (100 + rate);
                const halfGST = gstAmount / 2;
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
    getGSTRate(gstClass) {
        const rates = {
            EXEMPT: 0,
            GST_5: 5,
            GST_12: 12,
            GST_18: 18,
            GST_28: 28,
        };
        return rates[gstClass] || 0;
    }
};
exports.GstService = GstService;
exports.GstService = GstService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GstService);
//# sourceMappingURL=gst.service.js.map