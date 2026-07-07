import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { ErpImportService } from './erp-import.service';

@Controller('erp-import')
export class ErpImportController {
  constructor(private readonly erpImportService: ErpImportService) {}

  @Post(':storeId/product-master/dry-run')
  async dryRunProductImport(
    @Param('storeId') storeId: string,
    @Body() body: { rows: any[]; uploadedBy: string },
  ) {
    return this.erpImportService.dryRunProductImport(storeId, body.rows, body.uploadedBy);
  }

  @Post(':storeId/product-master/confirm')
  async confirmProductImport(
    @Param('storeId') storeId: string,
    @Body() body: { batchId: string; confirmedBy: string },
  ) {
    return this.erpImportService.confirmProductImport(storeId, body.batchId, body.confirmedBy);
  }

  @Post(':storeId/ledger-master/dry-run')
  async dryRunSupplierImport(
    @Param('storeId') storeId: string,
    @Body() body: { rows: any[]; uploadedBy: string },
  ) {
    return this.erpImportService.dryRunSupplierImport(storeId, body.rows, body.uploadedBy);
  }
}
