import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '../cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class InventoryService {
    private prisma;
    private eventEmitter;
    private cache;
    private realtimeService;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, cache: CacheService, realtimeService: RealtimeService);
    recordMovement(data: {
        storeId: string;
        storeProductId: string;
        type: MovementType;
        quantityChange: number;
        batchNo?: string;
        expiryDate?: Date;
        sourceType?: string;
        sourceId?: string;
        reason?: string;
        staffId?: string;
        note?: string;
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
        quantityBase: Decimal;
        reservedQty: Decimal;
        blockedQty: Decimal;
    }>;
    receiveStock(storeId: string, storeProductId: string, qty: number, staffId?: string, batchNo?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        rackNo: string | null;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        quantityBase: Decimal;
        reservedQty: Decimal;
        blockedQty: Decimal;
    }>;
    reserveStockForOnlineOrder(storeId: string, storeProductId: string, qty: number, orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        rackNo: string | null;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        quantityBase: Decimal;
        reservedQty: Decimal;
        blockedQty: Decimal;
    }>;
    processPosSale(storeId: string, storeProductId: string, qty: number, billId: string, staffId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        rackNo: string | null;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        quantityBase: Decimal;
        reservedQty: Decimal;
        blockedQty: Decimal;
    }>;
    getAvailableStock(storeId: string, storeProductId: string): Promise<{
        available: Decimal;
        onHand: Decimal;
        reserved: Decimal;
        blocked: Decimal;
    }>;
    getStockBalance(storeId: string, storeProductId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        storeProductId: string;
        rackNo: string | null;
        batchNo: string | null;
        mfgDate: Date | null;
        expiryDate: Date | null;
        quantityBase: Decimal;
        reservedQty: Decimal;
        blockedQty: Decimal;
    } | null>;
    getProducts(storeId: string): Promise<any[]>;
    getClearanceProducts(storeId: string): Promise<any[]>;
    getNewProducts(storeId: string): Promise<any[]>;
    getPopularProducts(storeId: string): Promise<any[]>;
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
        quantityDelta: Decimal;
        previousQty: Decimal | null;
        newQty: Decimal | null;
        inputQuantity: Decimal | null;
        inputUnit: string | null;
        conversionToBase: Decimal | null;
        supplierId: string | null;
        note: string | null;
        staffId: string | null;
    })[]>;
    handleGrnCompleted(event: {
        po: any;
        staffId: string;
    }): Promise<void>;
    getLowStockProducts(storeId: string): Promise<{
        storeProductId: string;
        name: string;
        currentQty: number;
        reorderQty: number;
        minimumQty: number;
    }[]>;
}
