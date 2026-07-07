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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async sendPush(userId, title, body, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true, name: true },
        });
        if (!user?.pushToken) {
            this.logger.debug(`No push token for user ${userId}`);
            return;
        }
        const message = {
            to: user.pushToken,
            sound: 'default',
            title,
            body,
            data: data ?? {},
        };
        try {
            const res = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });
            const json = await res.json();
            if (json?.data?.status === 'error') {
                this.logger.error(`Push failed for ${userId}: ${json.data.message}`);
            }
            else {
                this.logger.log(`Push sent to ${userId}: "${title}"`);
            }
        }
        catch (err) {
            this.logger.error(`Push delivery error: ${err.message}`);
        }
    }
    async broadcastToStore(storeId, title, body, data) {
        const staff = await this.prisma.user.findMany({
            where: { storeId, pushToken: { not: null } },
            select: { id: true },
        });
        await Promise.all(staff.map((s) => this.sendPush(s.id, title, body, data)));
    }
    async handlePurchaseOrderCreated(po) {
        this.logger.log(`PO created: ${po.id} for supplier ${po.supplierId}`);
        await this.broadcastToStore(po.storeId, '📦 Purchase Order Created', `PO sent to supplier. Total: ₹${po.totalAmount}`, { type: 'purchase_order', poId: po.id });
    }
    async handleLowStock(event) {
        this.logger.warn(`Low stock: product ${event.productId} in store ${event.storeId} → ${event.onHandQty} units`);
        const product = await this.prisma.product.findUnique({
            where: { id: event.productId },
            select: { name: true },
        });
        await this.broadcastToStore(event.storeId, '⚠️ Low Stock Alert', `${product?.name ?? 'A product'} is running low (${event.onHandQty} left). Consider reordering.`, { type: 'low_stock', productId: event.productId, onHandQty: event.onHandQty });
    }
    async handleSubscriptionOrderCreated(event) {
        await this.sendPush(event.customerId, '🛒 Subscription Order Placed', `Your recurring order (${event.productCount} items) is confirmed and being prepared.`, { type: 'subscription_order', orderId: event.orderId });
    }
    async handleOrderOutForDelivery(event) {
        await this.sendPush(event.customerId, '🚴 Your Order is on the Way!', 'Track your delivery in real-time in the app.', { type: 'order_tracking', orderId: event.orderId });
    }
    async handleOrderDelivered(event) {
        await this.sendPush(event.customerId, '✅ Order Delivered!', 'Your order has been delivered. Tap to rate your experience.', { type: 'order_delivered', orderId: event.orderId });
    }
};
exports.NotificationsService = NotificationsService;
__decorate([
    (0, event_emitter_1.OnEvent)('purchase_order.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handlePurchaseOrderCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('inventory.low_stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleLowStock", null);
__decorate([
    (0, event_emitter_1.OnEvent)('subscription.order_created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleSubscriptionOrderCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('order.out_for_delivery'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleOrderOutForDelivery", null);
__decorate([
    (0, event_emitter_1.OnEvent)('order.delivered'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleOrderDelivered", null);
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map