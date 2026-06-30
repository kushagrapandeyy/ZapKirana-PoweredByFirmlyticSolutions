import { PosService } from './pos.service';
import { PaymentMethod } from '@prisma/client';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    createDraftBill(body: {
        storeId: string;
        staffId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        status: import(".prisma/client").$Enums.BillStatus;
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
        productId: string;
        quantity: number;
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
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        status: import(".prisma/client").$Enums.BillStatus;
        subtotal: number;
        gst: number;
        total: number;
    }>;
}
