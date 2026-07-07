import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getProducts(storeId: string): Promise<any[]>;
    getClearanceProducts(storeId: string): Promise<any[]>;
    getNewProducts(storeId: string): Promise<any[]>;
    receiveStock(body: {
        storeId: string;
        storeProductId: string;
        quantity: number;
        staffId?: string;
        batchNo?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        rackNo: string | null;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        quantityBase: import("@prisma/client/runtime/library").Decimal;
        reservedQty: import("@prisma/client/runtime/library").Decimal;
        blockedQty: import("@prisma/client/runtime/library").Decimal;
    }>;
    manualAdjustment(body: {
        storeId: string;
        storeProductId: string;
        quantityChange: number;
        reason: string;
        staffId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        rackNo: string | null;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        quantityBase: import("@prisma/client/runtime/library").Decimal;
        reservedQty: import("@prisma/client/runtime/library").Decimal;
        blockedQty: import("@prisma/client/runtime/library").Decimal;
    }>;
    getAvailableStock(storeProductId: string, storeId: string): Promise<{
        available: import("@prisma/client/runtime/library").Decimal;
        onHand: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        blocked: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMovementHistory(storeId: string, storeProductId?: string): Promise<({
        storeProduct: {
            product: {
                name: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            itemType: string | null;
            productId: string;
            legacyCode: string | null;
            displayName: string | null;
            type: string | null;
            isHidden: boolean;
            allowDecimalQty: boolean;
            packagingText: string | null;
            colorType: string | null;
            groupId: string | null;
            manufacturerLegacyRef: string | null;
            createdBy: string | null;
            updatedBy: string | null;
            source: string | null;
        };
        staff: {
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        storeId: string;
        type: import(".prisma/client").$Enums.MovementType;
        createdBy: string | null;
        storeProductId: string;
        reason: string | null;
        sourceType: string | null;
        sourceId: string | null;
        inventoryId: string | null;
        quantityDelta: import("@prisma/client/runtime/library").Decimal;
        previousQty: import("@prisma/client/runtime/library").Decimal | null;
        newQty: import("@prisma/client/runtime/library").Decimal | null;
        inputQuantity: import("@prisma/client/runtime/library").Decimal | null;
        inputUnit: string | null;
        conversionToBase: import("@prisma/client/runtime/library").Decimal | null;
        supplierId: string | null;
        note: string | null;
        staffId: string | null;
    })[]>;
}
