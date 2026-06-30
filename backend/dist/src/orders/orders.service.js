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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const client_1 = require("@prisma/client");
let OrdersService = class OrdersService {
    prisma;
    inventoryService;
    constructor(prisma, inventoryService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
    }
    async createOrder(storeId, customerId, items) {
        let totalAmount = 0;
        const validatedItems = [];
        for (const item of items) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            if (!product)
                throw new common_1.NotFoundException(`Product ${item.productId} not found`);
            const avail = await this.inventoryService.getAvailableStock(storeId, item.productId);
            if (avail.available < item.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for ${product.name}`);
            }
            validatedItems.push({
                productId: product.id,
                quantity: item.quantity,
                priceAtOrder: product.sellingPrice,
            });
            totalAmount += (product.sellingPrice * item.quantity);
        }
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    storeId,
                    customerId,
                    status: client_1.OrderStatus.PAYMENT_PENDING,
                    totalAmount,
                    items: {
                        create: validatedItems,
                    },
                },
            });
            for (const item of validatedItems) {
                await tx.inventory.updateMany({
                    where: { storeId, productId: item.productId },
                    data: {
                        reservedQty: { increment: item.quantity }
                    }
                });
                const inv = await tx.inventory.findFirst({ where: { storeId, productId: item.productId } });
                if (inv) {
                    await tx.stockMovement.create({
                        data: {
                            storeId,
                            productId: item.productId,
                            inventoryId: inv.id,
                            type: 'ONLINE_ORDER_RESERVED',
                            quantityChange: -item.quantity,
                            sourceType: 'ORDER',
                            sourceId: order.id,
                        }
                    });
                }
            }
            return order;
        });
    }
    async payOrder(orderId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.status !== client_1.OrderStatus.PAYMENT_PENDING) {
            throw new common_1.BadRequestException('Order not found or not pending payment');
        }
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.PAID },
        });
    }
    async pickOrder(orderId, staffId) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!order || (order.status !== client_1.OrderStatus.PAID && order.status !== client_1.OrderStatus.PICKING)) {
                throw new common_1.BadRequestException('Order cannot be picked');
            }
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.READY_FOR_PICKUP, staffId },
            });
            for (const item of order.items) {
                await tx.inventory.updateMany({
                    where: { storeId: order.storeId, productId: item.productId },
                    data: {
                        reservedQty: { decrement: item.quantity },
                        onHandQty: { decrement: item.quantity }
                    }
                });
                const inv = await tx.inventory.findFirst({ where: { storeId: order.storeId, productId: item.productId } });
                if (inv) {
                    await tx.stockMovement.create({
                        data: {
                            storeId: order.storeId,
                            productId: item.productId,
                            inventoryId: inv.id,
                            type: 'ONLINE_ORDER_PICKED',
                            quantityChange: -item.quantity,
                            sourceType: 'ORDER',
                            sourceId: order.id,
                            staffId,
                        }
                    });
                }
            }
            return updatedOrder;
        });
    }
    async getStoreOrders(storeId) {
        return this.prisma.order.findMany({
            where: { storeId },
            include: { items: { include: { product: true } }, customer: true },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map