import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
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
    }>;
    getAvailableStock(storeId: string, productId: string): Promise<{
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
        createdAt: Date;
        storeId: string;
        productId: string;
        inventoryId: string;
        type: import(".prisma/client").$Enums.MovementType;
        quantityChange: number;
        sourceType: string | null;
        sourceId: string | null;
        reason: string | null;
        staffId: string | null;
    })[]>;
}
