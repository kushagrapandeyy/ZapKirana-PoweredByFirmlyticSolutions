import { Controller, Get, Post, Param, Query, BadRequestException, Body } from '@nestjs/common';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  /**
   * GET /platform/stores/nearby?lat=12.9&lng=77.5&radiusKm=5
   * Enhanced store discovery with live available SKU count.
   */
  @Get('stores/nearby')
  getNearbyStores(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm = '5',
  ) {
    if (!lat || !lng) throw new BadRequestException('lat and lng are required');
    return this.platformService.getNearbyStores(parseFloat(lat), parseFloat(lng), parseFloat(radiusKm));
  }

  /**
   * GET /platform/catalog/search?q=atta&lat=12.9&lng=77.5&radiusKm=5
   * THE MOAT: Cross-store product search.
   * Returns which nearby stores carry the product with price + stock.
   */
  @Get('catalog/search')
  searchCatalog(
    @Query('q') q: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm = '5',
  ) {
    if (!q || !lat || !lng) throw new BadRequestException('q, lat, and lng are required');
    return this.platformService.searchCatalog(q, parseFloat(lat), parseFloat(lng), parseFloat(radiusKm));
  }

  /**
   * GET /platform/catalog/barcode/:code?lat=12.9&lng=77.5
   * "Which stores near me sell this exact product?"
   * Triggered when consumer scans a barcode on any product at home.
   */
  @Get('catalog/barcode/:code')
  searchByBarcode(
    @Param('code') code: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radiusKm') radiusKm = '5',
  ) {
    if (!lat || !lng) throw new BadRequestException('lat and lng are required');
    return this.platformService.searchByBarcode(code, parseFloat(lat), parseFloat(lng), parseFloat(radiusKm));
  }

  /**
   * POST /platform/ondc/sync?storeId=x
   * Generates ONDC-compatible catalog JSON for the store.
   * Next step: POST this to the ONDC gateway to appear on Paytm/PhonePe.
   */
  @Post('ondc/sync')
  syncOndcCatalog(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.platformService.buildOndcCatalog(storeId);
  }

  /**
   * GET /platform/ondc/catalog/:storeId
   * Preview the ONDC catalog for a store without pushing it.
   */
  @Get('ondc/catalog/:storeId')
  previewOndcCatalog(@Param('storeId') storeId: string) {
    return this.platformService.buildOndcCatalog(storeId);
  }

  /**
   * POST /platform/vendors/onboard
   * Easy unified vendor onboarding
   */
  @Post('vendors/onboard')
  async onboardVendor(@Body() body: any) {
    return this.platformService.onboardVendor(body);
  }
}
