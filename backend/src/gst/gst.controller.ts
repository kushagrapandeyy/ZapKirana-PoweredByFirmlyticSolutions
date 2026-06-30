import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { GstService } from './gst.service';
import { GSTClass } from '@prisma/client';

@Controller('gst')
export class GstController {
  constructor(private readonly gstService: GstService) {}

  // Seed default GST rules
  @Post('rules/seed')
  seedRules() {
    return this.gstService.seedDefaultRules();
  }

  // Get all GST rules
  @Get('rules')
  getRules() {
    return this.gstService.getRules();
  }

  // Create or update a GST rule
  @Post('rules')
  upsertRule(@Body() body: { category: string; gstClass: GSTClass; gstRate: number }) {
    return this.gstService.upsertRule(body.category, body.gstClass, body.gstRate);
  }

  // Delete a GST rule
  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.gstService.deleteRule(id);
  }

  // Auto-classify a single product
  @Post('classify/:productId')
  classifyProduct(@Param('productId') productId: string) {
    return this.gstService.classifyProduct(productId);
  }

  // Bulk auto-classify all products in a store
  @Post('classify/bulk/:storeId')
  bulkClassify(@Param('storeId') storeId: string) {
    return this.gstService.bulkClassify(storeId);
  }

  // Get GST report for a store
  @Get('report/:storeId')
  getReport(
    @Param('storeId') storeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.gstService.getGSTReport(
      storeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
