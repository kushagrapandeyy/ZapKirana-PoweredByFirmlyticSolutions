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
        subtotal: number;
        gst: number;
        total: number;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
    }>;
    addItemToBill(billId: string, body: {
        productId: string;
        quantity: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        quantity: number;
        priceAtSale: number;
        gstAtSale: number;
        billId: string;
        productId: string;
    }>;
    checkoutBill(billId: string, body: {
        paymentMethod: PaymentMethod;
        amount: number;
        referenceId?: string;
        customerId?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BillStatus;
        subtotal: number;
        gst: number;
        total: number;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
    }>;
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
            createdAt: Date;
            quantity: number;
            priceAtSale: number;
            gstAtSale: number;
            billId: string;
            productId: string;
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
        status: import(".prisma/client").$Enums.BillStatus;
        subtotal: number;
        gst: number;
        total: number;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
    }>;
    addItemByBarcode(billId: string, body: {
        barcode: string;
        storeId: string;
        quantity?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        quantity: number;
        priceAtSale: number;
        gstAtSale: number;
        billId: string;
        productId: string;
    }>;
    getCustomerByPhone(phone: string): Promise<{
        id: string;
        name: string | null;
        phone: string | null;
        zapCreditBalance: number;
    }>;
}
