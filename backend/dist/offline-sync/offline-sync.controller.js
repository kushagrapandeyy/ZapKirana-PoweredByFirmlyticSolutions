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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineSyncController = exports.SyncBatchDto = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const store_scope_guard_1 = require("../common/guards/store-scope.guard");
const prisma_service_1 = require("../prisma.service");
const event_bus_service_1 = require("../common/events/event-bus.service");
class SyncBatchDto {
    deviceId;
    events;
}
exports.SyncBatchDto = SyncBatchDto;
let OfflineSyncController = class OfflineSyncController {
    prisma;
    eventBus;
    constructor(prisma, eventBus) {
        this.prisma = prisma;
        this.eventBus = eventBus;
    }
    async receiveBatch(req, body) {
        const storeId = req.params.storeId;
        const deviceId = body.deviceId;
        const results = [];
        for (const ev of body.events) {
            const existing = await this.prisma.offlineSyncEvent.findUnique({
                where: { storeId_localEventId_deviceId: { storeId, localEventId: ev.localEventId, deviceId } }
            });
            if (existing) {
                results.push({ localEventId: ev.localEventId, status: existing.status });
                continue;
            }
            const inboxEvent = await this.prisma.offlineSyncEvent.create({
                data: {
                    storeId,
                    deviceId,
                    localEventId: ev.localEventId,
                    idempotencyKey: ev.idempotencyKey,
                    operationType: ev.operationType,
                    payload: ev.payload,
                    baseVersion: ev.baseVersion,
                    createdAtDevice: new Date(ev.createdAtDevice),
                }
            });
            await this.eventBus.publish('offline.event.received', {
                storeId,
                inboxEventId: inboxEvent.id,
                operationType: ev.operationType,
            });
            results.push({ localEventId: ev.localEventId, status: 'PENDING' });
        }
        return { success: true, processed: results.length, results };
    }
};
exports.OfflineSyncController = OfflineSyncController;
__decorate([
    (0, common_1.Post)('batch/:storeId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, SyncBatchDto]),
    __metadata("design:returntype", Promise)
], OfflineSyncController.prototype, "receiveBatch", null);
exports.OfflineSyncController = OfflineSyncController = __decorate([
    (0, common_1.Controller)('offline-sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, store_scope_guard_1.StoreScopeGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_bus_service_1.EventBusService])
], OfflineSyncController);
//# sourceMappingURL=offline-sync.controller.js.map