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
exports.CatalogService = void 0;
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
const GST_RATE_MAP = { EXEMPT: 0, GST_5: 5, GST_12: 12, GST_18: 18, GST_28: 28 };
let CatalogService = class CatalogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveBarcode(barcode, storeId) {
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
        if (/^\d{8,14}$/.test(barcode)) {
            try {
                const res = await fetch(`${OPEN_FOOD_FACTS_URL}/${barcode}.json?fields=product_name,brands,categories,image_url`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 1 && data.product) {
                        const p = data.product;
                        const categoriesRaw = p.categories ?? '';
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
            }
            catch {
            }
        }
        return {
            status: 'UNKNOWN',
            source: null,
            barcodeScope: 'UNKNOWN',
            product: null,
            nextAction: 'CREATE_PENDING_PRODUCT',
        };
    }
    formatProduct(p) {
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
    async createPendingProduct(data) {
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
    async listPendingProducts(storeId, status) {
        return this.prisma.pendingProduct.findMany({
            where: {
                storeId,
                ...(status ? { status: status } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { id: true, name: true, role: true } } },
        });
    }
    async approvePendingProduct(id, overrides) {
        const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
        if (!pending)
            throw new common_1.NotFoundException('Pending product not found');
        if (pending.status !== 'PENDING_REVIEW')
            throw new common_1.BadRequestException('Product is not pending review');
        const name = overrides.name ?? pending.suggestedName;
        if (!name)
            throw new common_1.BadRequestException('Product name is required');
        if (!overrides.mrp && !pending.mrp)
            throw new common_1.BadRequestException('MRP is required');
        const internalSku = overrides.internalSku ?? `SKU-${pending.storeId.substring(0, 4).toUpperCase()}-${Date.now()}`;
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
    async rejectPendingProduct(id, reason) {
        const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
        if (!pending)
            throw new common_1.NotFoundException('Pending product not found');
        if (pending.status !== 'PENDING_REVIEW')
            throw new common_1.BadRequestException('Product is not pending review');
        return this.prisma.pendingProduct.update({
            where: { id },
            data: { status: 'REJECTED', notes: reason ?? pending.notes ?? null },
        });
    }
    async getPersonalizedRecommendations(storeId, userId) {
        if (!userId) {
            return this.prisma.product.findMany({
                where: { storeId, isActive: true },
                take: 8,
            });
        }
        const pastOrders = await this.prisma.order.findMany({
            where: {
                storeId,
                customerId: userId,
                status: 'DELIVERED'
            },
            include: {
                items: true
            }
        });
        if (pastOrders.length === 0) {
            return this.prisma.product.findMany({
                where: { storeId, isActive: true },
                take: 8,
            });
        }
        const productCounts = {};
        pastOrders.forEach(order => {
            order.items.forEach((item) => {
                productCounts[item.productId] = (productCounts[item.productId] || 0) + item.qty;
            });
        });
        const sortedProductIds = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])
            .slice(0, 8);
        const personalizedProducts = await this.prisma.product.findMany({
            where: {
                storeId,
                id: { in: sortedProductIds },
                isActive: true,
            }
        });
        if (personalizedProducts.length < 8) {
            const fillProducts = await this.prisma.product.findMany({
                where: {
                    storeId,
                    isActive: true,
                    id: { notIn: sortedProductIds }
                },
                take: 8 - personalizedProducts.length,
            });
            personalizedProducts.push(...fillProducts);
        }
        return personalizedProducts;
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map