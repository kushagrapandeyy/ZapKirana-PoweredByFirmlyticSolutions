import { Controller, Post, Get, Param, Body, Patch, Res, Header, Delete } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { GrnService } from '../grn/grn.service';
import { Response } from 'express';

@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(
    private poService: PurchaseOrderService,
    private grnService: GrnService
  ) {}

  @Post()
  async createPO(@Body() body: { storeId: string, supplierId: string, expectedDeliveryDate: string, items: any[], notes?: string }) {
    return this.poService.createPO(body.storeId, body.supplierId, new Date(body.expectedDeliveryDate), body.items, body.notes);
  }

  @Get('store/:storeId')
  async getStorePOs(@Param('storeId') storeId: string) {
    return this.poService.getPOs(storeId);
  }

  @Get(':id')
  async getPO(@Param('id') id: string) {
    return this.poService.getPOById(id);
  }

  // Get PO via share token (no auth needed — for suppliers)
  @Get('share/:token')
  async getPOByShareToken(@Param('token') token: string) {
    return this.poService.getPOByShareToken(token);
  }

  // Generate PO as HTML (ready for PDF rendering)
  @Get(':id/pdf')
  @Header('Content-Type', 'text/html')
  async getPOPdf(@Param('id') id: string) {
    return this.poService.generatePOPdfHtml(id);
  }

  @Patch(':id/accept')
  async acceptPO(@Param('id') id: string) {
    return this.poService.acceptPO(id);
  }

  @Patch(':id/items')
  async updatePOItems(@Param('id') id: string, @Body() body: { items: { productId: string, quantity: number, purchasePrice: number }[] }) {
    return this.poService.updatePOItems(id, body.items);
  }

  @Delete(':id')
  async deletePO(@Param('id') id: string) {
    return this.poService.deletePO(id);
  }

  @Patch(':id/send')
  async sendPO(@Param('id') id: string) {
    return this.poService.sendPO(id);
  }

  @Post(':id/grn')
  async completeGRN(@Param('id') id: string, @Body() body: { staffId: string, receivedItems: { poItemId: string, receivedQuantity: number }[] }) {
    return this.grnService.receiveGoods(id, body.receivedItems, body.staffId);
  }
}
