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
exports.PlatformService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const cache_service_1 = require("../cache/cache.service");
const inventory_service_1 = require("../inventory/inventory.service");
function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
let PlatformService = class PlatformService {
    prisma;
    cache;
    inventoryService;
    constructor(prisma, cache, inventoryService) {
        this.prisma = prisma;
        this.cache = cache;
        this.inventoryService = inventoryService;
    }
    async getNearbyStores(lat, lng, radiusKm = 5) {
        const cacheKey = `platform:nearby_stores:${Math.round(lat * 100)}:${Math.round(lng * 100)}:${radiusKm}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
            include: {
                storeProducts: {
                    where: { status: 'ACTIVE' },
                    take: 4,
                    include: { product: true, pricing: true }
                }
            },
        });
        const result = stores
            .map((store) => {
            const distance = haversineKm(lat, lng, store.latitude, store.longitude);
            return {
                id: store.id,
                name: store.name,
                location: store.location,
                latitude: store.latitude,
                longitude: store.longitude,
                imageUrl: store.imageUrl,
                rating: store.rating,
                operatingHours: store.operatingHours,
                distanceKm: Math.round(distance * 10) / 10,
                availableSkus: store.storeProducts.length,
                description: store.description,
                topProducts: store.storeProducts.map(sp => ({
                    id: sp.id,
                    name: sp.displayName || sp.product?.name,
                    imageUrl: sp.product?.imageUrl,
                    sellingPrice: sp.pricing?.[0]?.sellingPrice?.toNumber() || 0
                }))
            };
        })
            .filter((s) => s.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm);
        await this.cache.set(cacheKey, result, 60);
        return result;
    }
    async searchCatalog(query, lat, lng, radiusKm = 5) {
        const products = await this.prisma.storeProduct.findMany({
            where: {
                status: 'ACTIVE',
                OR: [
                    { displayName: { contains: query, mode: 'insensitive' } },
                    { product: { name: { contains: query, mode: 'insensitive' } } },
                    { product: { category: { name: { contains: query, mode: 'insensitive' } } } },
                ],
            },
            include: {
                store: { select: { id: true, name: true, latitude: true, longitude: true, rating: true, imageUrl: true } },
                product: { include: { category: true } },
                pricing: true,
                productBarcodes: true
            },
        });
        const results = [];
        for (const p of products) {
            if (!p.store.latitude || !p.store.longitude)
                continue;
            const distance = haversineKm(lat, lng, p.store.latitude, p.store.longitude);
            if (distance > radiusKm)
                continue;
            const inv = await this.inventoryService.getAvailableStock(p.store.id, p.id);
            const available = inv.onHand.toNumber();
            results.push({
                productId: p.id,
                name: p.displayName || p.product?.name,
                category: p.product?.category?.name,
                mrp: p.pricing?.[0]?.mrp?.toNumber() || 0,
                sellingPrice: p.pricing?.[0]?.sellingPrice?.toNumber() || 0,
                imageUrl: p.product?.imageUrl,
                barcode: p.productBarcodes?.[0]?.barcode,
                store: p.store,
                distanceKm: Math.round(distance * 10) / 10,
                availableQty: available,
                inStock: available > 0,
            });
        }
        results.sort((a, b) => {
            if (a.inStock !== b.inStock)
                return a.inStock ? -1 : 1;
            if (a.distanceKm !== b.distanceKm)
                return a.distanceKm - b.distanceKm;
            return a.sellingPrice - b.sellingPrice;
        });
        const grouped = {};
        for (const r of results) {
            const key = (r.name || '').toLowerCase().trim();
            if (!grouped[key]) {
                grouped[key] = { name: r.name, category: r.category, imageUrl: r.imageUrl, stores: [] };
            }
            grouped[key].stores.push(r);
        }
        return {
            query, lat, lng, radiusKm,
            totalResults: results.length,
            products: Object.values(grouped),
        };
    }
    async searchByBarcode(barcode, lat, lng, radiusKm = 5) {
        const barcodes = await this.prisma.storeProductBarcode.findMany({
            where: { barcode },
            include: {
                storeProduct: {
                    include: {
                        store: { select: { id: true, name: true, latitude: true, longitude: true, rating: true, imageUrl: true } },
                        product: { include: { category: true } },
                        pricing: true
                    }
                }
            }
        });
        const results = [];
        for (const b of barcodes) {
            const p = b.storeProduct;
            if (p.status !== 'ACTIVE' || !p.store.latitude || !p.store.longitude)
                continue;
            const distance = haversineKm(lat, lng, p.store.latitude, p.store.longitude);
            if (distance > radiusKm)
                continue;
            const inv = await this.inventoryService.getAvailableStock(p.store.id, p.id);
            const available = inv.onHand.toNumber();
            results.push({
                productId: p.id,
                name: p.displayName || p.product?.name,
                category: p.product?.category?.name,
                mrp: p.pricing?.[0]?.mrp?.toNumber() || 0,
                sellingPrice: p.pricing?.[0]?.sellingPrice?.toNumber() || 0,
                imageUrl: p.product?.imageUrl,
                store: p.store,
                distanceKm: Math.round(distance * 10) / 10,
                availableQty: available,
                inStock: available > 0,
            });
        }
        results.sort((a, b) => {
            if (a.inStock !== b.inStock)
                return a.inStock ? -1 : 1;
            return a.sellingPrice - b.sellingPrice;
        });
        return { barcode, totalStores: results.length, stores: results };
    }
    async buildOndcCatalog(storeId) {
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store)
            return { error: 'Store not found' };
        const products = await this.prisma.storeProduct.findMany({
            where: { storeId, status: 'ACTIVE' },
            include: { product: true, pricing: true, productBarcodes: true, taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 } },
        });
        const ondcItems = [];
        for (const p of products) {
            const inv = await this.inventoryService.getAvailableStock(storeId, p.id);
            const available = inv.onHand.toNumber();
            ondcItems.push({
                id: p.id,
                descriptor: {
                    name: p.displayName || p.product?.name,
                    short_desc: p.product?.packagingDescription ?? '',
                    images: p.product?.imageUrl ? [p.product?.imageUrl] : [],
                    code: p.productBarcodes?.[0]?.barcode ?? p.product?.id,
                },
                price: {
                    currency: 'INR',
                    value: String(p.pricing?.[0]?.sellingPrice?.toNumber() || 0),
                    maximum_value: String(p.pricing?.[0]?.mrp?.toNumber() || 0),
                },
                quantity: {
                    available: { count: String(available) },
                    maximum: { count: String(available) },
                },
                category_id: 'grocery',
                tags: [
                    { code: 'tax_rate', list: [{ code: 'tax_rate', value: String(p.taxProfile?.[0]?.gstRate?.toNumber() || 0) }] },
                ],
            });
        }
        const catalog = {
            bpp_id: `zapkirana-${storeId}`,
            bpp_uri: `https://api.zapkirana.in/ondc/${storeId}`,
            descriptor: { name: store.name, images: store.imageUrl ? [store.imageUrl] : [] },
            fulfillments: [
                {
                    id: `f-${storeId}`,
                    type: 'Delivery',
                    start: {
                        location: {
                            gps: `${store.latitude},${store.longitude}`,
                            address: { locality: store.location ?? '' },
                        },
                    },
                },
            ],
            items: ondcItems,
            itemCount: ondcItems.length,
            generatedAt: new Date().toISOString(),
        };
        return catalog;
    }
    async onboardVendor(data) {
        return this.prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: { name: `${data.storeName} Org`, legalName: data.storeName, gstin: data.gstin },
            });
            const store = await tx.store.create({
                data: {
                    organizationId: org.id, name: data.storeName, location: data.storeLocation,
                    latitude: data.latitude, longitude: data.longitude, gstin: data.gstin, taxId: data.fssai,
                },
            });
            const user = await tx.user.create({
                data: {
                    name: data.ownerName, email: data.ownerEmail, phone: data.ownerPhone,
                    role: 'OWNER', organizationId: org.id, storeId: store.id,
                },
            });
            await tx.userStoreRole.create({
                data: { userId: user.id, storeId: store.id, organizationId: org.id, role: 'OWNER' },
            });
            return { message: 'Vendor successfully onboarded', organization: org, store, user };
        });
    }
};
exports.PlatformService = PlatformService;
exports.PlatformService = PlatformService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        inventory_service_1.InventoryService])
], PlatformService);
//# sourceMappingURL=platform.service.js.map