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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let SubscriptionsService = class SubscriptionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSubscription(data) {
        if (!data.items || data.items.length === 0) {
            throw new common_1.BadRequestException('At least one item is required');
        }
        const nextDeliveryDate = this.calculateNextDelivery(data.frequency);
        return this.prisma.subscription.create({
            data: {
                customerId: data.customerId,
                storeId: data.storeId,
                frequency: data.frequency,
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
    calculateNextDelivery(frequency) {
        const now = new Date();
        switch (frequency) {
            case 'DAILY':
                now.setDate(now.getDate() + 1);
                now.setHours(7, 0, 0, 0);
                break;
            case 'WEEKLY':
                now.setDate(now.getDate() + 7);
                break;
            case 'BIWEEKLY':
                now.setDate(now.getDate() + 14);
                break;
            case 'MONTHLY':
                now.setMonth(now.getMonth() + 1);
                break;
        }
        return now;
    }
    async processActiveSubscriptions() {
        const now = new Date();
        const dueSubscriptions = await this.prisma.subscription.findMany({
            where: {
                status: client_1.SubscriptionStatus.ACTIVE,
                nextDeliveryDate: { lte: now },
            },
            include: { items: true, customer: { include: { savedAddresses: true } } },
        });
        const results = [];
        for (const sub of dueSubscriptions) {
            try {
                const nextDeliveryDate = this.calculateNextDelivery(sub.frequency);
                await this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { nextDeliveryDate },
                });
                results.push({ subscriptionId: sub.id, status: 'processed', nextDeliveryDate });
            }
            catch (err) {
                results.push({ subscriptionId: sub.id, status: 'failed', error: err.message });
            }
        }
        return results;
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map