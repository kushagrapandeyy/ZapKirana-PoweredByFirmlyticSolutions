import { PosService } from './pos.service';
import { PaymentMethod } from '@prisma/client';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    createDraftBill(req: any, body: {
        storeId: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BillStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        subtotal: number;
        gst: number;
        total: number;
    }>;
    addItemToBill(billId: string, body: {
        productId: string;
        quantity: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        quantity: number;
        productId: string;
        priceAtSale: number;
        gstAtSale: number;
        billId: string;
    }>;
    checkoutBill(billId: string, body: {
        paymentMethod: PaymentMethod;
        amount: number;
        referenceId?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BillStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        subtotal: number;
        gst: number;
        total: number;
    }>;
    getBill(billId: string): Promise<{
        payments: {
            id: string;
            createdAt: Date;
            billId: string;
            amount: number;
            method: import(".prisma/client").$Enums.PaymentMethod;
            referenceId: string | null;
        }[];
        staff: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
                barcode: string | null;
                category: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            productId: string;
            priceAtSale: number;
            gstAtSale: number;
            billId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.BillStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        subtotal: number;
        gst: number;
        total: number;
    }>;
    addItemByBarcode(billId: string, body: {
        barcode: string;
        storeId: string;
        quantity?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        quantity: number;
        productId: string;
        priceAtSale: number;
        gstAtSale: number;
        billId: string;
    }>;
}
