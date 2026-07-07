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
        gstRate: import("@prisma/client/runtime/library").Decimal;
        category: string;
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
        gstRate: import("@prisma/client/runtime/library").Decimal;
        category: string;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    deleteRule(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gstRate: import("@prisma/client/runtime/library").Decimal;
        category: string;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    classifyProduct(productId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        hsnSacCode: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        source: string | null;
        storeProductId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
        localTaxabilityStatus: string | null;
        centralTaxabilityStatus: string | null;
        isTaxable: boolean;
        gstRate: import("@prisma/client/runtime/library").Decimal | null;
        cgstRate: import("@prisma/client/runtime/library").Decimal | null;
        sgstRate: import("@prisma/client/runtime/library").Decimal | null;
        igstRate: import("@prisma/client/runtime/library").Decimal | null;
        cessRate: import("@prisma/client/runtime/library").Decimal | null;
        cessAmountPerUnit: import("@prisma/client/runtime/library").Decimal | null;
        taxInclusive: boolean;
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
