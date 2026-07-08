import { PrismaService } from '../../prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class PurchaseOrderService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    createPO(storeId: string, supplierId: string, expectedDeliveryDate: Date, items: {
        productId: string;
        quantity: number;
        purchasePrice: number;
    }[], notes?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    getPOs(storeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }[]>;
    getPOById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    getPOByShareToken(token: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    generatePOPdfHtml(id: string): Promise<string>;
    acceptPO(id: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeProductId: string;
            purchasePrice: import("@prisma/client/runtime/library").Decimal;
            quantity: import("@prisma/client/runtime/library").Decimal;
            productNameSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            cgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            acceptedQuantity: import("@prisma/client/runtime/library").Decimal;
            receivedQuantity: import("@prisma/client/runtime/library").Decimal;
            poId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    sendPO(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
}
