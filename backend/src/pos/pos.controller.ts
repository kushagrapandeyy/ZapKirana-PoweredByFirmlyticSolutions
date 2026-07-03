import { Controller, Post, Get, Body, Param, BadRequestException, Req } from '@nestjs/common';
import { PosService } from './pos.service';
import { PaymentMethod } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('pos')
@Roles('ORG_ADMIN', 'STORE_MANAGER', 'CASHIER')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('bill')
  createDraftBill(@Req() req: any, @Body() body: { storeId: string }) {
    if (!body.storeId) {
      throw new BadRequestException('storeId is required');
    }
    const staffId = req.user.id;
    return this.posService.createDraftBill(body.storeId, staffId);
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

  /**
   * GET /pos/bill/:id
   * View the current state of a POS bill (items, totals, status).
   */
  @Get('bill/:id')
  getBill(@Param('id') billId: string) {
    return this.posService.getBill(billId);
  }

  /**
   * POST /pos/bill/:id/items-by-barcode
   * Scanner-friendly: add an item to a bill by scanning its barcode.
   * The product is resolved from the store catalog using the barcode.
   */
  @Post('bill/:id/items-by-barcode')
  addItemByBarcode(
    @Param('id') billId: string,
    @Body() body: { barcode: string; storeId: string; quantity?: number },
  ) {
    if (!body.barcode || !body.storeId) {
      throw new BadRequestException('barcode and storeId are required');
    }
    return this.posService.addItemByBarcode(billId, body.storeId, body.barcode, body.quantity ?? 1);
  }
}
