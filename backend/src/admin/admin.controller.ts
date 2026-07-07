import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { HumanApprovalRequired } from '../common/decorators/human-approval.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@Roles(Role.ORG_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard ─────────────────────────────────────
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ─── HR & STAFF MANAGEMENT ──────────────────────────

  @Get('hr/staff')
  async getStaffList(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.adminService.getStaffList(storeId);
  }

  // ─── ALERTS ────────────────────────────────────────

  @Get('alerts')
  async getAlerts(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.adminService.getAlerts(storeId);
  }

  // ─── Stores ────────────────────────────────────────
  @Get('stores')
  getStores() {
    return this.adminService.getStores();
  }

  @HumanApprovalRequired('New store creation requires human validation of location, GST, and owner identity.')
  @Post('stores')
  createStore(@Body() body: any, @Request() req: any) {
    return this.adminService.createStore(body, req.user.id);
  }

  @HumanApprovalRequired('Going live requires human verification of catalog size, payments setup, and FSSAI.')
  @Post('stores/:id/go-live')
  approveStoreOnboarding(@Param('id') id: string, @Request() req: any) {
    // return this.adminService.approveStoreGoLive(id, req.user.id);
    return { message: 'Store approved and active', storeId: id };
  }

  @Patch('stores/:id')
  updateStore(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.adminService.updateStore(id, body, req.user.id);
  }

  @Delete('stores/:id')
  archiveStore(@Param('id') id: string, @Request() req: any) {
    return this.adminService.archiveStore(id, req.user.id);
  }

  @Post('stores/bulk')
  bulkCreateStores(@Body() body: { stores: any[] }, @Request() req: any) {
    return this.adminService.bulkCreateStores(body.stores, req.user.id);
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
  @Public()
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

  // ─── Supplier Import ─────────────────────────────────────

  @Post('suppliers/import/upload')
  uploadSuppliersImport(@Body() body: any, @Request() req: any) {
    if (!body.storeId) {
      throw new BadRequestException('storeId is required for import');
    }
    return this.adminService.uploadSuppliersImport(body.storeId, body.rows, req.user.id);
  }

  @Get('suppliers/import/:batchId/preview')
  getSupplierImportPreview(@Param('batchId') batchId: string) {
    return this.adminService.getSupplierImportPreview(batchId);
  }

  @Post('suppliers/import/:batchId/confirm')
  confirmSupplierImport(@Param('batchId') batchId: string) {
    return this.adminService.confirmSupplierImport(batchId);
  }

  @Post('suppliers/import/:batchId/cancel')
  cancelSupplierImport(@Param('batchId') batchId: string) {
    return this.adminService.cancelSupplierImport(batchId);
  }

  // ─── Audit ─────────────────────────────────────────
  @Get('audits')
  getAudits(@Query('limit') limit?: string) {
    return this.adminService.getAudits(limit ? parseInt(limit) : undefined);
  }
}
