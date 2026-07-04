import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class InventoryService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    recordMovement(data: {
        storeId: string;
        productId: string;
        type: MovementType;
        quantityChange: number;
        batchNo?: string;
        expiryDate?: Date;
        sourceType?: string;
        sourceId?: string;
        reason?: string;
        staffId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        batchNo: string | null;
        expiryDate: Date | null;
        onHandQty: number;
        reservedQty: number;
        blockedQty: number;
        lowStockThreshold: number;
    }>;
    receiveStock(storeId: string, productId: string, qty: number, staffId?: string, batchNo?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        batchNo: string | null;
        expiryDate: Date | null;
        onHandQty: number;
        reservedQty: number;
        blockedQty: number;
        lowStockThreshold: number;
    }>;
    reserveStockForOnlineOrder(storeId: string, productId: string, qty: number, orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        batchNo: string | null;
        expiryDate: Date | null;
        onHandQty: number;
        reservedQty: number;
        blockedQty: number;
        lowStockThreshold: number;
    }>;
    processPosSale(storeId: string, productId: string, qty: number, billId: string, staffId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        productId: string;
        batchNo: string | null;
        expiryDate: Date | null;
        onHandQty: number;
        reservedQty: number;
        blockedQty: number;
        lowStockThreshold: number;
    }>;
    getAvailableStock(storeId: string, productId: string): Promise<{
        available: number;
        onHand: number;
        reserved: number;
        blocked: number;
    }>;
    getProducts(storeId?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
        subscriptionDiscount: number;
    }[]>;
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
        createdAt: Date;
        storeId: string;
        productId: string;
        staffId: string | null;
        inventoryId: string;
        type: import(".prisma/client").$Enums.MovementType;
        quantityChange: number;
        sourceType: string | null;
        sourceId: string | null;
        reason: string | null;
    })[]>;
    handleGrnCompleted(event: {
        po: any;
        staffId: string;
    }): Promise<void>;
    getPendingProducts(storeId: string): Promise<({
        createdBy: {
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        storeId: string;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    })[]>;
    approvePendingProduct(id: string, data: {
        name: string;
        category?: string;
        mrp: number;
        sellingPrice: number;
        gstClass?: any;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
        subscriptionDiscount: number;
    }>;
    rejectPendingProduct(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        storeId: string;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    }>;
}
