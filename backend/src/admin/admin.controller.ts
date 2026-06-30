import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard ─────────────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ─── Stores ────────────────────────────────────────
  @Get('stores')
  getStores() {
    return this.adminService.getStores();
  }

  @Post('stores')
  createStore(@Body() body: any, @Request() req: any) {
    return this.adminService.createStore(body, req.user.id);
  }

  // ─── Vendors ───────────────────────────────────────
  @Get('vendors')
  getVendors() {
    return this.adminService.getVendors();
  }

  @Post('vendors')
  createVendor(@Body() body: any, @Request() req: any) {
    return this.adminService.createVendor(body, req.user.id);
  }

  // ─── Suppliers ─────────────────────────────────────
  @Get('suppliers')
  getSuppliers() {
    return this.adminService.getSuppliers();
  }

  @Get('suppliers/:id')
  getSupplier(@Param('id') id: string) {
    return this.adminService.getSupplierById(id);
  }

  @Post('suppliers')
  createSupplier(@Body() body: any, @Request() req: any) {
    return this.adminService.createSupplier(body, req.user.id);
  }

  @Patch('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.adminService.updateSupplier(id, body, req.user.id);
  }

  // ─── Audit ─────────────────────────────────────────
  @Get('audits')
  getAudits(@Query('limit') limit?: string) {
    return this.adminService.getAudits(limit ? parseInt(limit) : undefined);
  }
}
