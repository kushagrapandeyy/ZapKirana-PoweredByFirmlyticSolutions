import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /analytics/revenue?storeId=x&from=2024-01-01&to=2024-01-31
   * Daily revenue breakdown (POS + online orders merged).
   */
  @Get('revenue')
  getRevenue(
    @Query('storeId') storeId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!storeId || !from || !to) throw new BadRequestException('storeId, from, and to are required');
    return this.analyticsService.getRevenue(storeId, from, to);
  }

  /**
   * GET /analytics/top-products?storeId=x&limit=10&days=30
   * Best selling products by units sold.
   */
  @Get('top-products')
  getTopProducts(
    @Query('storeId') storeId: string,
    @Query('limit') limit = '10',
    @Query('days') days = '30',
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.analyticsService.getTopProducts(storeId, parseInt(limit), parseInt(days));
  }

  /**
   * GET /analytics/inventory-health?storeId=x
   * Low stock + dead stock (no movement 30d) + expiring in 7 days.
   */
  @Get('inventory-health')
  getInventoryHealth(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.analyticsService.getInventoryHealth(storeId);
  }

  /**
   * GET /analytics/supplier-scorecard?storeId=x
   * Per-supplier fill rate, on-time %, total spend.
   */
  @Get('supplier-scorecard')
  getSupplierScorecard(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.analyticsService.getSupplierScorecard(storeId);
  }

  /**
   * GET /analytics/hourly-heatmap?storeId=x&days=30
   * Peak sale hours by day of week (for staffing decisions).
   */
  @Get('hourly-heatmap')
  getHourlyHeatmap(
    @Query('storeId') storeId: string,
    @Query('days') days = '30',
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.analyticsService.getHourlyHeatmap(storeId, parseInt(days));
  }

  /**
   * GET /analytics/category-mix?storeId=x&days=30
   * Revenue % breakdown by product category + GST class.
   */
  @Get('category-mix')
  getCategoryMix(
    @Query('storeId') storeId: string,
    @Query('days') days = '30',
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.analyticsService.getCategoryMix(storeId, parseInt(days));
  }

  /**
   * GET /analytics/network-summary?from=2024-01-01&to=2024-01-31
   * OWNER-level: cross-store revenue rollup. Used for multi-outlet chains.
   * This is the SaaS upsell endpoint.
   */
  @Get('network-summary')
  getNetworkSummary(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) throw new BadRequestException('from and to are required');
    return this.analyticsService.getNetworkSummary(from, to);
  }

  /**
   * GET /analytics/profit?storeId=x
   * True Profit P&L breakdown.
   */
  @Get('profit')
  getProfitAnalytics(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.analyticsService.getProfitAnalytics(storeId);
  }
}
