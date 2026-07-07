import { Controller, Post, Body, Get, Param, Query, BadRequestException, Patch } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MovementType } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';

@Controller('inventory')
export class InventoryController {

  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Public()
  @Get('products')
  async getProducts(@Query('storeId') storeId: string) {
    return this.inventoryService.getProducts(storeId);
  }

  @Public()
  @Get('clearance')
  async getClearanceProducts(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.inventoryService.getClearanceProducts(storeId);
  }

  @Public()
  @Get('new')
  async getNewProducts(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.inventoryService.getNewProducts(storeId);
  }

  @Post('receive')
  receiveStock(
    @Body() body: { storeId: string; storeProductId: string; quantity: number; staffId?: string; batchNo?: string }
  ) {
    if (!body.storeId || !body.storeProductId || body.quantity == null) {
      throw new BadRequestException('storeId, storeProductId, and quantity are required');
    }
    return this.inventoryService.receiveStock(
      body.storeId,
      body.storeProductId,
      body.quantity,
      body.staffId,
      body.batchNo,
    );
  }

  @Post('adjust')
  manualAdjustment(
    @Body() body: { storeId: string; storeProductId: string; quantityChange: number; reason: string; staffId: string }
  ) {
    if (!body.storeId || !body.storeProductId || body.quantityChange == null || !body.reason || !body.staffId) {
      throw new BadRequestException('storeId, storeProductId, quantityChange, reason, and staffId are required');
    }
    
    return this.inventoryService.recordMovement({
      storeId: body.storeId,
      storeProductId: body.storeProductId,
      type: MovementType.MANUAL_ADJUSTMENT,
      quantityChange: body.quantityChange,
      reason: body.reason,
      staffId: body.staffId,
    });
  }

  @Public()
  @Get(':storeProductId/available')
  getAvailableStock(
    @Param('storeProductId') storeProductId: string,
    @Query('storeId') storeId: string,
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.inventoryService.getAvailableStock(storeId, storeProductId);
  }

  @Get('ledger')
  getMovementHistory(
    @Query('storeId') storeId: string,
    @Query('storeProductId') storeProductId?: string,
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.inventoryService.getMovementHistory(storeId, storeProductId);
  }


}
