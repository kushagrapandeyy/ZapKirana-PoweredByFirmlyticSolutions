import {
  Controller, Post, Get, Body, Param, Query, Headers, UseGuards,
} from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScannerWorkflow } from '@prisma/client';

@Controller('api/v1/scanner')
@UseGuards(JwtAuthGuard)
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  /**
   * GET /api/v1/scanner/workflows
   * Returns all available scanner workflows.
   */
  @Get('workflows')
  getWorkflows() {
    return this.scannerService.getWorkflows();
  }

  /**
   * POST /api/v1/scanner/resolve
   * Classify + resolve a barcode for a given workflow.
   * This is the primary call the scanner app makes on every scan.
   */
  @Post('resolve')
  resolveBarcode(
    @Body() body: {
      storeId: string;
      workflow: ScannerWorkflow;
      rawValue: string;
      symbology?: string;
      deviceId?: string;
      scannedById?: string;
      idempotencyKey: string;
      quantity?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.scannerService.resolveBarcode(body);
  }

  /**
   * POST /api/v1/scanner/events
   * Submit a completed scan event (after confirming quantity, expiry etc.)
   */
  @Post('events')
  submitEvent(
    @Body() body: {
      storeId: string;
      workflow: ScannerWorkflow;
      rawValue: string;
      symbology?: string;
      productId?: string;
      quantity?: number;
      deviceId?: string;
      scannedById?: string;
      idempotencyKey: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.scannerService.submitScanEvent(body);
  }

  /**
   * POST /api/v1/scanner/sync/batch
   * Drain offline event queue from a scanner device.
   */
  @Post('sync/batch')
  batchSync(
    @Body() body: {
      storeId: string;
      deviceId: string;
      events: Array<{
        idempotencyKey: string;
        workflow: string;
        rawValue: string;
        symbology?: string;
        quantity?: number;
        scannedAt: string;
        metadata?: Record<string, unknown>;
      }>;
    },
  ) {
    return this.scannerService.batchSync(body.storeId, body.deviceId, body.events);
  }

  /**
   * GET /api/v1/scanner/activity?storeId=x&limit=50
   * Vendor dashboard: recent scan events.
   */
  @Get('activity')
  getActivity(
    @Query('storeId') storeId: string,
    @Query('limit') limit?: string,
  ) {
    return this.scannerService.getScannerActivity(storeId, limit ? parseInt(limit, 10) : 50);
  }

  /**
   * GET /api/v1/scanner/devices?storeId=x
   * List registered scanner devices for a store.
   */
  @Get('devices')
  getDevices(@Query('storeId') storeId: string) {
    return this.scannerService.getDevices(storeId);
  }

  /**
   * POST /api/v1/scanner/devices
   * Register a new scanner device.
   */
  @Post('devices')
  registerDevice(
    @Body() body: {
      storeId: string;
      deviceName: string;
      deviceType?: string;
      assignedToId?: string;
    },
  ) {
    return this.scannerService.registerDevice(body);
  }

  /**
   * POST /api/v1/scanner/devices/:deviceId/heartbeat
   * Update last-seen timestamp for a device (called periodically by scanner app).
   */
  @Post('devices/:deviceId/heartbeat')
  heartbeat(@Param('deviceId') deviceId: string) {
    return this.scannerService.deviceHeartbeat(deviceId);
  }
}
