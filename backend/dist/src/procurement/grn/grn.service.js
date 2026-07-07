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
exports.GrnService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const client_1 = require("@prisma/client");
let GrnService = class GrnService {
    prisma;
    eventEmitter;
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async receiveGoods(poId, receivedItems, staffId) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: { items: true }
        });
        if (!po)
            throw new common_1.NotFoundException('PO not found');
        if (po.status !== client_1.POStatus.ACCEPTED && po.status !== client_1.POStatus.PARTIALLY_ACCEPTED) {
            throw new common_1.BadRequestException(`Cannot receive goods for PO with status ${po.status}`);
        }
        for (const item of receivedItems) {
            const poItem = po.items.find((i) => i.id === item.poItemId);
            if (!poItem)
                throw new common_1.BadRequestException(`Item ${item.poItemId} not in PO`);
            await this.prisma.purchaseOrderItem.update({
                where: { id: poItem.id },
                data: { receivedQuantity: item.receivedQuantity }
            });
        }
        const updatedPo = await this.prisma.purchaseOrder.update({
            where: { id: poId },
            data: { status: client_1.POStatus.DELIVERED },
            include: { items: true }
        });
        this.eventEmitter.emit('purchase_order.grn_completed', { po: updatedPo, staffId });
        return updatedPo;
    }
};
exports.GrnService = GrnService;
exports.GrnService = GrnService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], GrnService);
//# sourceMappingURL=grn.service.js.map