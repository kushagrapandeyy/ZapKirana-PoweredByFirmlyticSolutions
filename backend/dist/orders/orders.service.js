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
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
const order_state_machine_1 = require("./order-state-machine");
const library_1 = require("@prisma/client/runtime/library");
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
let OrdersService = class OrdersService {
    prisma;
    inventoryService;
    eventEmitter;
    constructor(prisma, inventoryService, eventEmitter) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
        this.eventEmitter = eventEmitter;
    }
    async createOrder(storeId, customerId, items, delivery, requireOtp) {
        const store = await this.prisma.store.findUnique({ where: { id: storeId } });
        if (!store)
            throw new common_1.NotFoundException('Store not found');
        if (delivery && store.latitude && store.longitude) {
            const distance = getDistanceKm(store.latitude, store.longitude, delivery.lat, delivery.lng);
            if (distance > store.operatingRadiusKm) {
                throw new common_1.BadRequestException(`Delivery address is ${distance.toFixed(1)}km away. This store only delivers within ${store.operatingRadiusKm}km.`);
            }
        }
        let totalAmount = new library_1.Decimal(0);
        const validatedItems = [];
        for (const item of items) {
            const sp = await this.prisma.storeProduct.findFirst({
                where: { id: item.storeProductId, storeId },
                include: {
                    product: { select: { name: true, hsnSacCode: true } },
                    pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                    taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
                },
            });
            if (!sp)
                throw new common_1.NotFoundException(`StoreProduct ${item.storeProductId} not found in store ${storeId}`);
            if (!sp.pricing?.length)
                throw new common_1.BadRequestException(`StoreProduct ${item.storeProductId} has no active pricing`);
            const pricing = sp.pricing[0];
            const tax = sp.taxProfile?.[0];
            const sellingPrice = pricing.sellingPrice ?? pricing.rateA ?? pricing.mrp ?? new library_1.Decimal(0);
            const qty = new library_1.Decimal(item.quantity);
            const cgstRate = tax?.cgstRate ?? new library_1.Decimal(0);
            const sgstRate = tax?.sgstRate ?? new library_1.Decimal(0);
            const igstRate = tax?.igstRate ?? new library_1.Decimal(0);
            const cessRate = tax?.cessRate ?? new library_1.Decimal(0);
            const totalGstRate = cgstRate.plus(sgstRate).plus(igstRate);
            let taxableValue;
            if (tax?.taxInclusive !== false && totalGstRate.greaterThan(0)) {
                taxableValue = sellingPrice.dividedBy(new library_1.Decimal(1).plus(totalGstRate.dividedBy(100))).times(qty).toDecimalPlaces(2);
            }
            else {
                taxableValue = sellingPrice.times(qty).toDecimalPlaces(2);
            }
            const lineTotal = sellingPrice.times(qty).toDecimalPlaces(2);
            totalAmount = totalAmount.plus(lineTotal);
            validatedItems.push({
                storeProductId: item.storeProductId,
                quantity: qty,
                priceAtOrderSnapshot: sellingPrice,
                productNameSnapshot: sp.displayName ?? sp.product?.name,
                hsnSacCodeSnapshot: tax?.hsnSacCode ?? sp.product?.hsnSacCode ?? undefined,
                mrpSnapshot: pricing.mrp != null ? pricing.mrp : undefined,
                taxableValueSnapshot: taxableValue,
                cgstRateSnapshot: cgstRate.greaterThan(0) ? cgstRate : undefined,
                cgstAmountSnapshot: taxableValue.times(cgstRate.dividedBy(100)).toDecimalPlaces(2),
                sgstRateSnapshot: sgstRate.greaterThan(0) ? sgstRate : undefined,
                sgstAmountSnapshot: taxableValue.times(sgstRate.dividedBy(100)).toDecimalPlaces(2),
                igstRateSnapshot: igstRate.greaterThan(0) ? igstRate : undefined,
                igstAmountSnapshot: taxableValue.times(igstRate.dividedBy(100)).toDecimalPlaces(2),
                cessRateSnapshot: cessRate.greaterThan(0) ? cessRate : undefined,
                cessAmountSnapshot: taxableValue.times(cessRate.dividedBy(100)).toDecimalPlaces(2),
                totalLineAmount: lineTotal,
            });
            const stock = await this.inventoryService.getAvailableStock(storeId, item.storeProductId);
            if (stock.available.lessThan(qty)) {
                throw new common_1.BadRequestException(`Insufficient stock for ${sp.displayName ?? sp.product?.name}`);
            }
        }
        const order = await this.prisma.$transaction(async (tx) => {
            return tx.order.create({
                data: {
                    storeId,
                    customerId,
                    status: client_1.OrderStatus.PAYMENT_PENDING,
                    totalAmount,
                    deliveryAddress: delivery?.address,
                    deliveryLat: delivery?.lat,
                    deliveryLng: delivery?.lng,
                    requireOtp: requireOtp ?? false,
                    items: { create: validatedItems },
                },
            });
        });
        for (const item of validatedItems) {
            await this.inventoryService.reserveStockForOnlineOrder(storeId, item.storeProductId, item.quantity.toNumber(), order.id);
        }
        return order;
    }
    async payOrder(orderId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.status !== client_1.OrderStatus.PAYMENT_PENDING) {
            throw new common_1.BadRequestException('Order not found or not pending payment');
        }
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.PAID },
        });
        this.eventEmitter.emit('order.status_changed', { orderId, status: 'PAID', customerId: order.customerId });
        return updated;
    }
    async pickOrder(orderId, staffId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order || (order.status !== client_1.OrderStatus.PAID && order.status !== client_1.OrderStatus.PICKING)) {
            throw new common_1.BadRequestException('Order cannot be picked');
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.READY_FOR_PICKUP, staffId },
        });
        for (const item of order.items) {
            await this.inventoryService.recordMovement({
                storeId: order.storeId,
                storeProductId: item.storeProductId,
                type: 'ONLINE_ORDER_PICKED',
                quantityChange: Number(item.quantity),
                sourceType: 'ORDER',
                sourceId: order.id,
                staffId,
            });
        }
        this.eventEmitter.emit('order.status_changed', {
            orderId, status: 'READY_FOR_PICKUP', customerId: order.customerId,
        });
        return updatedOrder;
    }
    async updateOrderStatus(orderId, status, staffId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        order_state_machine_1.OrderStateMachine.assertValidTransition(order.status, status);
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status, ...(staffId ? { staffId } : {}) },
        });
        this.eventEmitter.emit('order.status_changed', { orderId, status, customerId: updatedOrder.customerId });
        return updatedOrder;
    }
    async getStoreOrders(storeId, opts) {
        return this.prisma.order.findMany({
            where: { storeId, ...(opts?.status ? { status: opts.status } : {}) },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                items: {
                    include: {
                        storeProduct: {
                            include: { product: { select: { name: true } } },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: opts?.limit ?? 100,
        });
    }
    async getCustomerOrders(customerId) {
        return this.prisma.order.findMany({
            where: { customerId },
            include: {
                customer: { select: { id: true, name: true } },
                items: {
                    include: {
                        storeProduct: { include: { product: { select: { name: true } } } },
                    },
                },
                store: { select: { id: true, name: true, location: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getOrderById(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                items: {
                    include: {
                        storeProduct: { include: { product: { select: { name: true } } } },
                    },
                },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async startDelivery(orderId, staffId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.status !== client_1.OrderStatus.READY_FOR_PICKUP) {
            throw new common_1.BadRequestException('Order cannot be delivered yet');
        }
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.OUT_FOR_DELIVERY, staffId },
        });
        this.eventEmitter.emit('order.out_for_delivery', { customerId: order.customerId, orderId });
        this.eventEmitter.emit('order.status_changed', { orderId, status: 'OUT_FOR_DELIVERY', customerId: order.customerId });
        return updated;
    }
    async completeOrder(orderId, staffId, otp) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true },
        });
        if (!order || order.status !== client_1.OrderStatus.OUT_FOR_DELIVERY) {
            throw new common_1.BadRequestException('Order cannot be completed yet');
        }
        if (order.requireOtp) {
            if (!otp)
                throw new common_1.BadRequestException('OTP required for this delivery');
            const phone = order.customer?.phone;
            if (!phone || phone.length < 4)
                throw new common_1.BadRequestException('Customer phone invalid for OTP');
            const expectedOtp = phone.slice(-4);
            if (otp !== expectedOtp)
                throw new common_1.BadRequestException('Invalid OTP');
        }
        const completed = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.DELIVERED },
        });
        this.eventEmitter.emit('order.delivered', { customerId: order.customerId, orderId });
        this.eventEmitter.emit('order.status_changed', { orderId, status: 'DELIVERED', customerId: order.customerId });
        return completed;
    }
    async getOrderMessages(orderId) {
        return this.prisma.orderMessage.findMany({
            where: { orderId },
            include: { sender: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' },
        });
    }
    async addOrderMessage(orderId, senderId, text) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.prisma.orderMessage.create({
            data: { orderId, senderId, text },
            include: { sender: { select: { id: true, name: true, role: true } } },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService,
        event_emitter_1.EventEmitter2])
], OrdersService);
//# sourceMappingURL=orders.service.js.map