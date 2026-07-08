import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { BarcodeScope, Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
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
    private inventoryService;
    private productsService;
    constructor(prisma: PrismaService, cacheService: CacheService, realtimeService: RealtimeService, inventoryService: InventoryService, productsService: ProductsService);
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
    } | {
        success: boolean;
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
    confirmProductExtraction(userId: string, extractionId: string, storeId: string, finalData: any): Promise<{
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
    confirmSupplierExtraction(userId: string, extractionId: string, storeId: string, finalData: any): Promise<{
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
        openingBalance: Decimal | null;
        openingBalanceType: string | null;
        contactPerson: string | null;
        foodLicenseNo: string | null;
        importBatchId: string | null;
    }>;
    generateInternalBarcode(storeId: string): Promise<string>;
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
    archiveProduct(userId: string, productId: string, storeId: string): Promise<{
        success: boolean;
        status: string;
    }>;
}
