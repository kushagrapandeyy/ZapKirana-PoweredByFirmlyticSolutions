import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getProducts(storeId: string): Promise<any[]>;
    getClearanceProducts(storeId: string): Promise<any[]>;
    getNewProducts(storeId: string): Promise<any[]>;
    receiveStock(body: {
        storeId: string;
        productId: string;
        quantity: number;
        staffId?: string;
        batchNo?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        rackNo: string | null;
        quantityBase: import("@prisma/client/runtime/library").Decimal;
        reservedQty: import("@prisma/client/runtime/library").Decimal;
        blockedQty: import("@prisma/client/runtime/library").Decimal;
    }>;
    manualAdjustment(body: {
        storeId: string;
        productId: string;
        quantityChange: number;
        reason: string;
        staffId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        rackNo: string | null;
        quantityBase: import("@prisma/client/runtime/library").Decimal;
        reservedQty: import("@prisma/client/runtime/library").Decimal;
        blockedQty: import("@prisma/client/runtime/library").Decimal;
    }>;
    getAvailableStock(productId: string, storeId: string): Promise<{
        available: number;
        onHand: number;
        reserved: number;
        blocked: number;
    } | {
        available: number;
        onHand: any;
        reserved: import("@prisma/client/runtime/library").Decimal;
        blocked: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMovementHistory(storeId: string, productId?: string): Promise<{
        id: string;
        createdAt: Date;
        storeId: string;
        storeProductId: string;
        inventoryId: string | null;
        type: import(".prisma/client").$Enums.MovementType;
        quantityDelta: import("@prisma/client/runtime/library").Decimal;
        previousQty: import("@prisma/client/runtime/library").Decimal | null;
        newQty: import("@prisma/client/runtime/library").Decimal | null;
        inputQuantity: import("@prisma/client/runtime/library").Decimal | null;
        inputUnit: string | null;
        conversionToBase: import("@prisma/client/runtime/library").Decimal | null;
        supplierId: string | null;
        sourceType: string | null;
        sourceId: string | null;
        note: string | null;
        reason: string | null;
        createdBy: string | null;
        staffId: string | null;
    }[]>;
    getPendingProducts(storeId: string): Promise<({
        createdBy: {
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string | null;
        baseUnit: string | null;
        conversionToBase: import("@prisma/client/runtime/library").Decimal | null;
        supplierId: string | null;
        barcode: string | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        mrp: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        gstRate: import("@prisma/client/runtime/library").Decimal;
        hsnSac: string | null;
        purchaseUnit: string | null;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    })[]>;
    approvePendingProduct(id: string, body: {
        name: string;
        category?: string;
        mrp: number;
        sellingPrice: number;
        gstClass?: any;
    }): Promise<{
        id: string;
        name: string;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string | null;
        baseUnit: string | null;
        brandId: string | null;
        manufacturerId: string | null;
        categoryId: string | null;
        hsnSacCode: string | null;
        itemType: string | null;
        productType: string | null;
        packagingDescription: string | null;
        allowDecimalQuantity: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    rejectPendingProduct(id: string): Promise<{
        id: string;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string | null;
        baseUnit: string | null;
        conversionToBase: import("@prisma/client/runtime/library").Decimal | null;
        supplierId: string | null;
        barcode: string | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        mrp: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        purchasePrice: import("@prisma/client/runtime/library").Decimal | null;
        gstRate: import("@prisma/client/runtime/library").Decimal;
        hsnSac: string | null;
        purchaseUnit: string | null;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    }>;
}
