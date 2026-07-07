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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const cache_service_1 = require("../cache/cache.service");
const realtime_service_1 = require("../realtime/realtime.service");
const library_1 = require("@prisma/client/runtime/library");
let InventoryService = class InventoryService {
    prisma;
    eventEmitter;
    cache;
    realtimeService;
    constructor(prisma, eventEmitter, cache, realtimeService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.cache = cache;
        this.realtimeService = realtimeService;
    }
    async recordMovement(data) {
        const result = await this.prisma.$transaction(async (tx) => {
            let inventory = await tx.inventory.findFirst({
                where: {
                    storeId: data.storeId,
                    storeProductId: data.storeProductId,
                    batchNo: data.batchNo ?? null,
                },
                include: { storeProduct: { include: { inventoryPolicy: true } } },
            });
            if (!inventory) {
                inventory = await tx.inventory.create({
                    data: {
                        storeId: data.storeId,
                        storeProductId: data.storeProductId,
                        batchNo: data.batchNo,
                        expiryDate: data.expiryDate,
                    },
                    include: { storeProduct: { include: { inventoryPolicy: true } } },
                });
            }
            let onHandDelta = new library_1.Decimal(0);
            let reservedDelta = new library_1.Decimal(0);
            let blockedDelta = new library_1.Decimal(0);
            const qty = new library_1.Decimal(data.quantityChange);
            switch (data.type) {
                case 'OPENING_STOCK':
                case 'PURCHASE_RECEIPT':
                case 'SALE_RETURN':
                case 'STOCK_TRANSFER_IN':
                case 'MANUAL_ADJUSTMENT':
                case 'STOCK_COUNT_CORRECTION':
                case 'STOCK_RECEIVED':
                case 'RETURN_ACCEPTED':
                    onHandDelta = qty;
                    break;
                case 'SALE_DEDUCTION':
                case 'POS_SALE':
                case 'SALE':
                    onHandDelta = qty.negated();
                    break;
                case 'RESERVATION':
                case 'ONLINE_ORDER_RESERVED':
                    reservedDelta = qty;
                    break;
                case 'RESERVATION_RELEASE':
                case 'ORDER_CANCELLED':
                    reservedDelta = qty.negated();
                    break;
                case 'ONLINE_ORDER_PICKED':
                    onHandDelta = qty.negated();
                    reservedDelta = qty.negated();
                    break;
                case 'DAMAGE_WRITE_OFF':
                case 'EXPIRY_WRITE_OFF':
                case 'DAMAGED':
                case 'EXPIRED':
                case 'DAMAGE':
                    onHandDelta = qty.negated();
                    blockedDelta = qty;
                    break;
                case 'STOCK_TRANSFER_OUT':
                case 'PURCHASE_RETURN':
                    onHandDelta = qty.negated();
                    break;
            }
            const currentQty = new library_1.Decimal(inventory.quantityBase);
            const newQty = currentQty.plus(onHandDelta);
            if (!inventory.storeProduct?.inventoryPolicy?.allowNegativeStock && newQty.lessThan(0)) {
                throw new common_1.BadRequestException(`Insufficient stock for storeProduct ${data.storeProductId}. Available: ${currentQty}, Requested: ${qty}`);
            }
            const movement = await tx.stockMovement.create({
                data: {
                    storeId: data.storeId,
                    storeProductId: data.storeProductId,
                    inventoryId: inventory.id,
                    type: data.type,
                    quantityDelta: onHandDelta,
                    previousQty: currentQty,
                    newQty,
                    inputQuantity: qty,
                    sourceType: data.sourceType,
                    sourceId: data.sourceId,
                    reason: data.reason,
                    note: data.note,
                    staffId: data.staffId,
                },
            });
            const updatedInventory = await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                    quantityBase: { increment: onHandDelta.toNumber() },
                    reservedQty: { increment: reservedDelta.toNumber() },
                    blockedQty: { increment: blockedDelta.toNumber() },
                },
            });
            await tx.stockBalance.upsert({
                where: { storeId_storeProductId: { storeId: data.storeId, storeProductId: data.storeProductId } },
                update: {
                    balance: { increment: onHandDelta.toNumber() },
                    lastMovementId: movement.id,
                    lastCalculatedAt: new Date(),
                },
                create: {
                    storeId: data.storeId,
                    storeProductId: data.storeProductId,
                    balance: onHandDelta.toNumber(),
                    lastMovementId: movement.id,
                },
            });
            return { updatedInventory, onHandDelta };
        });
        const policy = await this.prisma.productInventoryPolicy.findUnique({
            where: { storeProductId: data.storeProductId },
        });
        const currentQty = Number(result.updatedInventory.quantityBase);
        const reorderQty = policy?.reorderQty ? Number(policy.reorderQty) : 10;
        if (result.onHandDelta.lessThan(0) && currentQty <= reorderQty) {
            this.eventEmitter.emit('inventory.low_stock', {
                storeId: data.storeId,
                storeProductId: data.storeProductId,
                currentQty,
                reorderQty,
            });
        }
        this.realtimeService.broadcastInventoryUpdate(data.storeId, data.storeProductId, {
            onHandQty: currentQty,
            availableQty: currentQty - Number(result.updatedInventory.reservedQty) - Number(result.updatedInventory.blockedQty),
        });
        return result.updatedInventory;
    }
    async receiveStock(storeId, storeProductId, qty, staffId, batchNo) {
        return this.recordMovement({ storeId, storeProductId, type: 'STOCK_RECEIVED', quantityChange: qty, batchNo, staffId });
    }
    async reserveStockForOnlineOrder(storeId, storeProductId, qty, orderId) {
        return this.recordMovement({
            storeId, storeProductId, type: 'ONLINE_ORDER_RESERVED', quantityChange: qty,
            sourceType: 'ONLINE_ORDER', sourceId: orderId,
        });
    }
    async processPosSale(storeId, storeProductId, qty, billId, staffId) {
        return this.recordMovement({
            storeId, storeProductId, type: 'POS_SALE', quantityChange: qty,
            sourceType: 'POS_BILL', sourceId: billId, staffId,
        });
    }
    async getAvailableStock(storeId, storeProductId) {
        const inventory = await this.prisma.inventory.findFirst({
            where: { storeId, storeProductId },
        });
        if (!inventory)
            return { available: new library_1.Decimal(0), onHand: new library_1.Decimal(0), reserved: new library_1.Decimal(0), blocked: new library_1.Decimal(0) };
        const onHand = new library_1.Decimal(inventory.quantityBase);
        const reserved = new library_1.Decimal(inventory.reservedQty);
        const blocked = new library_1.Decimal(inventory.blockedQty);
        const available = library_1.Decimal.max(0, onHand.minus(reserved).minus(blocked));
        return { available, onHand, reserved, blocked };
    }
    async getStockBalance(storeId, storeProductId) {
        return this.prisma.inventory.findFirst({
            where: { storeId, storeProductId },
        });
    }
    async getProducts(storeId) {
        const cacheKey = `inventory:storeproducts:${storeId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const products = await this.prisma.storeProduct.findMany({
            where: { storeId, status: { not: 'INACTIVE' }, isHidden: false },
            include: {
                product: { include: { brand: true, category: true } },
                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                productBarcodes: { where: { isPrimary: true, isActive: true }, take: 1 },
                stockBalances: true,
                campaigns: { where: { isActive: true }, take: 1 },
            },
            orderBy: { displayName: 'asc' },
        });
        await this.cache.set(cacheKey, products, 300);
        return products;
    }
    async getClearanceProducts(storeId) {
        const cacheKey = `inventory:clearance:${storeId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const expiringInventory = await this.prisma.inventory.findMany({
            where: {
                storeId,
                expiryDate: { lte: threeDaysFromNow, gte: new Date() },
                quantityBase: { gt: 0 },
            },
            include: {
                storeProduct: {
                    include: {
                        product: { include: { brand: true } },
                        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                    },
                },
            },
        });
        const productMap = new Map();
        for (const inv of expiringInventory) {
            if (!productMap.has(inv.storeProductId)) {
                const pricing = inv.storeProduct.pricing?.[0];
                const originalPrice = pricing?.sellingPrice ? Number(pricing.sellingPrice) : 0;
                productMap.set(inv.storeProductId, {
                    ...inv.storeProduct,
                    originalPrice,
                    clearancePrice: Number((originalPrice * 0.7).toFixed(2)),
                    clearanceReason: 'Expiring Soon',
                    expiryDate: inv.expiryDate,
                });
            }
        }
        const result = Array.from(productMap.values());
        await this.cache.set(cacheKey, result, 600);
        return result;
    }
    async getNewProducts(storeId) {
        const cacheKey = `inventory:new:${storeId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const result = await this.prisma.storeProduct.findMany({
            where: { storeId, status: { not: 'INACTIVE' }, createdAt: { gte: sevenDaysAgo } },
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: {
                product: { include: { brand: true, category: true } },
                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                productBarcodes: { where: { isPrimary: true }, take: 1 },
                campaigns: { where: { isActive: true }, take: 1 },
            },
        });
        await this.cache.set(cacheKey, result, 600);
        return result;
    }
    async getPopularProducts(storeId) {
        const cacheKey = `inventory:popular:${storeId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached)
            return cached;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const movements = await this.prisma.stockMovement.groupBy({
            by: ['storeProductId'],
            where: { storeId, type: { in: ['POS_SALE', 'SALE_DEDUCTION'] }, createdAt: { gte: thirtyDaysAgo } },
            _sum: { quantityDelta: true },
            orderBy: { _sum: { quantityDelta: 'desc' } },
            take: 10,
        });
        const storeProductIds = movements.map((m) => m.storeProductId);
        if (!storeProductIds.length)
            return [];
        const products = await this.prisma.storeProduct.findMany({
            where: { id: { in: storeProductIds } },
            include: {
                product: { include: { brand: true, category: true } },
                pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                productBarcodes: { where: { isPrimary: true }, take: 1 },
                stockBalances: true,
            },
        });
        await this.cache.set(cacheKey, products, 300);
        return products;
    }
    async getMovementHistory(storeId, storeProductId) {
        return this.prisma.stockMovement.findMany({
            where: { storeId, ...(storeProductId ? { storeProductId } : {}) },
            orderBy: { createdAt: 'desc' },
            include: {
                storeProduct: { include: { product: { select: { name: true } } } },
                staff: { select: { name: true, role: true } },
            },
            take: 100,
        });
    }
    async handleGrnCompleted(event) {
        for (const item of event.po.items) {
            if (item.receivedQuantity > 0) {
                const storeProductId = item.storeProductId ?? item.productId;
                await this.receiveStock(event.po.storeId, storeProductId, Number(item.receivedQuantity), event.staffId, `PO-${event.po.id}`);
            }
        }
    }
    async getLowStockProducts(storeId) {
        const policies = await this.prisma.productInventoryPolicy.findMany({
            where: { storeProduct: { storeId } },
            include: { storeProduct: { include: { inventory: true, product: { select: { name: true } } } } },
        });
        return policies
            .filter((p) => {
            const balance = p.storeProduct?.inventory?.[0]?.quantityBase;
            const reorderQty = p.reorderQty ?? new library_1.Decimal(10);
            return balance != null && new library_1.Decimal(balance).lessThanOrEqualTo(reorderQty);
        })
            .map((p) => ({
            storeProductId: p.storeProductId,
            name: p.storeProduct?.displayName ?? p.storeProduct?.product?.name ?? 'Unknown',
            currentQty: Number(p.storeProduct?.inventory?.[0]?.quantityBase ?? 0),
            reorderQty: Number(p.reorderQty ?? 10),
            minimumQty: Number(p.minimumQty ?? 0),
        }));
    }
};
exports.InventoryService = InventoryService;
__decorate([
    (0, event_emitter_1.OnEvent)('purchase_order.grn_completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InventoryService.prototype, "handleGrnCompleted", null);
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        cache_service_1.CacheService,
        realtime_service_1.RealtimeService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map