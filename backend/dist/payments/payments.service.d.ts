import { PrismaService } from '../prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class PaymentsService {
    private prisma;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    createPosQr(storeId: string, billId: string, amountPaise: number): Promise<{
        paymentId: string;
        provider: string;
        qrCodeId: any;
        qrImageUrl: any;
        amount: number;
        currency: string;
        status: string;
        expiresAt: string;
    }>;
    createOrderPayment(storeId: string, orderId: string, amountPaise: number): Promise<{
        paymentId: string;
        razorpayOrderId: any;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    recordCashPayment(storeId: string, billId: string, amountReceived: number, changeReturned: number): Promise<{
        paymentId: string;
        method: string;
        amountReceived: number;
        changeReturned: number;
        status: string;
    }>;
    getPaymentStatus(paymentId: string): Promise<{
        events: {
            id: string;
            provider: string;
            paymentId: string;
            eventType: string;
            payloadJson: import("@prisma/client/runtime/library").JsonValue;
            signatureValid: boolean;
            processedAt: Date | null;
            receivedAt: Date;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        storeId: string;
        source: import(".prisma/client").$Enums.PaymentSource;
        currency: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        billId: string | null;
        method: string | null;
        orderId: string | null;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerOrderId: string | null;
        providerPaymentId: string | null;
        providerQrId: string | null;
        paidAt: Date | null;
    }>;
    handleWebhook(rawBody: string, signature: string): Promise<{
        received: boolean;
        processed: boolean;
        reason: string;
    } | {
        received: boolean;
        processed: boolean;
        reason?: undefined;
    }>;
}
