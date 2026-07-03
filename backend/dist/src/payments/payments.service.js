"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const crypto = __importStar(require("crypto"));
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';
async function razorpayRequest(method, path, body) {
    const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
        method,
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new common_1.BadRequestException(`Razorpay API error: ${err?.error?.description ?? res.statusText}`);
    }
    return res.json();
}
function verifyRazorpayWebhookSignature(rawBody, signature, secret) {
    if (!secret)
        return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    eventEmitter;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async createPosQr(storeId, billId, amountPaise) {
        const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
        if (!bill)
            throw new common_1.NotFoundException('POS bill not found');
        if (bill.status !== 'DRAFT')
            throw new common_1.BadRequestException('Bill is not in DRAFT state');
        const qr = await razorpayRequest('POST', '/payments/qr_codes', {
            type: 'upi_qr',
            name: `Basko Store Payment`,
            usage: 'single_use',
            fixed_amount: true,
            payment_amount: amountPaise,
            description: `POS Bill ${billId.substring(0, 8).toUpperCase()}`,
            close_by: Math.floor(Date.now() / 1000) + 300,
        });
        const payment = await this.prisma.payment.create({
            data: {
                storeId,
                source: 'POS_BILL',
                billId,
                provider: 'RAZORPAY',
                providerQrId: qr.id,
                amount: amountPaise / 100,
                currency: 'INR',
                status: 'PENDING',
            },
        });
        return {
            paymentId: payment.id,
            provider: 'RAZORPAY',
            qrCodeId: qr.id,
            qrImageUrl: qr.image_url,
            amount: amountPaise / 100,
            currency: 'INR',
            status: 'PENDING',
            expiresAt: new Date((qr.close_by ?? Math.floor(Date.now() / 1000) + 300) * 1000).toISOString(),
        };
    }
    async createOrderPayment(storeId, orderId, amountPaise) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const rzpOrder = await razorpayRequest('POST', '/orders', {
            amount: amountPaise,
            currency: 'INR',
            receipt: orderId.substring(0, 40),
            notes: { orderId, storeId },
        });
        const payment = await this.prisma.payment.create({
            data: {
                storeId,
                source: 'ONLINE_ORDER',
                orderId,
                provider: 'RAZORPAY',
                providerOrderId: rzpOrder.id,
                amount: amountPaise / 100,
                currency: 'INR',
                status: 'PENDING',
            },
        });
        return {
            paymentId: payment.id,
            razorpayOrderId: rzpOrder.id,
            amount: amountPaise,
            currency: 'INR',
            keyId: RAZORPAY_KEY_ID,
        };
    }
    async recordCashPayment(storeId, billId, amountReceived, changeReturned) {
        const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
        if (!bill)
            throw new common_1.NotFoundException('POS bill not found');
        if (bill.status !== 'DRAFT')
            throw new common_1.BadRequestException('Bill is not in DRAFT state');
        const payment = await this.prisma.payment.create({
            data: {
                storeId,
                source: 'POS_BILL',
                billId,
                provider: 'CASH',
                amount: amountReceived,
                currency: 'INR',
                method: 'cash',
                status: 'SUCCESS',
                paidAt: new Date(),
            },
        });
        await this.prisma.posBill.update({
            where: { id: billId },
            data: { status: 'PAID' },
        });
        this.eventEmitter.emit('pos.bill.paid', { billId, storeId, method: 'cash', paymentId: payment.id });
        return {
            paymentId: payment.id,
            method: 'cash',
            amountReceived,
            changeReturned,
            status: 'SUCCESS',
        };
    }
    async getPaymentStatus(paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { events: { orderBy: { receivedAt: 'desc' }, take: 5 } },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async handleWebhook(rawBody, signature) {
        const signatureValid = verifyRazorpayWebhookSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
        let payload;
        try {
            payload = JSON.parse(rawBody);
        }
        catch {
            throw new common_1.BadRequestException('Invalid webhook payload');
        }
        const event = payload.event;
        this.logger.log(`Razorpay webhook received: ${event}`);
        const paymentData = payload.payload?.payment?.entity;
        const qrData = payload.payload?.qr_code?.entity;
        let internalPayment = null;
        if (paymentData?.order_id) {
            internalPayment = await this.prisma.payment.findFirst({
                where: { providerOrderId: paymentData.order_id },
            });
        }
        if (!internalPayment && qrData?.id) {
            internalPayment = await this.prisma.payment.findFirst({
                where: { providerQrId: qrData.id },
            });
        }
        if (internalPayment) {
            await this.prisma.paymentEvent.create({
                data: {
                    paymentId: internalPayment.id,
                    provider: 'RAZORPAY',
                    eventType: event,
                    payloadJson: payload,
                    signatureValid,
                    processedAt: null,
                },
            });
        }
        if (!signatureValid) {
            this.logger.warn(`Invalid webhook signature for event: ${event}`);
            return { received: true, processed: false, reason: 'invalid_signature' };
        }
        if (event === 'payment.captured' && internalPayment) {
            await this.prisma.payment.update({
                where: { id: internalPayment.id },
                data: {
                    status: 'SUCCESS',
                    providerPaymentId: paymentData?.id,
                    method: paymentData?.method,
                    paidAt: new Date(),
                },
            });
            if (internalPayment.source === 'POS_BILL' && internalPayment.billId) {
                await this.prisma.posBill.update({
                    where: { id: internalPayment.billId },
                    data: { status: 'PAID' },
                });
                this.eventEmitter.emit('pos.bill.paid', {
                    billId: internalPayment.billId,
                    storeId: internalPayment.storeId,
                    method: paymentData?.method,
                    paymentId: internalPayment.id,
                });
            }
            if (internalPayment.source === 'ONLINE_ORDER' && internalPayment.orderId) {
                this.eventEmitter.emit('order.payment.captured', {
                    orderId: internalPayment.orderId,
                    storeId: internalPayment.storeId,
                    paymentId: internalPayment.id,
                });
            }
            if (internalPayment) {
                await this.prisma.paymentEvent.updateMany({
                    where: { paymentId: internalPayment.id, eventType: event, processedAt: null },
                    data: { processedAt: new Date() },
                });
            }
        }
        if (event === 'payment.failed' && internalPayment) {
            await this.prisma.payment.update({
                where: { id: internalPayment.id },
                data: { status: 'FAILED', providerPaymentId: paymentData?.id },
            });
            this.eventEmitter.emit('payment.failed', {
                paymentId: internalPayment.id,
                source: internalPayment.source,
                billId: internalPayment.billId,
                orderId: internalPayment.orderId,
            });
        }
        if (event === 'refund.processed' && internalPayment) {
            await this.prisma.payment.update({
                where: { id: internalPayment.id },
                data: { status: 'REFUNDED' },
            });
        }
        return { received: true, processed: true };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map