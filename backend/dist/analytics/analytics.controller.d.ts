import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getRevenue(storeId: string, from: string, to: string): Promise<{
        storeId: string;
        from: string;
        to: string;
        totalRevenue: number;
        totalGst: number;
        days: any[];
    }>;
    getTopProducts(storeId: string, limit?: string, days?: string): Promise<{
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
    getHourlyHeatmap(storeId: string, days?: string): Promise<{
        storeId: string;
        period: string;
        heatmap: any[];
    }>;
    getCategoryMix(storeId: string, days?: string): Promise<{
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
        totalRevenue: number;
        totalCOGS: number;
        totalExpenses: number;
        netProfit: number;
        profitMargin: string;
    }>;
}
