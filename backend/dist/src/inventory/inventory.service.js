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
let InventoryService = class InventoryService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async recordMovement(data) {
        const result = await this.prisma.$transaction(async (tx) => {
            let inventory = await tx.inventory.findFirst({
                where: {
                    storeId: data.storeId,
                    productId: data.productId,
                    batchNo: data.batchNo || null,
                },
            });
            if (!inventory) {
                inventory = await tx.inventory.create({
                    data: {
                        storeId: data.storeId,
                        productId: data.productId,
                        batchNo: data.batchNo,
                        expiryDate: data.expiryDate,
                    },
                });
            }
            await tx.stockMovement.create({
                data: {
                    storeId: data.storeId,
                    productId: data.productId,
                    inventoryId: inventory.id,
                    type: data.type,
                    quantityChange: data.quantityChange,
                    sourceType: data.sourceType,
                    sourceId: data.sourceId,
                    reason: data.reason,
                    staffId: data.staffId,
                },
            });
            let onHandDelta = 0;
            let reservedDelta = 0;
            let blockedDelta = 0;
            switch (data.type) {
                case 'STOCK_RECEIVED':
                case 'RETURN_ACCEPTED':
                case 'MANUAL_ADJUSTMENT':
                case 'STOCK_COUNT_CORRECTION':
                    onHandDelta = data.quantityChange;
                    break;
                case 'POS_SALE':
                    onHandDelta = -data.quantityChange;
                    break;
                case 'ONLINE_ORDER_RESERVED':
                    reservedDelta = data.quantityChange;
                    break;
                case 'ONLINE_ORDER_PICKED':
                    onHandDelta = -data.quantityChange;
                    reservedDelta = -data.quantityChange;
                    break;
                case 'ORDER_CANCELLED':
                    reservedDelta = -data.quantityChange;
                    break;
                case 'DAMAGED':
                case 'EXPIRED':
                    onHandDelta = -data.quantityChange;
                    blockedDelta = data.quantityChange;
                    break;
            }
            if (inventory.onHandQty + onHandDelta < 0) {
                throw new common_1.BadRequestException(`Insufficient stock for product ${data.productId}`);
            }
            const updatedInventory = await tx.inventory.update({
                where: { id: inventory.id },
                data: {
                    onHandQty: { increment: onHandDelta },
                    reservedQty: { increment: reservedDelta },
                    blockedQty: { increment: blockedDelta },
                },
            });
            return { updatedInventory, onHandDelta };
        });
        if (result.onHandDelta < 0 && result.updatedInventory.onHandQty <= 10) {
            this.eventEmitter.emit('inventory.low_stock', {
                storeId: data.storeId,
                productId: data.productId,
                onHandQty: result.updatedInventory.onHandQty
            });
        }
        return result.updatedInventory;
    }
    async receiveStock(storeId, productId, qty, staffId, batchNo) {
        return this.recordMovement({
            storeId,
            productId,
            type: 'STOCK_RECEIVED',
            quantityChange: qty,
            batchNo,
            staffId,
        });
    }
    async reserveStockForOnlineOrder(storeId, productId, qty, orderId) {
        return this.recordMovement({
            storeId,
            productId,
            type: 'ONLINE_ORDER_RESERVED',
            quantityChange: qty,
            sourceType: 'ONLINE_ORDER',
            sourceId: orderId,
        });
    }
    async processPosSale(storeId, productId, qty, billId, staffId) {
        return this.recordMovement({
            storeId,
            productId,
            type: 'POS_SALE',
            quantityChange: qty,
            sourceType: 'POS_BILL',
            sourceId: billId,
            staffId,
        });
    }
    async getAvailableStock(storeId, productId) {
        const inventory = await this.prisma.inventory.findFirst({
            where: { storeId, productId },
        });
        if (!inventory)
            return { available: 0, onHand: 0, reserved: 0, blocked: 0 };
        const available = inventory.onHandQty - inventory.reservedQty - inventory.blockedQty;
        return {
            available: Math.max(0, available),
            onHand: inventory.onHandQty,
            reserved: inventory.reservedQty,
            blocked: inventory.blockedQty,
        };
    }
    async getProducts(storeId) {
        return this.prisma.product.findMany({
            where: storeId ? { storeId } : undefined,
        });
    }
    async getMovementHistory(storeId, productId) {
        return this.prisma.stockMovement.findMany({
            where: {
                storeId,
                ...(productId ? { productId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { name: true } },
                staff: { select: { name: true, role: true } },
            },
            take: 100,
        });
    }
    async handleGrnCompleted(event) {
        for (const item of event.po.items) {
            if (item.receivedQuantity > 0) {
                await this.receiveStock(event.po.storeId, item.productId, item.receivedQuantity, event.staffId, `PO-${event.po.id}`);
            }
        }
    }
    async getPendingProducts(storeId) {
        return this.prisma.pendingProduct.findMany({
            where: { storeId, status: 'PENDING_REVIEW' },
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { name: true, role: true } } },
        });
    }
    async approvePendingProduct(id, data) {
        return this.prisma.$transaction(async (tx) => {
            const pending = await tx.pendingProduct.findUnique({ where: { id } });
            if (!pending)
                throw new common_1.BadRequestException('Pending product not found');
            if (pending.status !== 'PENDING_REVIEW')
                throw new common_1.BadRequestException('Already processed');
            const product = await tx.product.create({
                data: {
                    storeId: pending.storeId,
                    name: data.name,
                    category: data.category || pending.suggestedCategory,
                    mrp: data.mrp,
                    sellingPrice: data.sellingPrice,
                    gstClass: data.gstClass || 'EXEMPT',
                    barcode: pending.barcode,
                    internalSku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    imageUrl: pending.imageUrl,
                },
            });
            if (pending.barcode) {
                await tx.barcodeRegistry.create({
                    data: {
                        storeId: pending.storeId,
                        productId: product.id,
                        barcodeValue: pending.barcode,
                        symbology: 'EAN_13',
                        barcodeScope: 'GS1_EXTERNAL_PRODUCT',
                    },
                });
            }
            await tx.pendingProduct.update({
                where: { id },
                data: { status: 'APPROVED', approvedProductId: product.id },
            });
            return product;
        });
    }
    async rejectPendingProduct(id) {
        const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
        if (!pending)
            throw new common_1.BadRequestException('Pending product not found');
        return this.prisma.pendingProduct.update({
            where: { id },
            data: { status: 'REJECTED' },
        });
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, event_emitter_1.EventEmitter2])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map