import { Controller, Get, Post, Patch, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { SuppliersService, CreateLedgerPayload, UpdateLedgerPayload } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // =====================================================
  // PARTY LEDGER — PRIMARY ENDPOINTS
  // =====================================================

  /**
   * GET /suppliers/ledger?storeId=x
   * List all party ledgers (suppliers/creditors) for a store.
   */
  @Get('ledger')
  listLedgers(
    @Query('storeId') storeId: string,
    @Query('accountGroup') accountGroup?: string,
  ) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.suppliersService.listLedgers(storeId, { accountGroup });
  }

  /**
   * POST /suppliers/ledger
   * Create a full Party Ledger (name + mobile compulsory).
   * Fans out transactionally to contact, address, tax profile, payment policy.
   */
  @Post('ledger')
  createLedger(@Body() body: { storeId: string } & CreateLedgerPayload) {
    if (!body.storeId) throw new BadRequestException('storeId is required');
    const { storeId, ...payload } = body;
    return this.suppliersService.createLedger(storeId, payload);
  }

  /**
   * GET /suppliers/ledger/:id
   * Returns full SupplierLedgerView — all sub-tables in one response.
   */
  @Get('ledger/:id')
  getLedgerView(@Param('id') id: string) {
    return this.suppliersService.getLedgerView(id);
  }

  /**
   * PATCH /suppliers/ledger/:id
   * Update any combination of sub-tables transactionally.
   * Only sends diffs, not the full object.
   */
  @Patch('ledger/:id')
  updateLedger(
    @Param('id') id: string,
    @Body() body: { storeId: string } & UpdateLedgerPayload,
  ) {
    if (!body.storeId) throw new BadRequestException('storeId is required');
    const { storeId, ...payload } = body;
    return this.suppliersService.updateLedger(id, storeId, payload);
  }

  // =====================================================
  // LEGACY — backward compat
  // =====================================================

  @Get()
  getAllSuppliers() {
    return this.suppliersService.getAllSuppliers();
  }

  @Get('connections')
  getStoreConnections(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.suppliersService.getStoreConnections(storeId);
  }

  @Post('connect')
  connectStoreToSupplier(@Body() body: { storeId: string; supplierId: string }) {
    if (!body.storeId || !body.supplierId) {
      throw new BadRequestException('storeId and supplierId are required');
    }
    return this.suppliersService.connectStoreToSupplier(body.storeId, body.supplierId);
  }
}
