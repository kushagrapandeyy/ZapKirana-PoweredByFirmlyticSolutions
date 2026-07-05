import { PrismaService } from '../prisma.service';
import { GSTClass } from '@prisma/client';
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
        category: string;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
    }[]>;
    upsertRule(category: string, gstClass: GSTClass, gstRate: number): Promise<{
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
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        storeId: string;
        barcode: string | null;
        internalSku: string;
        category: string | null;
        mrp: number;
        sellingPrice: number;
        purchaseCost: number | null;
        gstRate: number;
        gstClass: import(".prisma/client").$Enums.GSTClass;
        subscriptionDiscount: number;
        campaignId: string | null;
    }>;
    bulkClassify(storeId: string): Promise<{
        total: number;
        classified: number;
    }>;
    calculateGSTBreakdown(items: {
        priceAtOrder: number;
        quantity: number;
        gstClass: GSTClass;
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
    private getGSTRate;
}
