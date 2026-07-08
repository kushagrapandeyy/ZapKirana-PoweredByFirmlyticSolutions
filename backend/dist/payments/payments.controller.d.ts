import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPosQr(body: {
        storeId: string;
        billId: string;
        amountPaise: number;
    }): Promise<{
        paymentId: string;
        provider: string;
        qrCodeId: any;
        qrImageUrl: any;
        amount: number;
        currency: string;
        status: string;
        expiresAt: string;
    }>;
    createOrderPayment(body: {
        storeId: string;
        orderId: string;
        amountPaise: number;
    }): Promise<{
        paymentId: string;
        razorpayOrderId: any;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    recordCash(body: {
        storeId: string;
        billId: string;
        amountReceived: number;
        changeReturned: number;
    }): Promise<{
        paymentId: string;
        method: string;
        amountReceived: number;
        changeReturned: number;
        status: string;
    }>;
    getStatus(paymentId: string): Promise<{
        events: {
            id: string;
            provider: string;
            receivedAt: Date;
            eventType: string;
            payloadJson: import("@prisma/client/runtime/library").JsonValue;
            signatureValid: boolean;
            processedAt: Date | null;
            paymentId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        billId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        method: string | null;
        orderId: string | null;
        source: import(".prisma/client").$Enums.PaymentSource;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerOrderId: string | null;
        providerPaymentId: string | null;
        providerQrId: string | null;
        currency: string;
        paidAt: Date | null;
    }>;
    handleWebhook(req: any, signature: string): Promise<{
        received: boolean;
        processed: boolean;
        reason: string;
    } | {
        received: boolean;
        processed: boolean;
        reason?: undefined;
    }>;
}
