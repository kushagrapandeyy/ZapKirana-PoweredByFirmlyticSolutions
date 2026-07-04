import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ScannerManagementService } from './scanner-management.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('scanner-management')
export class ScannerManagementController {
  constructor(private readonly scannerManagementService: ScannerManagementService) {}

  // The storeId is typically obtained from the logged-in admin/owner's JWT token
  // For simplicity we extract it from req.user.storeId

  @Get('staff')
  async getStaff(@Request() req: any) {
    return this.scannerManagementService.getScannerStaff(req.user.storeId);
  }

  @Post('staff')
  async createStaff(@Request() req: any, @Body() body: { name: string; pin: string }) {
    return this.scannerManagementService.createScannerStaff(req.user.storeId, body);
  }

  @Get('devices')
  async getDevices(@Request() req: any) {
    return this.scannerManagementService.getDevices(req.user.storeId);
  }

  @Post('devices')
  async registerDevice(@Request() req: any, @Body() body: { deviceName: string; deviceCode: string }) {
    return this.scannerManagementService.registerDevice(req.user.storeId, body);
  }

  @Get('analytics')
  async getAnalytics(@Request() req: any) {
    return this.scannerManagementService.getAnalytics(req.user.storeId);
  }

  @Post('heartbeat')
  async heartbeat(@Request() req: any, @Body() body: { deviceCode: string }) {
    return this.scannerManagementService.heartbeatDevice(req.user.storeId, body.deviceCode);
  }
}
