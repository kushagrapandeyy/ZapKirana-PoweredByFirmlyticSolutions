import {
  Controller, Post, Patch, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('scanner')
@UseGuards(JwtAuthGuard)
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

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
