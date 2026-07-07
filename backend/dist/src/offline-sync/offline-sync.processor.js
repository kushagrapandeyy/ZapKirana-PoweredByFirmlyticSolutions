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
var OfflineSyncProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineSyncProcessor = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma.service");
const event_bus_service_1 = require("../common/events/event-bus.service");
const inventory_service_1 = require("../inventory/inventory.service");
let OfflineSyncProcessor = OfflineSyncProcessor_1 = class OfflineSyncProcessor {
    prisma;
    eventBus;
    inventory;
    logger = new common_1.Logger(OfflineSyncProcessor_1.name);
    constructor(prisma, eventBus, inventory) {
        this.prisma = prisma;
        this.eventBus = eventBus;
        this.inventory = inventory;
    }
    async handleOfflineEvent(payload) {
        this.logger.debug(`Processing offline event: ${payload.inboxEventId}`);
        const event = await this.prisma.offlineSyncEvent.findUnique({ where: { id: payload.inboxEventId } });
        if (!event || event.status !== 'PENDING')
            return;
        try {
            if (event.operationType === 'POS_SALE') {
                await this.processPosSale(event);
            }
            else {
                throw new Error(`Unknown operation type: ${event.operationType}`);
            }
            await this.prisma.offlineSyncEvent.update({
                where: { id: event.id },
                data: { status: 'PROCESSED', processedAt: new Date() }
            });
        }
        catch (e) {
            this.logger.warn(`Conflict resolving offline event ${event.id}: ${e.message}`);
            await this.prisma.offlineSyncEvent.update({
                where: { id: event.id },
                data: { status: 'CONFLICT', conflictReason: e.message, processedAt: new Date() }
            });
        }
    }
    async processPosSale(event) {
        const saleData = event.payload;
        for (const item of saleData.items) {
            const currentStock = await this.prisma.stockBalance.findUnique({
                where: { storeId_productId: { storeId: event.storeId, productId: item.productId } }
            });
            if (!currentStock || currentStock.balance < item.quantity) {
                throw new Error(`Insufficient stock for offline sale of ${item.productId}`);
            }
            await this.inventory.recordMovement({
                storeId: event.storeId,
                productId: item.productId,
                type: 'SALE',
                quantityChange: item.quantity,
                sourceType: 'OFFLINE_POS_SALE',
                sourceId: event.idempotencyKey,
            });
        }
        await this.eventBus.publish('pos.sale.completed', {
            storeId: event.storeId,
            saleData,
            sourceEventId: event.id,
        });
    }
};
exports.OfflineSyncProcessor = OfflineSyncProcessor;
__decorate([
    (0, event_emitter_1.OnEvent)('offline.event.received'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OfflineSyncProcessor.prototype, "handleOfflineEvent", null);
exports.OfflineSyncProcessor = OfflineSyncProcessor = OfflineSyncProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_bus_service_1.EventBusService,
        inventory_service_1.InventoryService])
], OfflineSyncProcessor);
//# sourceMappingURL=offline-sync.processor.js.map