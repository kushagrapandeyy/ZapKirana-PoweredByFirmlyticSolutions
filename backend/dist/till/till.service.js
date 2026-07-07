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
exports.TillService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let TillService = class TillService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveTill(storeId) {
        return this.prisma.till.findFirst({
            where: { storeId, status: 'OPEN' },
            include: { transactions: { orderBy: { createdAt: 'desc' } } },
        });
    }
    async openTill(storeId, openingBalance) {
        const active = await this.getActiveTill(storeId);
        if (active)
            throw new common_1.BadRequestException('A till is already open for this store');
        return this.prisma.till.create({
            data: {
                storeId,
                openingBalance,
                expectedBalance: openingBalance,
                status: 'OPEN',
            },
        });
    }
    async logTransaction(tillId, type, amount, reason) {
        const till = await this.prisma.till.findUnique({ where: { id: tillId } });
        if (!till || till.status !== 'OPEN')
            throw new common_1.BadRequestException('Invalid or closed till');
        let delta = 0;
        if (type === 'CASH_IN' || type === 'SALE')
            delta = amount;
        else if (type === 'CASH_OUT' || type === 'EXPENSE')
            delta = -amount;
        await this.prisma.$transaction([
            this.prisma.tillTransaction.create({
                data: {
                    tillId,
                    type,
                    amount,
                    reason,
                },
            }),
            this.prisma.till.update({
                where: { id: tillId },
                data: {
                    expectedBalance: { increment: delta },
                },
            }),
        ]);
        return this.getActiveTill(till.storeId);
    }
    async closeTill(tillId, actualClosingBalance) {
        const till = await this.prisma.till.findUnique({ where: { id: tillId } });
        if (!till || till.status !== 'OPEN')
            throw new common_1.BadRequestException('Invalid or closed till');
        const discrepancy = actualClosingBalance - till.expectedBalance.toNumber();
        return this.prisma.till.update({
            where: { id: tillId },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                closingBalance: actualClosingBalance,
                discrepancy,
            },
        });
    }
};
exports.TillService = TillService;
exports.TillService = TillService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TillService);
//# sourceMappingURL=till.service.js.map