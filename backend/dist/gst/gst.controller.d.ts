import { GstService } from './gst.service';
import { GSTClass } from '@prisma/client';
export declare class GstController {
    private readonly gstService;
    constructor(gstService: GstService);
    seedRules(): Promise<{
        seeded: number;
        rules: any[];
    }>;
    getRules(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }[]>;
    upsertRule(body: {
        category: string;
        gstClass: GSTClass;
        gstRate: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    deleteRule(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    classifyProduct(productId: string): Promise<{
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
    }>;
    bulkClassify(storeId: string): Promise<{
        total: number;
        classified: number;
    }>;
    getReport(storeId: string, startDate?: string, endDate?: string): Promise<{
        storeId: string;
        period: {
            startDate: Date | undefined;
            endDate: Date | undefined;
        };
        totalOrders: number;
        slabSummary: Record<string, {
            rate: number;
            orderCount: number;
            taxableValue: number;
            cgst: number;
            sgst: number;
            totalTax: number;
        }>;
    }>;
}
