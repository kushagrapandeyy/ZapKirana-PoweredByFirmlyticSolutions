import { PrismaService } from '../../prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class GrnService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    receiveGoods(poId: string, receivedItems: {
        poItemId: string;
        receivedQuantity: number;
    }[], staffId: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            productNameSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            cgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            poId: string;
            acceptedQuantity: import("@prisma/client/runtime/library").Decimal;
            receivedQuantity: import("@prisma/client/runtime/library").Decimal;
            purchasePrice: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
}
