import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '../cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
export declare class InventoryService {
    private prisma;
    private eventEmitter;
    private cache;
    private realtimeService;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, cache: CacheService, realtimeService: RealtimeService);
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
    receiveStock(storeId: string, productId: string, qty: number, staffId?: string, batchNo?: string): Promise<{
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
    reserveStockForOnlineOrder(storeId: string, productId: string, qty: number, orderId: string): Promise<{
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
    processPosSale(storeId: string, productId: string, qty: number, billId: string, staffId: string): Promise<{
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
    getAvailableStock(storeId: string, productId: string): Promise<{
        available: number;
        onHand: number;
        reserved: number;
        blocked: number;
    }>;
    getProducts(storeId?: string): Promise<any[]>;
    getClearanceProducts(storeId: string): Promise<any[]>;
    getNewProducts(storeId: string): Promise<any[]>;
    getPopularProducts(storeId: string): Promise<any[]>;
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
    approvePendingProduct(id: string, data: {
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
