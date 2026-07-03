import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ScannerWorkflow, ScanResolutionStatus, BarcodeScope } from '@prisma/client';

// ─── Barcode Classifier ───────────────────────────────────────────────────────

export interface ClassifiedBarcode {
  scope: BarcodeScope;
  rawValue: string;
  symbology: string;
  gtin?: string;         // normalised GTIN-14 if GS1
  productCode?: string;  // for internal barcodes
  weightGrams?: number;  // for variable-weight internal barcodes
  packSizeGrams?: number;
  referenceType?: 'PO' | 'ORDER' | 'BIN' | 'SUPPLIER_CRATE';
  referenceId?: string;
}

export function classifyBarcode(rawValue: string): ClassifiedBarcode {
  const v = rawValue.trim();

  // ── Internal variable-weight (29PPPPPWWWWWC) ─────────────────────────────
  if (/^29\d{11}$/.test(v)) {
    const productCode = v.substring(2, 7);
    const weightGrams = parseInt(v.substring(7, 12), 10);
    return { scope: 'INTERNAL_VARIABLE_WEIGHT', rawValue: v, symbology: 'EAN_13', productCode, weightGrams };
  }

  // ── Internal fixed-pack (BK…) ────────────────────────────────────────────
  if (/^BK/i.test(v)) {
    // Format: BK{storeCode:2}{productCode:4}{packGrams:4}
    const productCode = v.substring(4, 8).toUpperCase();
    const packSizeGrams = parseInt(v.substring(8), 10) || undefined;
    return { scope: 'INTERNAL_FIXED_PACK', rawValue: v, symbology: 'CODE_128', productCode, packSizeGrams };
  }

  // ── Purchase Order barcode (PO-…) ────────────────────────────────────────
  if (/^PO-/i.test(v)) {
    return { scope: 'INTERNAL_OPERATIONAL', rawValue: v, symbology: 'CODE_128', referenceType: 'PO', referenceId: v };
  }

  // ── Order barcode (ORD-…) ────────────────────────────────────────────────
  if (/^ORD-/i.test(v)) {
    return { scope: 'INTERNAL_OPERATIONAL', rawValue: v, symbology: 'CODE_128', referenceType: 'ORDER', referenceId: v };
  }

  // ── Bin/location barcode (BIN-…) ─────────────────────────────────────────
  if (/^BIN-/i.test(v)) {
    return { scope: 'INTERNAL_OPERATIONAL', rawValue: v, symbology: 'CODE_128', referenceType: 'BIN', referenceId: v };
  }

  // ── GS1 EAN-13 (13 digits) ───────────────────────────────────────────────
  if (/^\d{13}$/.test(v)) {
    // Normalise to GTIN-14 by zero-padding
    const gtin = '0' + v;
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'EAN_13', gtin };
  }

  // ── GS1 EAN-8 (8 digits) ─────────────────────────────────────────────────
  if (/^\d{8}$/.test(v)) {
    const gtin = '000000' + v;
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'EAN_8', gtin };
  }

  // ── GS1 UPC-A (12 digits) ────────────────────────────────────────────────
  if (/^\d{12}$/.test(v)) {
    const gtin = '00' + v;
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'UPC_A', gtin };
  }

  // ── GS1 GTIN-14 / ITF-14 (14 digits) ────────────────────────────────────
  if (/^\d{14}$/.test(v)) {
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'ITF_14', gtin: v };
  }

  // ── QR / longer Code128 — treat as unknown ───────────────────────────────
  return { scope: 'UNKNOWN', rawValue: v, symbology: 'UNKNOWN' };
}

// ─── Workflow next-action map ─────────────────────────────────────────────────

