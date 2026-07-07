import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  createProduct(@Body() body: any) {
    return this.productsService.createStoreProduct({
      ...body,
      createdBy: body.createdBy || 'API_USER',
    });
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
  updatePrice(@Param('id') id: string, @Body() body: { mrp?: number; sellingPrice?: number; updatedBy?: string }) {
    return this.productsService.updatePricing(id, body.updatedBy || 'API_USER', body);
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
    return this.productsService.createPendingFromBarcode({
      storeId: body.storeId,
      barcode: body.barcode,
      createdById: body.createdBy || 'API_USER',
      suggestedName: body.name,
      mrp: body.mrp,
      sellingPrice: body.sellingPrice,
      supplierId: body.supplierId,
    });
  }
}
