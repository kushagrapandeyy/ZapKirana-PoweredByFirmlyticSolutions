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
exports.PaymentLedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let PaymentLedgerService = class PaymentLedgerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logPaymentEvent(data) {
        if (data.amount <= 0) {
            throw new common_1.BadRequestException('Amount must be positive');
        }
        return this.prisma.paymentLedgerEntry.create({
            data: {
                storeId: data.storeId,
                type: data.type,
                amount: data.amount,
                currency: data.currency || 'INR',
                razorpayPaymentId: data.razorpayPaymentId,
                razorpayOrderId: data.razorpayOrderId,
                referenceId: data.referenceId,
                metadata: data.metadata || {},
                status: data.status || 'COMPLETED',
            },
        });
    }
    async getStoreBalance(storeId) {
        const entries = await this.prisma.paymentLedgerEntry.findMany({
            where: { storeId, status: 'COMPLETED' },
        });
        let totalCollected = 0;
        let totalSettled = 0;
        let totalRefunds = 0;
        let totalCommissions = 0;
        entries.forEach((entry) => {
            switch (entry.type) {
                case 'RAZORPAY_CAPTURE':
                case 'CASH_COLLECTION':
                    totalCollected += entry.amount;
                    break;
                case 'RAZORPAY_SETTLEMENT':
                case 'STORE_PAYOUT':
                    totalSettled += entry.amount;
                    break;
                case 'RAZORPAY_REFUND':
                    totalRefunds += entry.amount;
                    break;
                case 'COMMISSION_DEDUCTION':
                    totalCommissions += entry.amount;
                    break;
            }
        });
        return {
            totalCollected,
            totalSettled,
            totalRefunds,
            totalCommissions,
            netStoreReceivable: totalCollected - totalRefunds - totalCommissions - totalSettled,
        };
    }
};
exports.PaymentLedgerService = PaymentLedgerService;
exports.PaymentLedgerService = PaymentLedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentLedgerService);
//# sourceMappingURL=payment-ledger.service.js.map