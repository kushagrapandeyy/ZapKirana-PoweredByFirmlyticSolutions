import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '../cache/cache.service';
export declare class InventoryService {
    private prisma;
    private eventEmitter;
    private cache;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, cache: CacheService);
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
    getProducts(storeId?: string): Promise<({
        campaign: {
            id: string;
            isActive: boolean;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            title: string;
            discountPercentage: number;
            animationType: string;
            startsAt: Date;
            endsAt: Date | null;
        } | null;
    } & {
        id: string;
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
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
        campaignId: string | null;
    })[]>;
    getClearanceProducts(storeId: string): Promise<any[]>;
    getNewProducts(storeId: string): Promise<({
        campaign: {
            id: string;
            isActive: boolean;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            title: string;
            discountPercentage: number;
            animationType: string;
            startsAt: Date;
            endsAt: Date | null;
        } | null;
    } & {
        id: string;
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
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
        campaignId: string | null;
    })[]>;
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
        createdAt: Date;
        storeId: string;
        type: import(".prisma/client").$Enums.MovementType;
        productId: string;
        inventoryId: string;
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
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
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
        name: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
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
        campaignId: string | null;
    }>;
    rejectPendingProduct(id: string): Promise<{
        id: string;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
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
