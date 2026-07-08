import { PosService } from './pos.service';
import { PaymentMethod } from '@prisma/client';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    createDraftBill(req: any, body: {
        storeId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        status: import(".prisma/client").$Enums.BillStatus;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        gst: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        roundOff: import("@prisma/client/runtime/library").Decimal;
    }>;
    addItemToBill(billId: string, body: {
        productId: string;
        quantity: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        storeProductId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        productNameSnapshot: string | null;
        barcodeSnapshot: string | null;
        hsnSacCodeSnapshot: string | null;
        unitSnapshot: string | null;
        batchSnapshot: string | null;
        expirySnapshot: Date | null;
        mrpSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        sellingPriceSnapshot: import("@prisma/client/runtime/library").Decimal;
        discountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        discountAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        taxableValueSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        sgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        sgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        igstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        igstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cessRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cessAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        totalLineAmount: import("@prisma/client/runtime/library").Decimal;
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
        subtotal: import("@prisma/client/runtime/library").Decimal;
        gst: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        roundOff: import("@prisma/client/runtime/library").Decimal;
    }>;
    getBill(billId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        status: import(".prisma/client").$Enums.BillStatus;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        gst: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        roundOff: import("@prisma/client/runtime/library").Decimal;
    }>;
    addItemByBarcode(billId: string, body: {
        barcode: string;
        storeId: string;
        quantity?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        storeProductId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        productNameSnapshot: string | null;
        barcodeSnapshot: string | null;
        hsnSacCodeSnapshot: string | null;
        unitSnapshot: string | null;
        batchSnapshot: string | null;
        expirySnapshot: Date | null;
        mrpSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        sellingPriceSnapshot: import("@prisma/client/runtime/library").Decimal;
        discountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        discountAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        taxableValueSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        sgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        sgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        igstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        igstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cessRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        cessAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
        totalLineAmount: import("@prisma/client/runtime/library").Decimal;
        billId: string;
    }>;
}
