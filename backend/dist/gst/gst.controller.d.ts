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
        gstRate: import("@prisma/client/runtime/library").Decimal;
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
        gstRate: import("@prisma/client/runtime/library").Decimal;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    deleteRule(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        gstRate: import("@prisma/client/runtime/library").Decimal;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    classifyProduct(productId: string): Promise<{
        id: string;
        name: string;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        normalizedName: string | null;
        baseUnit: string | null;
        brandId: string | null;
        manufacturerId: string | null;
        categoryId: string | null;
        hsnSacCode: string | null;
        itemType: string | null;
        productType: string | null;
        packagingDescription: string | null;
        allowDecimalQuantity: boolean;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
