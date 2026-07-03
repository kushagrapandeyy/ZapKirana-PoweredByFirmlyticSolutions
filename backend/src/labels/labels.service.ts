import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BarcodeScope } from '@prisma/client';

// ─── Internal barcode generators ──────────────────────────────────────────────

/**
 * Class C — Internal fixed-pack barcode
 * Format: BK{storeCode:2}{productCode:4}{packGrams:4}
 *
 * Example:
 *   storeCode = "01"   productCode = "DALT"   packGrams = 1000
 *   → BK01DALT1000
 */
function generateFixedPackBarcode(storeCode: string, productCode: string, packGrams: number): string {
  const sc = storeCode.substring(0, 2).toUpperCase().padStart(2, '0');
  const pc = productCode.substring(0, 4).toUpperCase().padEnd(4, 'X');
  const pg = String(packGrams).padStart(4, '0');
  return `BK${sc}${pc}${pg}`;
}

/**
 * Class C — Internal variable-weight barcode (EAN-13 structure)
 * Format: 29{productCode:5}{weightGrams:5}{checkDigit:1}
 *
 * Example:
 *   productCode = 1234   weight = 500g
 *   → 2901234005008  (with EAN-13 check digit)
 */
function generateVariableWeightBarcode(productCode: number, weightGrams: number): string {
  const prefix = '29';
  const pc = String(productCode).substring(0, 5).padStart(5, '0');
  const wg = String(weightGrams).substring(0, 5).padStart(5, '0');
  const body = `${prefix}${pc}${wg}`;
  const checkDigit = calculateEan13CheckDigit(body);
  return `${body}${checkDigit}`;
}

function calculateEan13CheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(body[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  return (10 - (sum % 10)) % 10;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate and register an internal barcode for a product.
   *
   * POST /api/v1/labels/barcodes/generate
   */
  async generateBarcode(data: {
    storeId: string;
    productId: string;
    barcodeType: 'INTERNAL_FIXED_PACK' | 'INTERNAL_VARIABLE_WEIGHT';
    storeCode?: string;
    productCode?: string;
    productNumericCode?: number;
    packGrams?: number;
    weightGrams?: number;
  }) {
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('Product not found');

    let barcodeValue: string;
    let scope: BarcodeScope;

    if (data.barcodeType === 'INTERNAL_FIXED_PACK') {
      if (!data.packGrams) throw new BadRequestException('packGrams is required for fixed-pack barcodes');
      const storeCode = data.storeCode ?? '01';
      const productCode = data.productCode ?? product.internalSku.substring(0, 4);
      barcodeValue = generateFixedPackBarcode(storeCode, productCode, data.packGrams);
      scope = 'INTERNAL_FIXED_PACK';
    } else {
      if (!data.packGrams && !data.weightGrams) throw new BadRequestException('packGrams or weightGrams is required for variable-weight barcodes');
      const numCode = data.productNumericCode ?? Math.abs(product.id.charCodeAt(0) * 100 + product.id.charCodeAt(1));
      barcodeValue = generateVariableWeightBarcode(numCode % 100000, data.packGrams ?? data.weightGrams ?? 0);
      scope = 'INTERNAL_VARIABLE_WEIGHT';
    }

    // Check if already registered
    const existing = await this.prisma.barcodeRegistry.findFirst({
      where: { barcodeValue, storeId: data.storeId },
    });
    if (existing) {
      return { barcode: barcodeValue, barcodeRegistryId: existing.id, alreadyExisted: true };
    }

    const registry = await this.prisma.barcodeRegistry.create({
      data: {
        storeId: data.storeId,
        productId: data.productId,
        barcodeValue,
        symbology: scope === 'INTERNAL_FIXED_PACK' ? 'CODE_128' : 'EAN_13',
        barcodeScope: scope,
        isInternal: true,
        isPrimary: false,
        isActive: true,
      },
    });

    return {
      barcode: barcodeValue,
      barcodeRegistryId: registry.id,
      scope,
      productId: data.productId,
      alreadyExisted: false,
    };
  }

  /**
   * Register an external/GS1 barcode for a product in the registry.
   * Used to associate a manufacturer EAN-13 with a store product.
   *
   * POST /api/v1/labels/barcodes/register-external
   */
  async registerExternalBarcode(data: {
    productId: string;
    barcodeValue: string;
    symbology?: string;
    storeId?: string;
    isPrimary?: boolean;
  }) {
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.barcodeRegistry.findFirst({
      where: { barcodeValue: data.barcodeValue, storeId: data.storeId ?? null },
    });
    if (existing) throw new BadRequestException('Barcode already registered');

    return this.prisma.barcodeRegistry.create({
      data: {
        storeId: data.storeId ?? null,
        productId: data.productId,
        barcodeValue: data.barcodeValue,
        symbology: data.symbology ?? 'EAN_13',
        barcodeScope: 'GS1_EXTERNAL_PRODUCT',
        isInternal: false,
        isPrimary: data.isPrimary ?? true,
        isActive: true,
      },
    });
  }

  /**
   * Get all barcodes registered for a product.
   *
   * GET /api/v1/labels/barcodes?productId=x
   */
  async getBarcodesForProduct(productId: string) {
    return this.prisma.barcodeRegistry.findMany({
      where: { productId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a print job for labels.
   * labelDataJson carries all rendering metadata; actual PDF generation
   * can be plugged in later (puppeteer / pdfmake).
   *
   * POST /api/v1/labels/print-jobs
   */
  async createPrintJob(data: {
    storeId: string;
    requestedById?: string;
    templateType: string;
    items: Array<{
      variantId: string;
      barcode: string;
      quantity: number;
      metadata?: Record<string, unknown>;
    }>;
  }) {
    const labelDataJson = {
      templateType: data.templateType,
      items: data.items,
      generatedAt: new Date().toISOString(),
    };

    const job = await this.prisma.printJob.create({
      data: {
        storeId: data.storeId,
        requestedById: data.requestedById ?? null,
        templateType: data.templateType,
        labelDataJson: JSON.parse(JSON.stringify(labelDataJson)),
        status: 'READY',
      },
    });

    return {
      printJobId: job.id,
      status: 'READY',
      labelDataJson,
      itemCount: data.items.length,
      totalLabels: data.items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  /**
   * Get a print job's status and data.
   *
   * GET /api/v1/labels/print-jobs/:id
   */
  async getPrintJob(id: string) {
    const job = await this.prisma.printJob.findUnique({
      where: { id },
      include: { requestedBy: { select: { id: true, name: true } } },
    });
    if (!job) throw new NotFoundException('Print job not found');
    return job;
  }

  /**
   * List print jobs for a store.
   *
   * GET /api/v1/labels/print-jobs?storeId=x
   */
  async listPrintJobs(storeId: string) {
    return this.prisma.printJob.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { requestedBy: { select: { id: true, name: true } } },
    });
  }
}
