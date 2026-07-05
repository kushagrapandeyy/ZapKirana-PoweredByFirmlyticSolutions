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
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma.service");
const realtime_service_1 = require("../realtime/realtime.service");
const client_1 = require("@prisma/client");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    prisma;
    eventEmitter;
    realtimeService;
    logger = new common_1.Logger(SubscriptionsService_1.name);
    constructor(prisma, eventEmitter, realtimeService) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.realtimeService = realtimeService;
    }
    async createSubscription(data) {
        if (!data.items || data.items.length === 0) {
            throw new common_1.BadRequestException('At least one item is required');
        }
        const nextDeliveryDate = this.calculateNextDelivery(data.frequency, data.customDays);
        return this.prisma.subscription.create({
            data: {
                customerId: data.customerId,
                storeId: data.storeId,
                frequency: data.frequency,
                customDays: data.customDays || null,
                discountApplied: data.discountApplied || 0,
                deliverySlot: data.deliverySlot,
                nextDeliveryDate,
                status: client_1.SubscriptionStatus.ACTIVE,
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                    })),
                },
            },
            include: { items: true },
        });
    }
    async getSubscriptions(customerId) {
        return this.prisma.subscription.findMany({
            where: { customerId },
            include: {
                items: true,
                store: { select: { id: true, name: true, imageUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSubscriptionById(id) {
        const sub = await this.prisma.subscription.findUnique({
            where: { id },
            include: { items: true, store: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        return sub;
    }
    async pauseSubscription(id) {
        return this.prisma.subscription.update({
            where: { id },
            data: { status: client_1.SubscriptionStatus.PAUSED },
        });
    }
    async resumeSubscription(id) {
        const sub = await this.prisma.subscription.findUnique({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        const nextDeliveryDate = this.calculateNextDelivery(sub.frequency);
        return this.prisma.subscription.update({
            where: { id },
            data: {
                status: client_1.SubscriptionStatus.ACTIVE,
                nextDeliveryDate,
            },
        });
    }
    async cancelSubscription(id) {
        return this.prisma.subscription.update({
            where: { id },
            data: { status: client_1.SubscriptionStatus.CANCELLED },
        });
    }
    async updateSubscriptionItems(id, items) {
        await this.prisma.subscriptionItem.deleteMany({ where: { subscriptionId: id } });
        return this.prisma.subscription.update({
            where: { id },
            data: {
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                    })),
                },
            },
            include: { items: true },
        });
    }
    calculateNextDelivery(frequency, customDays) {
        const now = new Date();
        now.setDate(now.getDate() + 1);
        now.setHours(7, 0, 0, 0);
        switch (frequency) {
            case 'DAILY':
                break;
            case 'WEEKLY':
                now.setDate(now.getDate() + 6);
                break;
            case 'BIWEEKLY':
                now.setDate(now.getDate() + 13);
                break;
            case 'MONTHLY':
                now.setMonth(now.getMonth() + 1);
                break;
            case 'CUSTOM':
                if (customDays && Array.isArray(customDays) && customDays.length > 0) {
                    for (let i = 0; i < 7; i++) {
                        const dayStr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
                        if (customDays.includes(dayStr)) {
                            break;
                        }
                        now.setDate(now.getDate() + 1);
                    }
                }
                break;
        }
        return now;
    }
    async runDailySubscriptionCron() {
        this.logger.log('Running daily subscription processing cron...');
        const results = await this.processActiveSubscriptions();
        this.logger.log(`Subscription cron complete: ${results.length} processed`);
    }
    async processActiveSubscriptions() {
        const now = new Date();
        const dueSubscriptions = await this.prisma.subscription.findMany({
            where: {
                status: client_1.SubscriptionStatus.ACTIVE,
                nextDeliveryDate: { lte: now },
            },
            include: {
                items: true,
                customer: { include: { savedAddresses: true } },
            },
        });
        const results = [];
        const groupedSubs = new Map();
        for (const sub of dueSubscriptions) {
            const key = `${sub.storeId}_${sub.customerId}`;
            if (!groupedSubs.has(key))
                groupedSubs.set(key, []);
            groupedSubs.get(key).push(sub);
        }
        for (const [key, subs] of groupedSubs.entries()) {
            try {
                const firstSub = subs[0];
                const defaultAddress = firstSub.customer.savedAddresses.find((a) => a.isDefault) || firstSub.customer.savedAddresses[0];
                const combinedItems = [];
                let totalAmount = 0;
                let totalSavings = 0;
                for (const sub of subs) {
                    for (const item of sub.items) {
                        combinedItems.push({
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtOrder: 0,
                            gstAtOrder: 0,
                        });
                    }
                }
                const bundledOrder = await this.prisma.order.create({
                    data: {
                        storeId: firstSub.storeId,
                        customerId: firstSub.customerId,
                        status: client_1.OrderStatus.PAYMENT_PENDING,
                        totalAmount: 0,
                        subscriptionId: firstSub.id,
                        deliveryAddress: defaultAddress?.address,
                        deliveryLat: defaultAddress?.latitude,
                        deliveryLng: defaultAddress?.longitude,
                        items: { create: combinedItems },
                    },
                });
                results.push(bundledOrder);
                for (const sub of subs) {
                    const nextDate = this.calculateNextDelivery(sub.frequency, sub.customDays);
                    await this.prisma.subscription.update({
                        where: { id: sub.id },
                        data: { nextDeliveryDate: nextDate },
                    });
                }
                this.realtimeService.broadcastSubscriptionUpdate(firstSub.storeId, {
                    orderId: bundledOrder.id,
                    bundleSize: subs.length,
                    customerName: firstSub.customer.name
                });
            }
            catch (error) {
                this.logger.error(`Failed to process bundled subscription for key ${key}`, error);
            }
        }
        return results;
    }
    async getStoreSubscriptions(storeId) {
        return this.prisma.subscription.findMany({
            where: { storeId },
            include: {
                items: true,
                customer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            },
            orderBy: { nextDeliveryDate: 'asc' },
        });
    }
    async getDueTodayCount(storeId) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const count = await this.prisma.subscription.count({
            where: {
                storeId,
                status: client_1.SubscriptionStatus.ACTIVE,
                nextDeliveryDate: { gte: startOfDay, lte: endOfDay },
            },
        });
        return { storeId, dueToday: count, date: startOfDay.toISOString().substring(0, 10) };
    }
};
exports.SubscriptionsService = SubscriptionsService;
__decorate([
    (0, schedule_1.Cron)('0 5 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsService.prototype, "runDailySubscriptionCron", null);
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2,
        realtime_service_1.RealtimeService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map