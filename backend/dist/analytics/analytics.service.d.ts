import { PrismaService } from '../prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getRevenue(storeId: string, from: string, to: string): Promise<{
        storeId: string;
        from: string;
        to: string;
        totalRevenue: number;
        totalGst: number;
        days: any[];
    }>;
    getTopProducts(storeId: string, limit: number, periodDays: number): Promise<{
        storeId: string;
        period: string;
        products: any[];
    }>;
    getInventoryHealth(storeId: string): Promise<{
        storeId: string;
        summary: {
            lowStockCount: number;
            deadStockCount: number;
            expiringSoonCount: number;
        };
        lowStock: any[];
        deadStock: any[];
        expiringSoon: any[];
    }>;
    getSupplierScorecard(storeId: string): Promise<{
        storeId: string;
        suppliers: any[];
    }>;
    getHourlyHeatmap(storeId: string, periodDays: number): Promise<{
        storeId: string;
        period: string;
        heatmap: any[];
    }>;
    getCategoryMix(storeId: string, periodDays: number): Promise<{
        storeId: string;
        period: string;
        totalRevenue: number;
        categories: any[];
    }>;
    getNetworkSummary(from: string, to: string): Promise<{
        from: string;
        to: string;
        networkRevenue: number;
        storeCount: number;
        stores: any[];
    }>;
    getProfitAnalytics(storeId: string): Promise<{
        storeId: string;
        totalRevenue: any;
        totalCOGS: number | import("@prisma/client/runtime/library").Decimal;
        totalExpenses: number;
        netProfit: number;
        profitMargin: string;
    }>;
}
