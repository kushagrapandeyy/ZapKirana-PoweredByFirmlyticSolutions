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
        billId: string;
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
    }>;
    checkoutBill(billId: string, body: {
        paymentMethod: PaymentMethod;
        amount: number;
        referenceId?: string;
        customerId?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.BillStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        gst: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        discount: import("@prisma/client/runtime/library").Decimal;
        roundOff: import("@prisma/client/runtime/library").Decimal;
    }>;
    getBill(billId: string): Promise<{
        payments: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            billId: string;
            method: import(".prisma/client").$Enums.PaymentMethod;
            referenceId: string | null;
        }[];
        staff: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
        items: ({
            storeProduct: {
                product: {
                    id: string;
                    name: string;
                };
                productBarcodes: {
                    id: string;
                    createdAt: Date;
                    isActive: boolean;
                    source: string | null;
                    storeProductId: string;
                    barcode: string;
                    barcodeType: string | null;
                    isPrimary: boolean;
                }[];
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
        } & {
            id: string;
            createdAt: Date;
            storeProductId: string;
            billId: string;
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
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.BillStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
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
        billId: string;
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
    }>;
    getCustomerByPhone(phone: string): Promise<{
        id: string;
        name: string | null;
        phone: string | null;
        zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
}
