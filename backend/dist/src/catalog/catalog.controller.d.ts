import { CatalogService } from './catalog.service';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    resolveBarcode(barcode: string, storeId?: string): Promise<{
        status: string;
        source: string;
        barcodeScope: string;
        product: {
            productId: any;
            name: any;
            category: any;
            barcode: any;
            mrp: any;
            sellingPrice: any;
            gstRate: any;
            gstClass: any;
            imageUrl: any;
            internalSku: any;
        };
        nextAction?: undefined;
    } | {
        status: string;
        source: string;
        barcodeScope: string;
        product: {
            barcode: string;
            name: any;
            brand: any;
            category: string;
            imageUrl: any;
            mrp: number;
            sellingPrice: number;
            gstClass: string;
            gstRate: number;
        };
        nextAction: string;
    } | {
        status: string;
        source: null;
        barcodeScope: string;
        product: null;
        nextAction: string;
    }>;
    createPendingProduct(body: {
        storeId: string;
        barcode?: string;
        suggestedName?: string;
        suggestedBrand?: string;
        suggestedCategory?: string;
        mrp?: number;
        sellingPrice?: number;
        purchasePrice?: number;
        gstRate?: number;
        imageUrl?: string;
        createdById?: string;
        notes?: string;
    }): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        notes: string | null;
        purchasePrice: number | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        createdById: string | null;
        approvedProductId: string | null;
    } | {
        alreadyPending: boolean;
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        notes: string | null;
        purchasePrice: number | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        createdById: string | null;
        approvedProductId: string | null;
    }>;
    listPendingProducts(storeId: string, status?: string): Promise<({
        createdBy: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        notes: string | null;
        purchasePrice: number | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        createdById: string | null;
        approvedProductId: string | null;
    })[]>;
    approvePendingProduct(id: string, body: {
        name?: string;
        brand?: string;
        category?: string;
        mrp?: number;
        sellingPrice?: number;
        purchasePrice?: number;
        gstRate?: number;
        internalSku?: string;
    }): Promise<{
        status: string;
        productId: string;
        internalSku: string;
        barcodeRegistered: boolean;
    }>;
    rejectPendingProduct(id: string, body: {
        reason?: string;
    }): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        notes: string | null;
        purchasePrice: number | null;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        createdById: string | null;
        approvedProductId: string | null;
    }>;
}
