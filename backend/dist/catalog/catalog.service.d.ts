import { PrismaService } from '../prisma.service';
export declare class CatalogService {
    private prisma;
    constructor(prisma: PrismaService);
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
    private formatProduct;
    createPendingProduct(data: {
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
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        imageUrl: string | null;
        updatedAt: Date;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    } | {
        alreadyPending: boolean;
        id: string;
        storeId: string;
        createdAt: Date;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        imageUrl: string | null;
        updatedAt: Date;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
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
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        imageUrl: string | null;
        updatedAt: Date;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    })[]>;
    approvePendingProduct(id: string, overrides: {
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
    rejectPendingProduct(id: string, reason?: string): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        barcode: string | null;
        mrp: number | null;
        sellingPrice: number | null;
        gstRate: number;
        imageUrl: string | null;
        updatedAt: Date;
        suggestedName: string | null;
        suggestedBrand: string | null;
        suggestedCategory: string | null;
        purchasePrice: number | null;
        status: import(".prisma/client").$Enums.PendingProductStatus;
        createdById: string | null;
        approvedProductId: string | null;
        notes: string | null;
    }>;
    getPersonalizedRecommendations(storeId: string, userId?: string): Promise<{
        id: string;
        storeId: string;
        isActive: boolean;
        createdAt: Date;
        name: string;
        barcode: string | null;
        internalSku: string;
        description: string | null;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
        subscriptionDiscount: number;
        imageUrl: string | null;
        updatedAt: Date;
        campaignId: string | null;
    }[]>;
}
