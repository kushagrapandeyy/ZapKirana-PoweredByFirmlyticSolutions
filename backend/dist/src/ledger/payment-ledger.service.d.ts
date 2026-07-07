import { PrismaService } from '../prisma.service';
import { PaymentLedgerType } from '@prisma/client';
export declare class PaymentLedgerService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    logPaymentEvent(data: {
        storeId: string;
        type: PaymentLedgerType;
        amount: number;
        currency?: string;
        razorpayPaymentId?: string;
        razorpayOrderId?: string;
        referenceId?: string;
        metadata?: any;
        status?: string;
    }): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.PaymentLedgerType;
        amount: number;
        currency: string;
        razorpayPaymentId: string | null;
        razorpayOrderId: string | null;
        referenceId: string | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        storeId: string;
    }>;
    getStoreBalance(storeId: string): Promise<{
        totalCollected: number;
        totalSettled: number;
        totalRefunds: number;
        totalCommissions: number;
        netStoreReceivable: number;
    }>;
}
