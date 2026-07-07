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
var RealtimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma.service");
const supabase_js_1 = require("@supabase/supabase-js");
let RealtimeService = RealtimeService_1 = class RealtimeService {
    prisma;
    supabase;
    logger = new common_1.Logger(RealtimeService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    async broadcastOrderUpdate(storeId, orderId, payload) {
        try {
            await this.supabase.channel(`store:${storeId}:orders`).send({
                type: 'broadcast',
                event: 'order_update',
                payload,
            });
            await this.supabase.channel(`order:${orderId}`).send({
                type: 'broadcast',
                event: 'order_status_change',
                payload,
            });
            this.logger.log(`Broadcasted order update for order ${orderId} in store ${storeId}`);
        }
        catch (error) {
            this.logger.error(`Error broadcasting order update: ${error}`);
        }
    }
    async broadcastInventoryUpdate(storeId, productId, payload) {
        try {
            await this.supabase.channel(`store:${storeId}:inventory`).send({
                type: 'broadcast',
                event: 'inventory_update',
                payload: { productId, ...payload },
            });
        }
        catch (error) {
            this.logger.error(`Error broadcasting inventory update: ${error}`);
        }
    }
    async broadcastSubscriptionUpdate(storeId, payload) {
        try {
            await this.supabase.channel(`store:${storeId}:subscriptions`).send({
                type: 'broadcast',
                event: 'subscription_update',
                payload,
            });
            this.logger.log(`Broadcasted subscription update for store ${storeId}`);
        }
        catch (error) {
            this.logger.error(`Error broadcasting subscription update: ${error}`);
        }
    }
    async handleOrderStatusChanged(event) {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: event.orderId },
                include: { items: { include: { storeProduct: true } } }
            });
            if (order) {
                await this.broadcastOrderUpdate(order.storeId, event.orderId, order);
            }
        }
        catch (e) {
            this.logger.error('Failed to fetch order for broadcast', e);
        }
    }
};
exports.RealtimeService = RealtimeService;
__decorate([
    (0, event_emitter_1.OnEvent)('order.status_changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeService.prototype, "handleOrderStatusChanged", null);
exports.RealtimeService = RealtimeService = RealtimeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map