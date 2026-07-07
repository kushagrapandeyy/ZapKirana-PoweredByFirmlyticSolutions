import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TillService } from './till.service';

@Controller('till')
export class TillController {
  constructor(private readonly tillService: TillService) {}

  @Get('active/:storeId')
  getActiveTill(@Param('storeId') storeId: string) {
    return this.tillService.getActiveTill(storeId);
  }

  @Post('open')
  openTill(@Body() body: { storeId: string; openingBalance: number }) {
    return this.tillService.openTill(body.storeId, body.openingBalance);
  }

  @Post(':tillId/transaction')
  logTransaction(
    @Param('tillId') tillId: string,
    @Body() body: { type: 'CASH_IN' | 'CASH_OUT' | 'EXPENSE' | 'SALE'; amount: number; reason?: string }
  ) {
    return this.tillService.logTransaction(tillId, body.type, body.amount, body.reason);
  }

  @Post(':tillId/close')
  closeTill(
    @Param('tillId') tillId: string,
    @Body() body: { actualClosingBalance: number }
  ) {
    return this.tillService.closeTill(tillId, body.actualClosingBalance);
  }
}
