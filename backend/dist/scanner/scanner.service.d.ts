import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
import { BarcodeScope, Role } from '@prisma/client';
export interface ClassifiedBarcode {
    scope: BarcodeScope;
    rawValue: string;
    symbology: string;
    gtin?: string;
    productCode?: string;
    weightGrams?: number;
    packSizeGrams?: number;
    referenceType?: 'PO' | 'ORDER' | 'BIN' | 'SUPPLIER_CRATE';
    referenceId?: string;
}
export declare function classifyBarcode(rawValue: string): ClassifiedBarcode;
export declare class ScannerService {
    private prisma;
    private cacheService;
    private realtimeService;
    constructor(prisma: PrismaService, cacheService: CacheService, realtimeService: RealtimeService);
    checkPermission(userId: string, storeId: string): Promise<Role>;
    lookupBarcode(storeId: string, barcode: string, scanMode: string): Promise<any>;
    updateProduct(userId: string, productId: string, data: {
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
        product?: undefined;
    } | {
        success: boolean;
        product: {
            id: string;
            name: string;
            isActive: boolean;
            imageUrl: string | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            rackNo: string | null;
            barcode: string | null;
            internalSku: string;
            brand: string | null;
            category: string | null;
            hsnSac: string | null;
            baseUnit: string | null;
            saleUnit: string | null;
            packing: string | null;
            shelfLifeDays: number | null;
            conversionToBase: number | null;
            mrp: number;
            sellingPrice: number;
            purchaseCost: number | null;
            purchaseRateBaseUnit: number | null;
            purchaseRateInputUnit: number | null;
            saleRateBaseUnit: number | null;
            gstRate: number;
            sgstPercent: number | null;
            cgstPercent: number | null;
            igstPercent: number | null;
            gstClass: import(".prisma/client").$Enums.GSTClass;
            subscriptionDiscount: number;
            barcodeType: string | null;
            unitName: string | null;
            erpStatus: string | null;
            erpType: string | null;
            colorType: string | null;
            itemType: string | null;
            company: string | null;
            group: string | null;
            minimumQty: number | null;
            vDisOn: number | null;
            itemDisc1: number | null;
            specialDisc: number | null;
            maximumDiscountPercent: number | null;
            freeScheme: string | null;
            minimumMarginPercent: number | null;
            rateA: number | null;
            rateB: number | null;
            rateC: number | null;
            costPerPcs: number | null;
            negativeStockAllowed: boolean | null;
            reorderDays: number | null;
            discountApplicable: boolean | null;
            manufacturF3: string | null;
            campaignId: string | null;
        };
        draftId?: undefined;
        status?: undefined;
        message?: undefined;
    }>;
    updateStock(userId: string, data: {
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
    createProductDraft(userId: string, data: {
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
    resolveBarcode(data: any): Promise<{
        status: string;
    }>;
    submitScanEvent(data: any): Promise<{
        status: string;
    }>;
    batchSync(storeId: string, deviceId: string, events: any[]): Promise<{
        processed: number;
        duplicates: number;
        failed: never[];
    }>;
    getWorkflows(): {
        workflows: never[];
    };
    registerDevice(data: any): Promise<{
        success: boolean;
    }>;
    getScannerActivity(storeId: string, limit?: number): Promise<never[]>;
    getDevices(storeId: string): Promise<never[]>;
    deviceHeartbeat(deviceId: string): Promise<{
        success: boolean;
    }>;
}
