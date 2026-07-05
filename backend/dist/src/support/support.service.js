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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let SupportService = class SupportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTicket(data) {
        return this.prisma.supportTicket.create({
            data,
        });
    }
    async getTickets(query) {
        return this.prisma.supportTicket.findMany({
            where: query,
            include: {
                customer: true,
                store: true,
                assignedTo: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getTicket(id) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
            include: {
                messages: {
                    include: { sender: true },
                    orderBy: { createdAt: 'asc' },
                },
                customer: true,
                store: true,
            },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return ticket;
    }
    async updateTicketStatus(id, status) {
        return this.prisma.supportTicket.update({
            where: { id },
            data: { status },
        });
    }
    async interveneOrder(orderId, status, reason, adminId) {
        await this.prisma.auditLog.create({
            data: {
                action: 'ORDER_INTERVENTION',
                entityType: 'Order',
                entityId: orderId,
                userId: adminId,
                details: `Force status to ${status}. Reason: ${reason}`,
            }
        });
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map