import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { PaymentMethod } from '@prisma/client';
export declare class PosService {
    private prisma;
    private inventoryService;
    constructor(prisma: PrismaService, inventoryService: InventoryService);
    createDraftBill(storeId: string, staffId: string): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        staffId: string | null;
        status: import(".prisma/client").$Enums.BillStatus;
        subtotal: number;
        gst: number;
        total: number;
    }>;
    addItemToBill(billId: string, productId: string, quantity: number): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        quantity: number;
        priceAtSale: number;
        gstAtSale: number;
        billId: string;
    }>;
    checkoutBill(billId: string, paymentMethod: PaymentMethod, amount: number, referenceId?: string): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        staffId: string | null;
        status: import(".prisma/client").$Enums.BillStatus;
        subtotal: number;
        gst: number;
        total: number;
    }>;
    private recalculateBillTotals;
}
