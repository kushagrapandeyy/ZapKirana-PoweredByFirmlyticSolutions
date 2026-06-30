import { Controller, Post, Body, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MovementType } from '@prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('receive')
  receiveStock(
    @Body() body: { storeId: string; productId: string; quantity: number; staffId?: string; batchNo?: string }
  ) {
    if (!body.storeId || !body.productId || body.quantity == null) {
      throw new BadRequestException('storeId, productId, and quantity are required');
    }
    return this.inventoryService.receiveStock(
      body.storeId,
      body.productId,
      body.quantity,
      body.staffId,
      body.batchNo,
    );
  }

  @Post('adjust')
  manualAdjustment(
    @Body() body: { storeId: string; productId: string; quantityChange: number; reason: string; staffId: string }
  ) {
    if (!body.storeId || !body.productId || body.quantityChange == null || !body.reason || !body.staffId) {
      throw new BadRequestException('storeId, productId, quantityChange, reason, and staffId are required');
    }
    
    return this.inventoryService.recordMovement({
      storeId: body.storeId,
      productId: body.productId,
      type: MovementType.MANUAL_ADJUSTMENT,
      quantityChange: body.quantityChange,
      reason: body.reason,
      staffId: body.staffId,
    });
  }

  @Get(':productId/available')
  getAvailableStock(
    @Param('productId') productId: string,
    @Query('storeId') storeId: string,
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.inventoryService.getAvailableStock(storeId, productId);
  }

  @Get('ledger')
  getMovementHistory(
    @Query('storeId') storeId: string,
    @Query('productId') productId?: string,
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.inventoryService.getMovementHistory(storeId, productId);
  }
}