const WORKFLOW_NEXT_ACTION: Record<string, { action: string; requiresExpiry: boolean; requiresBatch: boolean }> = {
  GOODS_RECEIVING: { action: 'ENTER_RECEIVED_QUANTITY', requiresExpiry: true, requiresBatch: false },
  STOCK_AUDIT:     { action: 'ENTER_COUNT', requiresExpiry: false, requiresBatch: false },
  PRODUCT_INTAKE:  { action: 'CREATE_PENDING_PRODUCT', requiresExpiry: false, requiresBatch: false },
  LOOSE_ITEM_PACKING: { action: 'ENTER_PACK_QUANTITY', requiresExpiry: true, requiresBatch: false },
  ORDER_PICKING:   { action: 'CONFIRM_PICKED', requiresExpiry: false, requiresBatch: false },
  SHELF_REFILL:    { action: 'CONFIRM_REFILLED', requiresExpiry: false, requiresBatch: false },
  DAMAGED_EXPIRED: { action: 'ENTER_DAMAGED_QUANTITY', requiresExpiry: false, requiresBatch: false },
  LABEL_REPRINT:   { action: 'SELECT_LABEL_TEMPLATE', requiresExpiry: false, requiresBatch: false },
  POS_BILLING:     { action: 'ADD_TO_BILL', requiresExpiry: false, requiresBatch: false },
};

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ScannerService {
  constructor(private prisma: PrismaService) {}

  /**
   * PRIMARY ENDPOINT: classify + resolve a barcode for a given workflow.
   * This is the scanner app's main API call on every scan.
   */
  async resolveBarcode(data: {
    storeId: string;
    workflow: ScannerWorkflow;
    rawValue: string;
    deviceId?: string;
    scannedById?: string;
    idempotencyKey: string;
    quantity?: number;
    metadata?: Record<string, unknown>;
  }) {
    const classified = classifyBarcode(data.rawValue);
    const symbology = classified.symbology;

    // Build parsedJson for event log
    const parsedJson = { ...classified, workflow: data.workflow };

    let resolutionStatus: ScanResolutionStatus = 'UNKNOWN_BARCODE';
    let product: any = null;
    let inventory: any = null;

    // 1. Try BarcodeRegistry first (internal + external registered barcodes)
    const registryEntry = await this.prisma.barcodeRegistry.findFirst({
      where: {
        barcodeValue: data.rawValue,
        isActive: true,
        OR: [{ storeId: data.storeId }, { storeId: null }],
      },
      include: { product: true },
    });

    if (registryEntry?.product) {
      product = registryEntry.product;
      resolutionStatus = classified.scope === 'GS1_EXTERNAL_PRODUCT' ? 'FOUND' : 'INTERNAL_BARCODE';
    }

    // 2. If not in registry, try Product table by barcode field
    if (!product && classified.scope === 'GS1_EXTERNAL_PRODUCT') {
      product = await this.prisma.product.findFirst({
        where: { barcode: data.rawValue, storeId: data.storeId, isActive: true },
      });
      if (product) resolutionStatus = 'FOUND';
    }

    // 3. Get inventory if product resolved
    if (product) {
      inventory = await this.prisma.inventory.findFirst({
        where: { storeId: data.storeId, productId: product.id },
      });
    }

    // 4. Handle operational barcodes
    if (classified.scope === 'INTERNAL_OPERATIONAL') {
      resolutionStatus = 'OPERATIONAL_BARCODE';
    }

    // 5. Log scan event (upsert by idempotency key — skip duplicates)
    const existingEvent = await this.prisma.scannerEvent.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (!existingEvent) {
      await this.prisma.scannerEvent.create({
        data: {
          storeId: data.storeId,
          deviceId: data.deviceId ?? null,
          scannedById: data.scannedById ?? null,
          workflow: data.workflow,
          rawValue: data.rawValue,
          symbology,
          parsedJson,
          resolutionStatus,
          idempotencyKey: data.idempotencyKey,
          quantity: data.quantity ?? null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : {},
        },
      });
    }

    // 6. Build response
    const workflowMeta = WORKFLOW_NEXT_ACTION[data.workflow] ?? { action: 'UNKNOWN', requiresExpiry: false, requiresBatch: false };

    if (product) {
      const availableQty = inventory
        ? Math.max(0, inventory.onHandQty - inventory.reservedQty - inventory.blockedQty)
        : 0;

      return {
        status: resolutionStatus === 'FOUND' ? 'FOUND' : 'INTERNAL_BARCODE',
        barcodeScope: classified.scope,
        isDuplicate: !!existingEvent,
        product: {
          productId: product.id,
          name: product.name,
          brand: product.description ?? null,
          category: product.category,
          barcode: product.barcode,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          gstRate: product.gstRate,
          gstClass: product.gstClass,
          imageUrl: product.imageUrl,
          availableQty,
        },
        workflow: workflowMeta,
      };
    }

    if (classified.scope === 'INTERNAL_OPERATIONAL') {
      return {
        status: 'OPERATIONAL_BARCODE',
        barcodeScope: classified.scope,
        isDuplicate: !!existingEvent,
        reference: { type: classified.referenceType, id: classified.referenceId },
        workflow: workflowMeta,
      };
    }

    // Unknown barcode
    return {
      status: 'UNKNOWN_BARCODE',
      barcodeScope: classified.scope,
      isDuplicate: !!existingEvent,
      product: null,
      workflow: { action: 'CREATE_PENDING_PRODUCT', requiresExpiry: false, requiresBatch: false },
    };
  }

  /**
   * Submit a completed scan event (after user has confirmed quantity etc.)
   */
  async submitScanEvent(data: {
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
  }) {
    // Idempotency: skip if already processed
    const existing = await this.prisma.scannerEvent.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (existing) {
      return { status: 'DUPLICATE_SKIPPED', eventId: existing.id };
    }

    const event = await this.prisma.scannerEvent.create({
      data: {
        storeId: data.storeId,
        deviceId: data.deviceId ?? null,
        scannedById: data.scannedById ?? null,
        workflow: data.workflow,
        rawValue: data.rawValue,
        symbology: data.symbology ?? 'UNKNOWN',
        parsedJson: classifyBarcode(data.rawValue) as any,
        resolutionStatus: data.productId ? 'FOUND' : 'UNKNOWN_BARCODE',
        idempotencyKey: data.idempotencyKey,
        quantity: data.quantity ?? null,
        metadata: (data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : {}) as any,
      },
    });

    return { status: 'ACCEPTED', eventId: event.id };
  }

  /**
   * Drain an offline event queue (batch sync from scanner device)
   */
  async batchSync(storeId: string, deviceId: string, events: Array<{
    idempotencyKey: string;
    workflow: string;
    rawValue: string;
    symbology?: string;
    quantity?: number;
    scannedAt: string;
    metadata?: Record<string, unknown>;
  }>) {
    let processed = 0;
    let duplicates = 0;
    const failed: string[] = [];

    for (const e of events) {
      try {
        const existing = await this.prisma.scannerEvent.findUnique({
          where: { idempotencyKey: e.idempotencyKey },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        const classified = classifyBarcode(e.rawValue);

        await this.prisma.scannerEvent.create({
          data: {
            storeId,
            deviceId,
            workflow: e.workflow as ScannerWorkflow,
            rawValue: e.rawValue,
            symbology: e.symbology ?? classified.symbology,
            parsedJson: classified as any,
            resolutionStatus: classified.scope === 'UNKNOWN' ? 'UNKNOWN_BARCODE' : 'FOUND',
            idempotencyKey: e.idempotencyKey,
            quantity: e.quantity ?? null,
            metadata: JSON.parse(JSON.stringify({ ...e.metadata, offlineScannedAt: e.scannedAt })),
          },
        });

        processed++;
      } catch {
        failed.push(e.idempotencyKey);
      }
    }

    return { processed, duplicates, failed };
  }

  /**
   * Get available workflows for a store (can be store-plan-gated later)
   */
  getWorkflows() {
    return {
      workflows: [
        'GOODS_RECEIVING',
        'STOCK_AUDIT',
        'PRODUCT_INTAKE',
        'LOOSE_ITEM_PACKING',
        'ORDER_PICKING',
        'SHELF_REFILL',
        'DAMAGED_EXPIRED',
        'LABEL_REPRINT',
        'POS_BILLING',
      ],
    };
  }

  /**
   * Register or update a scanner device
   */
  async registerDevice(data: {
    storeId: string;
    deviceName: string;
    deviceType?: string;
    assignedToId?: string;
  }) {
    return this.prisma.scannerDevice.create({
      data: {
        storeId: data.storeId,
        deviceName: data.deviceName,
        deviceType: (data.deviceType as any) ?? 'ANDROID_PHONE',
        assignedToId: data.assignedToId ?? null,
        lastSeenAt: new Date(),
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get scanner activity for a store (vendor dashboard feed)
   */
  async getScannerActivity(storeId: string, limit = 50) {
    return this.prisma.scannerEvent.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        scannedBy: { select: { id: true, name: true, role: true } },
        device: { select: { id: true, deviceName: true, deviceType: true } },
      },
    });
  }

  /**
   * Get all devices registered for a store
   */
  async getDevices(storeId: string) {
    return this.prisma.scannerDevice.findMany({
      where: { storeId },
      include: { assignedTo: { select: { id: true, name: true, role: true } } },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  /**
   * Heartbeat — update device last-seen timestamp
   */
  async deviceHeartbeat(deviceId: string) {
    const device = await this.prisma.scannerDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('Device not found');
    return this.prisma.scannerDevice.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date() },
    });
  }
}
