import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  getAllSuppliers() {
    return this.suppliersService.getAllSuppliers();
  }

  @Get('connections')
  getStoreConnections(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.suppliersService.getStoreConnections(storeId);
  }

  @Post('connect')
  connectStoreToSupplier(@Body() body: { storeId: string; supplierId: string }) {
    if (!body.storeId || !body.supplierId) {
      throw new BadRequestException('storeId and supplierId are required');
    }
    return this.suppliersService.connectStoreToSupplier(body.storeId, body.supplierId);
  }
}
