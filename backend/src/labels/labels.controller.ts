import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  /**
   * POST /api/v1/labels/barcodes/generate
   * Generate an internal barcode for a product and register it.
   */
  @Post('barcodes/generate')
  generateBarcode(
    @Body() body: {
      storeId: string;
      storeProductId: string;
      barcodeType: 'INTERNAL_FIXED_PACK' | 'INTERNAL_VARIABLE_WEIGHT';
      storeCode?: string;
      productCode?: string;
      productNumericCode?: number;
      packGrams?: number;
      weightGrams?: number;
    },
  ) {
    return this.labelsService.generateBarcode(body);
  }

  /**
   * POST /api/v1/labels/barcodes/register-external
   * Register a manufacturer EAN-13/GS1 barcode in the registry.
   */
  @Post('barcodes/register-external')
  registerExternal(
    @Body() body: {
      storeProductId: string;
      barcodeValue: string;
      symbology?: string;
      storeId?: string;
      isPrimary?: boolean;
    },
  ) {
    return this.labelsService.registerExternalBarcode(body);
  }

  /**
   * GET /api/v1/labels/barcodes?productId=x
   * List all barcodes for a product.
   */
  @Get('barcodes')
  getBarcodes(@Query('storeProductId') storeProductId: string) {
    return this.labelsService.getBarcodesForProduct(storeProductId);
  }

  /**
   * POST /api/v1/labels/print-jobs
   * Create a print job for one or more labels.
   */
  @Post('print-jobs')
  createPrintJob(
    @Body() body: {
      storeId: string;
      requestedById?: string;
      templateType: string;
      items: Array<{
        variantId: string;
        barcode: string;
        quantity: number;
        metadata?: Record<string, unknown>;
      }>;
    },
  ) {
    return this.labelsService.createPrintJob(body);
  }

  /**
   * GET /api/v1/labels/print-jobs/:id
   * Get a print job by ID.
   */
  @Get('print-jobs/:id')
  getPrintJob(@Param('id') id: string) {
    return this.labelsService.getPrintJob(id);
  }

  /**
   * GET /api/v1/labels/print-jobs?storeId=x
   * List all print jobs for a store.
   */
  @Get('print-jobs')
  listPrintJobs(@Query('storeId') storeId: string) {
    return this.labelsService.listPrintJobs(storeId);
  }
}
