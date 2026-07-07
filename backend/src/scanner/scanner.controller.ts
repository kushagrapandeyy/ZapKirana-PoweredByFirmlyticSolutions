import {
  Controller, Post, Patch, Body, Param, Req, UseGuards, Get, Query
} from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { OcrService } from './ocr.service';

@Controller('scanner')
@UseGuards(JwtAuthGuard)
export class ScannerController {
  constructor(
    private readonly scannerService: ScannerService,
    private readonly ocrService: OcrService,
  ) {}

  /**
   * POST /scanner/extract/product-master
   * AI Extraction for Product Master OCR
   */
  @Post('extract/product-master')
  async extractProductMaster(
    @Body() body: { storeId: string; rawText: string }
  ) {
    return this.ocrService.extractProductMaster(body.rawText, body.storeId);
  }

  /**
   * POST /scanner/extract/supplier-ledger
   * AI Extraction for Supplier Ledger OCR
   */
  @Post('extract/supplier-ledger')
  async extractSupplierLedger(
    @Body() body: { storeId: string; rawText: string }
  ) {
    return this.ocrService.extractSupplierLedger(body.rawText, body.storeId);
  }

  /**
   * POST /scanner/confirm/product
   * Confirm drafted extraction and create product
   */
  @Post('confirm/product')
  async confirmProductDraft(
    @Req() req: any,
    @Body() body: { extractionId: string; storeId: string; finalData: any }
  ) {
    const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
    return this.scannerService.confirmProductExtraction(userId, body.extractionId, body.storeId, body.finalData);
  }

  /**
   * POST /scanner/confirm/supplier
   * Confirm drafted extraction and create supplier ledger
   */
  @Post('confirm/supplier')
  async confirmSupplierDraft(
    @Req() req: any,
    @Body() body: { extractionId: string; storeId: string; finalData: any }
  ) {
    const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
    return this.scannerService.confirmSupplierExtraction(userId, body.extractionId, body.storeId, body.finalData);
  }

  /**
   * POST /scanner/barcode/lookup
   * Lookup barcode by store and code
   */
  @Post('barcode/lookup')
  lookupBarcode(
    @Body() body: {
      storeId: string;
      barcode: string;
      scanMode: string;
    },
  ) {
    return this.scannerService.lookupBarcode(body.storeId, body.barcode, body.scanMode);
  }

  /**
   * GET /scanner/barcode/generate-internal
   * Generate an internal GS1 EAN-13 barcode starting with '02'
   */
  @Get('barcode/generate-internal')
  generateInternalBarcode(
    @Query('storeId') storeId: string,
  ) {
    return this.scannerService.generateInternalBarcode(storeId);
  }

  /**
   * PATCH /scanner/products/:productId
   * Update product or create approval request
   */
  @Patch('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Req() req: any,
    @Body() body: {
      storeId: string;
      mrp?: number;
      saleRateBaseUnit?: number;
      purchaseRateBaseUnit?: number;
      rackNo?: string;
      hsnSac?: string;
      sgstPercent?: number;
      cgstPercent?: number;
      igstPercent?: number;
      brand?: string;
      category?: string;
      name?: string;
    },
  ) {
    // req.user is injected by JwtAuthGuard
    const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
    return this.scannerService.updateProduct(userId, productId, body);
  }

  /**
   * POST /scanner/products/:productId/archive
   * Archive a product via scanner
   */
  @Post('products/:productId/archive')
  archiveProduct(
    @Param('productId') productId: string,
    @Req() req: any,
    @Body() body: { storeId: string },
  ) {
    const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
    return this.scannerService.archiveProduct(userId, productId, body.storeId);
  }

  /**
   * POST /scanner/stock/update
   * Register stock adjustments (unit intake, box intake, etc.)
   */
  @Post('stock/update')
  updateStock(
    @Req() req: any,
    @Body() body: {
      storeId: string;
      productId: string;
      movementType: string;
      quantityInput: number;
      inputUnit: string;
      conversionToBase: number;
      supplierId?: string;
      batchNo?: string;
      expiryDate?: string;
      note?: string;
    },
  ) {
    const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
    return this.scannerService.updateStock(userId, body);
  }

  /**
   * POST /scanner/product-drafts
   * Create new pending product draft
   */
  @Post('product-drafts')
  createProductDraft(
    @Req() req: any,
    @Body() body: {
      storeId: string;
      barcode: string;
      productName: string;
      brand?: string;
      category?: string;
      hsnSac?: string;
      mrp: number;
      gstRate: number;
      baseUnit: string;
      purchaseUnit?: string;
      conversionToBase?: number;
      supplierId?: string;
    },
  ) {
    const userId = req.user?.id || 'de283b71-1972-47b7-996f-6633d0f7b7f5';
    return this.scannerService.createProductDraft(userId, body);
  }
}
