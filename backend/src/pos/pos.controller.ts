import { Controller, Post, Body, Param, BadRequestException } from '@nestjs/common';
import { PosService } from './pos.service';
import { PaymentMethod } from '@prisma/client';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('bill')
  createDraftBill(@Body() body: { storeId: string; staffId: string }) {
    if (!body.storeId || !body.staffId) {
      throw new BadRequestException('storeId and staffId are required');
    }
    return this.posService.createDraftBill(body.storeId, body.staffId);
  }

  @Post('bill/:id/items')
  addItemToBill(
    @Param('id') billId: string,
    @Body() body: { productId: string; quantity: number }
  ) {
    if (!body.productId || body.quantity == null || body.quantity <= 0) {
      throw new BadRequestException('Valid productId and quantity are required');
    }
    return this.posService.addItemToBill(billId, body.productId, body.quantity);
  }

  @Post('bill/:id/checkout')
  checkoutBill(
    @Param('id') billId: string,
    @Body() body: { paymentMethod: PaymentMethod; amount: number; referenceId?: string }
  ) {
    if (!body.paymentMethod || body.amount == null) {
      throw new BadRequestException('paymentMethod and amount are required');
    }
    return this.posService.checkoutBill(billId, body.paymentMethod, body.amount, body.referenceId);
  }
}
