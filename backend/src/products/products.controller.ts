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
}
