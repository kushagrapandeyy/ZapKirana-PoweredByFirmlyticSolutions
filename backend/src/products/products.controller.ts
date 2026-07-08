import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { ProductsService, ProductMasterPayload } from './products.service';

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

  /**
   * GET /products/:id/master
   * Returns the full ProductMasterView: all sub-tables in one response.
   * Powers the ERP Mode Product Edit screen.
   */
  @Get(':id/master')
  findOneMaster(@Param('id') id: string) {
    return this.productsService.findOneMaster(id);
  }

  /**
   * PATCH /products/:id/master
   * Full fan-out update across all sub-tables.
   * Automatically appends price / cost history on any pricing change.
   * Body: ProductMasterPayload (only send the sections you want to update).
   */
  @Patch(':id/master')
  updateMaster(
    @Param('id') id: string,
    @Body() body: ProductMasterPayload & { updatedBy?: string },
  ) {
    const { updatedBy, ...payload } = body;
    return this.productsService.updateMaster(id, payload, updatedBy ?? 'API_USER');
  }

  /**
   * POST /products/validate
   * Validates a ProductMasterPayload WITHOUT saving.
   * Returns { valid, errors, gstPreview } for the UI to display live.
   */
  @Post('validate')
  validateMaster(@Body() body: ProductMasterPayload) {
    return this.productsService.validateMaster(body);
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
