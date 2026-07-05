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
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let DeliveryService = class DeliveryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateLastLocation(orderId, lat, lng) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException(`Order ${orderId} not found`);
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                deliveryLat: lat,
                deliveryLng: lng,
            },
        });
    }
    async getLastLocation(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                deliveryLat: true,
                deliveryLng: true,
                deliveryAddress: true,
                staffId: true,
                staff: { select: { name: true, phone: true, avatarUrl: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException(`Order ${orderId} not found`);
        return {
            orderId: order.id,
            status: order.status,
            staffLat: order.deliveryLat,
            staffLng: order.deliveryLng,
            deliveryAddress: order.deliveryAddress,
            staff: order.staff,
        };
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map