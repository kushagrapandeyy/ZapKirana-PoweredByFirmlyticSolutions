import { PurchaseOrderService } from './purchase-order.service';
import { GrnService } from '../grn/grn.service';
export declare class PurchaseOrderController {
    private poService;
    private grnService;
    constructor(poService: PurchaseOrderService, grnService: GrnService);
    createPO(body: {
        storeId: string;
        supplierId: string;
        expectedDeliveryDate: string;
        items: any[];
        notes?: string;
    }): Promise<{
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
    getStorePOs(storeId: string): Promise<{
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
    getPO(id: string): Promise<{
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
    getPOPdf(id: string): Promise<string>;
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
    completeGRN(id: string, body: {
        staffId: string;
        receivedItems: {
            poItemId: string;
            receivedQuantity: number;
        }[];
    }): Promise<{
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
}
