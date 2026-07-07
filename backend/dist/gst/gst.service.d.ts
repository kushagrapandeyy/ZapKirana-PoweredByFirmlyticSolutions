import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class GstService {
    private prisma;
    constructor(prisma: PrismaService);
    seedDefaultRules(): Promise<{
        seeded: number;
        rules: any[];
    }>;
    getRules(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gstRate: Decimal;
        category: string;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }[]>;
    upsertRule(category: string, gstClass: any, gstRate: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gstRate: Decimal;
        category: string;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    deleteRule(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gstRate: Decimal;
        category: string;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }>;
    classifyProduct(storeProductId: string): Promise<{
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
        gstRate: Decimal | null;
        cgstRate: Decimal | null;
        sgstRate: Decimal | null;
        igstRate: Decimal | null;
        cessRate: Decimal | null;
        cessAmountPerUnit: Decimal | null;
        taxInclusive: boolean;
    }>;
    bulkClassify(storeId: string): Promise<{
        total: number;
        classified: number;
    }>;
    calculateGSTBreakdown(items: {
        priceAtOrder: number;
        quantity: number;
        gstRate: number;
    }[]): {
        breakdown: Record<string, {
            rate: number;
            taxable: number;
            tax: number;
            items: number;
        }>;
        totalGST: number;
    };
    getGSTReport(storeId: string, startDate?: Date, endDate?: Date): Promise<{
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
