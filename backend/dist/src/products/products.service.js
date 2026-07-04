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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/product';
function inferGstClass(categories) {
    const c = categories.toLowerCase();
    if (c.includes('beverage') || c.includes('aerated') || c.includes('cola') || c.includes('soda'))
        return 'GST_28';
    if (c.includes('biscuit') || c.includes('pasta') || c.includes('noodle') || c.includes('ice cream') || c.includes('chocolate'))
        return 'GST_18';
    if (c.includes('juice') || c.includes('butter') || c.includes('cheese') || c.includes('ghee') || c.includes('namkeen'))
        return 'GST_12';
    if (c.includes('oil') || c.includes('sugar') || c.includes('spice') || c.includes('tea') || c.includes('coffee') || c.includes('packed'))
        return 'GST_5';
    return 'EXEMPT';
}
const GST_RATE_MAP = {
    EXEMPT: 0, GST_5: 5, GST_12: 12, GST_18: 18, GST_28: 28,
};
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProduct(data) {
        return this.prisma.product.create({
            data,
        });
    }
    async findAll(storeId) {
        return this.prisma.product.findMany({
            where: { storeId, isActive: true },
        });
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });
        if (!product)
            throw new common_1.NotFoundException(`Product ${id} not found`);
        return product;
    }
    async findByBarcode(storeId, barcode) {
        const product = await this.prisma.product.findFirst({
            where: { storeId, barcode, isActive: true },
        });
        if (!product)
            throw new common_1.NotFoundException(`Barcode ${barcode} not found`);
        return product;
    }
    async updatePrice(id, mrp, sellingPrice) {
        return this.prisma.product.update({
            where: { id },
            data: { mrp, sellingPrice },
        });
    }
    async updateSubscriptionDiscount(id, subscriptionDiscount) {
        return this.prisma.product.update({
            where: { id },
            data: { subscriptionDiscount },
        });
    }
    async enrichFromBarcode(barcode, storeId) {
        const local = await this.prisma.product.findFirst({ where: { barcode, storeId, isActive: true } });
        if (local)
            return { ...local, source: 'local_cache' };
        try {
            const res = await fetch(`${OPEN_FOOD_FACTS_URL}/${barcode}.json?fields=product_name,brands,categories,image_url,nutriments`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 1 && data.product) {
                    const p = data.product;
                    const categoriesRaw = p.categories ?? '';
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
        }
        catch {
        }
        return { source: 'unknown', barcode, name: '', category: '', mrp: 0, sellingPrice: 0, gstClass: 'EXEMPT', gstRate: 0 };
    }
    async createFromBarcode(data) {
        const enriched = await this.enrichFromBarcode(data.barcode, data.storeId);
        return this.prisma.product.create({
            data: {
                storeId: data.storeId,
                barcode: data.barcode,
                internalSku: data.internalSku,
                name: enriched.name || 'Unknown Product',
                category: enriched.category || 'Grocery',
                imageUrl: enriched.imageUrl ?? null,
                mrp: data.mrp,
                sellingPrice: data.sellingPrice,
                purchaseCost: data.purchaseCost,
                gstClass: enriched.gstClass ?? 'EXEMPT',
                gstRate: enriched.gstRate ?? 0,
                isActive: true,
            },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map