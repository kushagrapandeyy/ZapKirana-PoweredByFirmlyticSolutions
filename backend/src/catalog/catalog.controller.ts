import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { HumanApprovalRequired } from '../common/decorators/human-approval.decorator';

@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * GET /api/v1/catalog/resolve-barcode/:barcode?storeId=x
   * Unified barcode resolver — the single source of truth for any barcode lookup.
   * Used by scanner app, vendor app, POS.
   */
  @Get('resolve-barcode/:barcode')
  resolveBarcode(
    @Param('barcode') barcode: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.catalogService.resolveBarcode(barcode, storeId);
  }

  /**
   * POST /api/v1/catalog/pending-products
   * Scanner submits an unknown barcode for vendor review.
   */
  @Post('pending-products')
  createPendingProduct(
    @Body() body: {
      storeId: string;
      barcode?: string;
      suggestedName?: string;
      suggestedBrand?: string;
      suggestedCategory?: string;
      mrp?: number;
      sellingPrice?: number;
      purchasePrice?: number;
      gstRate?: number;
      imageUrl?: string;
      createdById?: string;
      notes?: string;
    },
  ) {
    return this.catalogService.createPendingProduct(body);
  }

  /**
   * GET /api/v1/catalog/pending-products?storeId=x&status=PENDING_REVIEW
   * List pending products for vendor dashboard.
   */
  @Get('pending-products')
  listPendingProducts(
    @Query('storeId') storeId: string,
    @Query('status') status?: string,
  ) {
    return this.catalogService.listPendingProducts(storeId, status);
  }

  /**
   * POST /api/v1/catalog/pending-products/:id/approve
   * Vendor/manager approves a pending product — creates live Product + registers barcode.
   */
  @HumanApprovalRequired('Adding a new product to the central catalog requires vendor/manager validation of GST, HSN, and pricing.')
  @Post('pending-products/:id/approve')
  approvePendingProduct(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      brand?: string;
      category?: string;
      mrp?: number;
      sellingPrice?: number;
      purchasePrice?: number;
      gstRate?: number;
      internalSku?: string;
    },
  ) {
    return this.catalogService.approvePendingProduct(id, body);
  }

  /**
   * POST /api/v1/catalog/pending-products/:id/reject
   * Vendor/manager rejects a pending product.
   */
  @Post('pending-products/:id/reject')
  rejectPendingProduct(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.catalogService.rejectPendingProduct(id, body.reason);
  }

  /**
   * GET /api/v1/catalog/personalized
   * Get personalized recommendations for a user.
   */
  @Get('personalized')
  getPersonalizedRecommendations(
    @Query('storeId') storeId: string,
    @Query('userId') userId?: string,
  ) {
    return this.catalogService.getPersonalizedRecommendations(storeId, userId);
  }
}
