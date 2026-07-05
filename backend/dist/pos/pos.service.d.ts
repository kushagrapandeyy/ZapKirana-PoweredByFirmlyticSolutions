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
        productId: string;
        createdAt: Date;
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
    getBill(billId: string): Promise<{
        staff: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                barcode: string | null;
                category: string | null;
                imageUrl: string | null;
            };
        } & {
            id: string;
            productId: string;
            createdAt: Date;
            quantity: number;
            priceAtSale: number;
            gstAtSale: number;
            billId: string;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            billId: string;
            amount: number;
            method: import(".prisma/client").$Enums.PaymentMethod;
            referenceId: string | null;
        }[];
    } & {
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
    addItemByBarcode(billId: string, storeId: string, barcode: string, quantity: number): Promise<{
        id: string;
        productId: string;
        createdAt: Date;
        quantity: number;
        priceAtSale: number;
        gstAtSale: number;
        billId: string;
    }>;
}
