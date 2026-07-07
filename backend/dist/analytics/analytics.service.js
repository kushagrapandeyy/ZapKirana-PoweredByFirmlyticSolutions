"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRevenue(storeId, from, to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const [posSales, onlineOrders] = await Promise.all([
            this.prisma.$queryRaw `
        SELECT
          DATE(created_at) AS date,
          SUM(total)::float AS pos_revenue,
          SUM(gst)::float   AS pos_gst,
          COUNT(*)::int     AS pos_transactions
        FROM "PosBill"
        WHERE "storeId" = ${storeId}
          AND status = 'PAID'
          AND created_at BETWEEN ${fromDate} AND ${toDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
            this.prisma.$queryRaw `
        SELECT
          DATE(created_at)  AS date,
          SUM("totalAmount")::float  AS online_revenue,
          SUM("gstAmount")::float    AS online_gst,
          COUNT(*)::int              AS online_orders
        FROM "Order"
        WHERE "storeId" = ${storeId}
          AND status = 'DELIVERED'
          AND created_at BETWEEN ${fromDate} AND ${toDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
        ]);
        const dateMap = {};
        for (const row of posSales) {
            const d = String(row.date).substring(0, 10);
            dateMap[d] = { date: d, pos_revenue: row.pos_revenue ?? 0, pos_transactions: row.pos_transactions ?? 0, pos_gst: row.pos_gst ?? 0, online_revenue: 0, online_orders: 0, online_gst: 0 };
        }
        for (const row of onlineOrders) {
            const d = String(row.date).substring(0, 10);
            if (!dateMap[d])
                dateMap[d] = { date: d, pos_revenue: 0, pos_transactions: 0, pos_gst: 0, online_revenue: 0, online_orders: 0, online_gst: 0 };
            dateMap[d].online_revenue = row.online_revenue ?? 0;
            dateMap[d].online_orders = row.online_orders ?? 0;
            dateMap[d].online_gst = row.online_gst ?? 0;
        }
        const days = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
        const totalRevenue = days.reduce((s, d) => s + (d.pos_revenue || 0) + (d.online_revenue || 0), 0);
        const totalGst = days.reduce((s, d) => s + (d.pos_gst || 0) + (d.online_gst || 0), 0);
        return {
            storeId,
            from,
            to,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalGst: Math.round(totalGst * 100) / 100,
            days,
        };
    }
    async getTopProducts(storeId, limit, periodDays) {
        const since = new Date();
        since.setDate(since.getDate() - periodDays);
        const results = await this.prisma.$queryRaw `
      SELECT
        p.id            AS product_id,
        p.name,
        p.category,
        p."sellingPrice" AS price,
        p."imageUrl",
        SUM(bi.quantity)::int                        AS units_sold,
        SUM(bi.quantity * bi."priceAtSale")::float   AS revenue
      FROM "PosBillItem" bi
      JOIN "PosBill"     b  ON b.id = bi."billId"
      JOIN "Product"     p  ON p.id = bi."productId"
      WHERE b."storeId" = ${storeId}
        AND b.status = 'PAID'
        AND b."createdAt" >= ${since}
      GROUP BY p.id, p.name, p.category, p."sellingPrice", p."imageUrl"
      ORDER BY units_sold DESC
      LIMIT ${limit}
    `;
        return { storeId, period: `${periodDays}d`, products: results };
    }
    async getInventoryHealth(storeId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const [lowStock, deadStock, expiringSoon] = await Promise.all([
            this.prisma.$queryRaw `
        SELECT
          p.id, p.name, p."internalSku" AS sku, p.category,
          i."onHandQty", i."lowStockThreshold", i."expiryDate"
        FROM "Inventory" i
        JOIN "Product" p ON p.id = i."productId"
        WHERE i."storeId" = ${storeId}
          AND i."onHandQty" <= i."lowStockThreshold"
          AND p."isActive" = true
        ORDER BY i."onHandQty" ASC
      `,
            this.prisma.$queryRaw `
        SELECT
          p.id, p.name, p."internalSku" AS sku, p.category,
          i."onHandQty",
          MAX(sm."createdAt") AS last_movement
        FROM "Inventory" i
        JOIN "Product" p ON p.id = i."productId"
        LEFT JOIN "StockMovement" sm ON sm."inventoryId" = i.id
        WHERE i."storeId" = ${storeId}
          AND i."onHandQty" > 0
          AND p."isActive" = true
        GROUP BY p.id, p.name, p."internalSku", p.category, i."onHandQty"
        HAVING MAX(sm."createdAt") < ${thirtyDaysAgo} OR MAX(sm."createdAt") IS NULL
        ORDER BY i."onHandQty" DESC
        LIMIT 20
      `,
            this.prisma.$queryRaw `
        SELECT
          p.id, p.name, p."internalSku" AS sku,
          i."onHandQty", i."expiryDate", i."batchNo"
        FROM "Inventory" i
        JOIN "Product" p ON p.id = i."productId"
        WHERE i."storeId" = ${storeId}
          AND i."expiryDate" IS NOT NULL
          AND i."expiryDate" <= ${sevenDaysFromNow}
          AND i."onHandQty" > 0
        ORDER BY i."expiryDate" ASC
      `,
        ]);
        return {
            storeId,
            summary: {
                lowStockCount: lowStock.length,
                deadStockCount: deadStock.length,
                expiringSoonCount: expiringSoon.length,
            },
            lowStock,
            deadStock,
            expiringSoon,
        };
    }
    async getSupplierScorecard(storeId) {
        const suppliers = await this.prisma.$queryRaw `
      SELECT
        s.id, s.name, s."logoUrl", s."paymentTerms",
        s."onTimeRate", s."fillRate", s.rating,
        COUNT(po.id)::int        AS total_orders,
        SUM(po."totalAmount")::float AS total_spend
      FROM "Supplier" s
      JOIN "StoreSupplierConnection" ssc ON ssc."supplierId" = s.id
      LEFT JOIN "PurchaseOrder" po
        ON po."supplierId" = s.id AND po."storeId" = ${storeId}
      WHERE ssc."storeId" = ${storeId}
        AND ssc.status = 'CONNECTED'
      GROUP BY s.id, s.name, s."logoUrl", s."paymentTerms", s."onTimeRate", s."fillRate", s.rating
      ORDER BY total_spend DESC NULLS LAST
    `;
        return { storeId, suppliers };
    }
    async getHourlyHeatmap(storeId, periodDays) {
        const since = new Date();
        since.setDate(since.getDate() - periodDays);
        const rows = await this.prisma.$queryRaw `
      SELECT
        EXTRACT(DOW  FROM "createdAt")::int  AS day_of_week,
        EXTRACT(HOUR FROM "createdAt")::int  AS hour,
        COUNT(*)::int    AS transactions,
        SUM(total)::float AS revenue
      FROM "PosBill"
      WHERE "storeId" = ${storeId}
        AND status = 'PAID'
        AND "createdAt" >= ${since}
      GROUP BY day_of_week, hour
      ORDER BY day_of_week, hour
    `;
        return { storeId, period: `${periodDays}d`, heatmap: rows };
    }
    async getCategoryMix(storeId, periodDays) {
        const since = new Date();
        since.setDate(since.getDate() - periodDays);
        const rows = await this.prisma.$queryRaw `
      SELECT
        p.category,
        p."gstClass",
        SUM(bi.quantity)::int                        AS units_sold,
        SUM(bi.quantity * bi."priceAtSale")::float   AS revenue,
        COUNT(DISTINCT b.id)::int                    AS bills
      FROM "PosBillItem" bi
      JOIN "PosBill"  b ON b.id = bi."billId"
      JOIN "Product"  p ON p.id = bi."productId"
      WHERE b."storeId" = ${storeId}
        AND b.status = 'PAID'
        AND b."createdAt" >= ${since}
      GROUP BY p.category, p."gstClass"
      ORDER BY revenue DESC
    `;
        const totalRevenue = rows.reduce((s, r) => s + (r.revenue || 0), 0);
        const withPercent = rows.map(r => ({
            ...r,
            revenuePercent: Math.round((r.revenue / totalRevenue) * 1000) / 10,
        }));
        return {
            storeId,
            period: `${periodDays}d`,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            categories: withPercent,
        };
    }
    async getNetworkSummary(from, to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const storeStats = await this.prisma.$queryRaw `
      SELECT
        s.id   AS store_id,
        s.name AS store_name,
        s.location,
        COALESCE(pos.total, 0) + COALESCE(online.total, 0) AS total_revenue,
        COALESCE(pos.transactions, 0)   AS pos_transactions,
        COALESCE(online.orders, 0)      AS online_orders
      FROM "Store" s
      LEFT JOIN (
        SELECT "storeId", SUM(total)::float AS total, COUNT(*)::int AS transactions
        FROM "PosBill"
        WHERE status = 'PAID' AND "createdAt" BETWEEN ${fromDate} AND ${toDate}
        GROUP BY "storeId"
      ) pos ON pos."storeId" = s.id
      LEFT JOIN (
        SELECT "storeId", SUM("totalAmount")::float AS total, COUNT(*)::int AS orders
        FROM "Order"
        WHERE status = 'DELIVERED' AND "createdAt" BETWEEN ${fromDate} AND ${toDate}
        GROUP BY "storeId"
      ) online ON online."storeId" = s.id
      WHERE s."isActive" = true
      ORDER BY total_revenue DESC NULLS LAST
    `;
        const networkRevenue = storeStats.reduce((s, r) => s + (Number(r.total_revenue) || 0), 0);
        return {
            from,
            to,
            networkRevenue: Math.round(networkRevenue * 100) / 100,
            storeCount: storeStats.length,
            stores: storeStats,
        };
    }
    async getProfitAnalytics(storeId) {
        const posSales = await this.prisma.posBill.aggregate({
            where: { storeId, status: 'PAID' },
            _sum: { total: true }
        });
        const onlineSales = await this.prisma.order.aggregate({
            where: { storeId, status: 'DELIVERED' },
            _sum: { totalAmount: true }
        });
        const cogs = await this.prisma.purchaseOrder.aggregate({
            where: { storeId, status: 'DELIVERED' },
            _sum: { totalAmount: true }
        });
        const totalRevenue = (posSales._sum.total?.toNumber() || 0) + (onlineSales._sum.totalAmount?.toNumber() || 0);
        const totalCOGS = cogs._sum?.totalAmount?.toNumber() || 0;
        const totalExpenses = 0;
        const profit = totalRevenue - totalCOGS - totalExpenses;
        return {
            storeId,
            totalRevenue,
            totalCOGS,
            totalExpenses,
            netProfit: profit,
            profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) + '%' : '0.00%'
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map