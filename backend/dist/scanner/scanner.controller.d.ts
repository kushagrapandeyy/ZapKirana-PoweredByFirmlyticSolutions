import { ScannerService } from './scanner.service';
import { OcrService } from './ocr.service';
export declare class ScannerController {
    private readonly scannerService;
    private readonly ocrService;
    constructor(scannerService: ScannerService, ocrService: OcrService);
    extractProductMaster(body: {
        storeId: string;
        rawText: string;
    }): Promise<{
        fields: {
            id: string;
            fieldKey: string;
            extractedValue: string | null;
            confidence: number | null;
            isEdited: boolean;
            finalValue: string | null;
            extractionId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        status: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        rawText: string | null;
        confidenceScore: number | null;
    }>;
    extractSupplierLedger(body: {
        storeId: string;
        rawText: string;
    }): Promise<{
        fields: {
            id: string;
            fieldKey: string;
            extractedValue: string | null;
            confidence: number | null;
            isEdited: boolean;
            finalValue: string | null;
            extractionId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        status: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        rawText: string | null;
        confidenceScore: number | null;
    }>;
    confirmProductDraft(req: any, body: {
        extractionId: string;
        storeId: string;
        finalData: any;
    }): Promise<{
        id: string;
        storeId: string;
        productId: string;
        legacyCode: string | null;
        displayName: string | null;
        status: string;
        type: string | null;
        itemType: string | null;
        isHidden: boolean;
        allowDecimalQty: boolean;
        packagingText: string | null;
        colorType: string | null;
        groupId: string | null;
        manufacturerLegacyRef: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        source: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    confirmSupplierDraft(req: any, body: {
        extractionId: string;
        storeId: string;
        finalData: any;
    }): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        name: string;
        country: string | null;
        gstin: string | null;
        email: string | null;
        phone: string | null;
        ledgerName: string | null;
        accountGroup: string | null;
        pan: string | null;
        mobile: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        openingBalance: import("@prisma/client/runtime/library").Decimal | null;
        openingBalanceType: string | null;
        contactPerson: string | null;
        foodLicenseNo: string | null;
        importBatchId: string | null;
    }>;
    lookupBarcode(body: {
        storeId: string;
        barcode: string;
        scanMode: string;
    }): Promise<any>;
    generateInternalBarcode(storeId: string): Promise<string>;
    updateProduct(productId: string, req: any, body: {
        storeId: string;
        mrp?: number;
        saleRateBaseUnit?: number;
        purchaseRateBaseUnit?: number;
        rackNo?: string;
        hsnSac?: string;
        sgstPercent?: number;
        cgstPercent?: number;
        igstPercent?: number;
        brand?: string;
        category?: string;
        name?: string;
    }): Promise<{
        draftId: string;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        message: string;
        success?: undefined;
    } | {
        success: boolean;
        draftId?: undefined;
        status?: undefined;
        message?: undefined;
    }>;
    archiveProduct(productId: string, req: any, body: {
        storeId: string;
    }): Promise<{
        success: boolean;
        status: string;
    }>;
    updateStock(req: any, body: {
        storeId: string;
        productId: string;
        movementType: string;
        quantityInput: number;
        inputUnit: string;
        conversionToBase: number;
        supplierId?: string;
        batchNo?: string;
        expiryDate?: string;
        note?: string;
    }): Promise<{
        success: boolean;
        quantityBase: number;
        newStockLevel: number;
    }>;
    createProductDraft(req: any, body: {
        storeId: string;
        barcode: string;
        productName: string;
        brand?: string;
        category?: string;
        hsnSac?: string;
        mrp: number;
        gstRate: number;
        baseUnit: string;
        purchaseUnit?: string;
        conversionToBase?: number;
        supplierId?: string;
    }): Promise<{
        draftId: string;
        status: import(".prisma/client").$Enums.PendingProductStatus;
    }>;
}
