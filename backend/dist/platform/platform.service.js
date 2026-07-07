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
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async getNearbyStores(lat, lng, radiusKm = 5) {
        const cacheKey = `platform:nearby_stores:${Math.round(lat * 100)}:${Math.round(lng * 100)}:${radiusKm}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const stores = await this.prisma.store.findMany({
            where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
            include: {
                inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } },
                products: {
                    where: { isActive: true },
                    take: 4,
                    select: { id: true, name: true, imageUrl: true, sellingPrice: true }
                }
            },
        });
        const result = stores
            .map((store) => {
            const distance = haversineKm(lat, lng, store.latitude, store.longitude);
            const availableSkus = store.inventory.filter((i) => i.onHandQty - i.reservedQty - i.blockedQty > 0).length;
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
                availableSkus,
                description: store.description,
                topProducts: store.products
            };
        })
            .filter((s) => s.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm);
        await this.cache.set(cacheKey, result, 60);
        return result;
    }
    async searchCatalog(query, lat, lng, radiusKm = 5) {
        const products = await this.prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: {
                store: {
                    select: {
                        id: true, name: true, latitude: true, longitude: true, rating: true, imageUrl: true,
                    },
                },
                inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } },
            },
        });
        const results = products
            .filter((p) => p.store.latitude && p.store.longitude)
            .map((p) => {
            const distance = haversineKm(lat, lng, p.store.latitude, p.store.longitude);
            const inv = p.inventory[0];
            const available = inv ? Math.max(0, inv.onHandQty - inv.reservedQty - inv.blockedQty) : 0;
            return {
                productId: p.id,
                name: p.name,
                category: p.category,
                mrp: p.mrp,
                sellingPrice: p.sellingPrice,
                imageUrl: p.imageUrl,
                barcode: p.barcode,
                store: { id: p.store.id, name: p.store.name, imageUrl: p.store.imageUrl, rating: p.store.rating },
                distanceKm: Math.round(distance * 10) / 10,
                availableQty: available,
                inStock: available > 0,
            };
        })
            .filter((p) => p.distanceKm <= radiusKm)
            .sort((a, b) => {
            if (a.inStock !== b.inStock)
                return a.inStock ? -1 : 1;
            if (a.distanceKm !== b.distanceKm)
                return a.distanceKm - b.distanceKm;
            return a.sellingPrice - b.sellingPrice;
        });
        const grouped = {};
        for (const r of results) {
            const key = r.name.toLowerCase().trim();
            if (!grouped[key]) {
                grouped[key] = { name: r.name, category: r.category, imageUrl: r.imageUrl, stores: [] };
            }
            grouped[key].stores.push({
                productId: r.productId,
                storeId: r.store.id,
                storeName: r.store.name,
                storeImageUrl: r.store.imageUrl,
                storeRating: r.store.rating,
                sellingPrice: r.sellingPrice,
                mrp: r.mrp,
                distanceKm: r.distanceKm,
                availableQty: r.availableQty,
                inStock: r.inStock,
            });
        }
        return {
            query,
            lat,
            lng,
            radiusKm,
            totalResults: results.length,
            products: Object.values(grouped),
        };
    }
    async searchByBarcode(barcode, lat, lng, radiusKm = 5) {
        const products = await this.prisma.product.findMany({
            where: { barcode, isActive: true },
            include: {
                store: {
                    select: { id: true, name: true, latitude: true, longitude: true, rating: true, imageUrl: true },
                },
                inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } },
            },
        });
        const results = products
            .filter((p) => p.store.latitude && p.store.longitude)
            .map((p) => {
            const distance = haversineKm(lat, lng, p.store.latitude, p.store.longitude);
            const inv = p.inventory[0];
            const available = inv ? Math.max(0, inv.onHandQty - inv.reservedQty - inv.blockedQty) : 0;
            return {
                productId: p.id,
                name: p.name,
                category: p.category,
                mrp: p.mrp,
                sellingPrice: p.sellingPrice,
                imageUrl: p.imageUrl,
                store: { id: p.store.id, name: p.store.name, imageUrl: p.store.imageUrl, rating: p.store.rating },
                distanceKm: Math.round(distance * 10) / 10,
                availableQty: available,
                inStock: available > 0,
            };
        })
            .filter((p) => p.distanceKm <= radiusKm)
            .sort((a, b) => {
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
        const products = await this.prisma.product.findMany({
            where: { storeId, isActive: true },
            include: { inventory: { select: { onHandQty: true, reservedQty: true, blockedQty: true } } },
        });
        const ondcItems = products.map((p) => {
            const inv = p.inventory[0];
            const available = inv ? Math.max(0, inv.onHandQty - inv.reservedQty - inv.blockedQty) : 0;
            return {
                id: p.id,
                descriptor: {
                    name: p.name,
                    short_desc: p.description ?? '',
                    images: p.imageUrl ? [p.imageUrl] : [],
                    code: p.barcode ?? p.skuCode,
                },
                price: {
                    currency: 'INR',
                    value: String(p.sellingPrice),
                    maximum_value: String(p.mrp),
                },
                quantity: {
                    available: { count: String(available) },
                    maximum: { count: String(available) },
                },
                category_id: p.category ?? 'grocery',
                tags: [
                    { code: 'tax_rate', list: [{ code: 'tax_rate', value: String(p.gstRate) }] },
                ],
            };
        });
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
                data: {
                    name: `${data.storeName} Org`,
                    legalName: data.storeName,
                    gstin: data.gstin,
                },
            });
            const store = await tx.store.create({
                data: {
                    organizationId: org.id,
                    name: data.storeName,
                    location: data.storeLocation,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    gstin: data.gstin,
                    taxId: data.fssai,
                },
            });
            const user = await tx.user.create({
                data: {
                    name: data.ownerName,
                    email: data.ownerEmail,
                    phone: data.ownerPhone,
                    role: 'OWNER',
                    organizationId: org.id,
                    storeId: store.id,
                },
            });
            await tx.userStoreRole.create({
                data: {
                    userId: user.id,
                    storeId: store.id,
                    organizationId: org.id,
                    role: 'OWNER',
                },
            });
            return {
                message: 'Vendor successfully onboarded',
                organization: org,
                store,
                user,
            };
        });
    }
};
exports.PlatformService = PlatformService;
exports.PlatformService = PlatformService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService])
], PlatformService);
//# sourceMappingURL=platform.service.js.map