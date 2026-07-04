import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  createProduct(@Body() body: any) {
    // In production, use DTOs for validation
    return this.productsService.createProduct(body);
  }

  @Get()
  findAll(@Query('storeId') storeId: string) {
    if (!storeId) {
      return { error: 'storeId query parameter is required' };
    }
    return this.productsService.findAll(storeId);
  }

  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode') barcode: string, @Query('storeId') storeId: string) {
    if (!storeId) {
      return { error: 'storeId query parameter is required' };
    }
    return this.productsService.findByBarcode(storeId, barcode);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id/price')
  updatePrice(@Param('id') id: string, @Body() body: { mrp: number; sellingPrice: number }) {
    return this.productsService.updatePrice(id, body.mrp, body.sellingPrice);
  }

  @Patch(':id/subscription-discount')
  updateSubscriptionDiscount(@Param('id') id: string, @Body() body: { discount: number }) {
    return this.productsService.updateSubscriptionDiscount(id, body.discount);
  }

  /**
   * GET /products/enrich/:barcode?storeId=x
   * 3-tier lookup: local DB → Open Food Facts → unknown.
   * Use this BEFORE creating a product to auto-fill name/category/image/GST.
   */
  @Get('enrich/:barcode')
  enrichBarcode(@Param('barcode') barcode: string, @Query('storeId') storeId: string) {
    if (!storeId) return { error: 'storeId is required' };
    return this.productsService.enrichFromBarcode(barcode, storeId);
  }

  /**
   * POST /products/from-barcode
   * Scan barcode → enrich from OFF → auto-create product in one request.
   * Body: { storeId, barcode, mrp, sellingPrice, internalSku, purchaseCost? }
   */
  @Post('from-barcode')
  createFromBarcode(@Body() body: any) {
    return this.productsService.createFromBarcode(body);
  }
}
