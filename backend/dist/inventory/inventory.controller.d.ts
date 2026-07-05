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
        storeId: string;
        productId: string;
        batchNo: string | null;
        expiryDate: Date | null;
        onHandQty: number;
        reservedQty: number;
        blockedQty: number;
        lowStockThreshold: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    manualAdjustment(body: {
        storeId: string;
        productId: string;
        quantityChange: number;
        reason: string;
        staffId: string;
    }): Promise<{
        id: string;
        storeId: string;
        productId: string;
        batchNo: string | null;
        expiryDate: Date | null;
        onHandQty: number;
        reservedQty: number;
        blockedQty: number;
        lowStockThreshold: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAvailableStock(productId: string, storeId: string): Promise<{
        available: number;
        onHand: number;
        reserved: number;
        blocked: number;
    }>;
    getMovementHistory(storeId: string, productId?: string): Promise<({
        product: {
            name: string;
        };
        staff: {
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        storeId: string;
        productId: string;
        createdAt: Date;
        inventoryId: string;
        type: import(".prisma/client").$Enums.MovementType;
        quantityChange: number;
        sourceType: string | null;
        sourceId: string | null;
        reason: string | null;
        staffId: string | null;
    })[]>;
    getPendingProducts(storeId: string): Promise<({
        createdBy: {
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        imageUrl: string | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
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
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        barcode: string | null;
        internalSku: string;
        description: string | null;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
        subscriptionDiscount: number;
        imageUrl: string | null;
        isActive: boolean;
        campaignId: string | null;
    }>;
    rejectPendingProduct(id: string): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        imageUrl: string | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    }>;
}
