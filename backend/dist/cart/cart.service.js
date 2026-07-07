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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const cache_service_1 = require("../cache/cache.service");
let CartService = class CartService {
    prisma;
    cache;
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
    }
    async getCart(userId, storeId) {
        const cacheKey = `cart:${userId}:${storeId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        let cart = await this.prisma.cart.findUnique({
            where: {
                userId_storeId: { userId, storeId },
            },
            include: {
                items: {
                    include: {
                        storeProduct: {
                            include: {
                                product: true,
                                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 }
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
        });
        if (!cart) {
            cart = await this.prisma.cart.create({
                data: { userId, storeId },
                include: {
                    items: {
                        include: {
                            storeProduct: {
                                include: {
                                    product: true,
                                    pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 }
                                }
                            }
                        }
                    }
                },
            });
        }
        const subtotal = cart.items.reduce((sum, item) => sum + ((item.storeProduct.pricing?.[0]?.sellingPrice?.toNumber() || 0) * item.quantity.toNumber()), 0);
        const totalMrp = cart.items.reduce((sum, item) => sum + ((item.storeProduct.pricing?.[0]?.mrp?.toNumber() || 0) * item.quantity.toNumber()), 0);
        const discount = totalMrp - subtotal;
        const result = { ...cart, subtotal, totalMrp, discount };
        await this.cache.set(cacheKey, result, 3600);
        return result;
    }
    async updateCartItem(userId, storeId, storeProductId, quantity) {
        const cart = await this.getCart(userId, storeId);
        if (quantity <= 0) {
            await this.prisma.cartItem.deleteMany({
                where: { cartId: cart.id, storeProductId },
            });
        }
        else {
            await this.prisma.cartItem.upsert({
                where: {
                    cartId_storeProductId: { cartId: cart.id, storeProductId },
                },
                update: { quantity },
                create: { cartId: cart.id, storeProductId, quantity },
            });
        }
        const cacheKey = `cart:${userId}:${storeId}`;
        await this.cache.delete(cacheKey);
        return this.getCart(userId, storeId);
    }
    async clearCart(userId, storeId) {
        const cart = await this.getCart(userId, storeId);
        await this.prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
        const cacheKey = `cart:${userId}:${storeId}`;
        await this.cache.delete(cacheKey);
        return { success: true };
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, cache_service_1.CacheService])
], CartService);
//# sourceMappingURL=cart.service.js.map