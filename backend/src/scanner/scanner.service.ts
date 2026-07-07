import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { ScannerWorkflow, ScanResolutionStatus, BarcodeScope, Role, MovementType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

export interface ClassifiedBarcode {
  scope: BarcodeScope;
  rawValue: string;
  symbology: string;
  gtin?: string;
  productCode?: string;
  weightGrams?: number;
  packSizeGrams?: number;
  referenceType?: 'PO' | 'ORDER' | 'BIN' | 'SUPPLIER_CRATE';
  referenceId?: string;
}

export function classifyBarcode(rawValue: string): ClassifiedBarcode {
  const v = rawValue.trim();
  if (/^29\d{11}$/.test(v)) {
    const productCode = v.substring(2, 7);
    const weightGrams = parseInt(v.substring(7, 12), 10);
    return { scope: 'INTERNAL_VARIABLE_WEIGHT', rawValue: v, symbology: 'EAN_13', productCode, weightGrams };
  }
  if (/^BK/i.test(v)) {
    const productCode = v.substring(4, 8).toUpperCase();
    const packSizeGrams = parseInt(v.substring(8), 10) || undefined;
    return { scope: 'INTERNAL_FIXED_PACK', rawValue: v, symbology: 'CODE_128', productCode, packSizeGrams };
  }
  if (/^PO-/i.test(v)) {
    return { scope: 'INTERNAL_OPERATIONAL', rawValue: v, symbology: 'CODE_128', referenceType: 'PO', referenceId: v };
  }
  if (/^ORD-/i.test(v)) {
    return { scope: 'INTERNAL_OPERATIONAL', rawValue: v, symbology: 'CODE_128', referenceType: 'ORDER', referenceId: v };
  }
  if (/^BIN-/i.test(v)) {
    return { scope: 'INTERNAL_OPERATIONAL', rawValue: v, symbology: 'CODE_128', referenceType: 'BIN', referenceId: v };
  }
  if (/^\d{13}$/.test(v)) {
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'EAN_13', gtin: '0' + v };
  }
  if (/^\d{8}$/.test(v)) {
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'EAN_8', gtin: '000000' + v };
  }
  if (/^\d{12}$/.test(v)) {
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'UPC_A', gtin: '00' + v };
  }
  if (/^\d{14}$/.test(v)) {
    return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'ITF_14', gtin: v };
  }
  return { scope: 'UNKNOWN', rawValue: v, symbology: 'UNKNOWN' };
}

@Injectable()
export class ScannerService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private realtimeService: RealtimeService,
    private inventoryService: InventoryService,
    private productsService: ProductsService,
  ) {}

  async checkPermission(userId: string, storeId: string): Promise<Role> {
    const roleRecord = await this.prisma.userStoreRole.findFirst({
      where: { userId, storeId, status: 'ACTIVE' },
    });
    if (!roleRecord) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && (user.role === 'OWNER' || user.role === 'ORG_ADMIN')) {
        return user.role;
      }
      throw new ForbiddenException('User has no active role or access to this store');
    }
    return roleRecord.role;
  }

  async lookupBarcode(storeId: string, barcode: string, scanMode: string) {
    const cacheKey = `store:${storeId}:barcode:${barcode}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const sp = await this.prisma.storeProduct.findFirst({
        where: { storeId, productBarcodes: { some: { barcode } } },
        include: {
          product: { include: { brand: true, category: true } },
          pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
          taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
          productBarcodes: true,
          inventoryPolicy: true,
          rackLocations: true,
        },
      });
      if (!sp) throw new Error('Not found');

      const pricing = sp.pricing?.[0];
      const tax = sp.taxProfile?.[0];
      const inventory = await this.inventoryService.getAvailableStock(storeId, sp.id);
      
      const quantityBase = inventory.onHand.toNumber();
      const barcodeData = sp.productBarcodes?.find(b => b.barcode === barcode);
      const conversion = 1; // conversionToBase not in new schema, assuming 1
      
      const boxes = conversion > 1 ? Math.floor(quantityBase / conversion) : 0;
      const pcs = conversion > 1 ? quantityBase % conversion : quantityBase;
      const displayQuantity = conversion > 1 ? `${boxes} BOX + ${pcs} PCS` : `${pcs} PCS`;

      const response = {
        found: true,
        product: {
          id: sp.id,
          name: sp.displayName ?? sp.product?.name,
          brand: sp.product?.brand?.name || 'General',
          category: sp.product?.category?.name || 'General',
          hsnSac: tax?.hsnSacCode || '04039090',
          unit: 'PCS',
          saleUnit: 'PCS',
          packing: `BOX OF ${conversion}`,
          shelfLifeDays: sp.inventoryPolicy?.shelfLifeDays || 258,
          status: sp.status,
        },
        barcodeUnit: {
          barcodeType: barcodeData?.barcodeType || 'ITEM',
          unitName: 'PCS', // unitName removed from schema
          conversionToBase: conversion,
        },
        pricing: {
          mrp: pricing?.mrp?.toNumber() || 0,
          purchaseRateBaseUnit: pricing?.purchaseRate?.toNumber() || 0,
          purchaseRateInputUnit: (pricing?.purchaseRate?.toNumber() || 0) * conversion,
          saleRateBaseUnit: pricing?.sellingPrice?.toNumber() || 0,
        },
        tax: {
          sgstPercent: tax?.sgstRate?.toNumber() || 0,
          cgstPercent: tax?.cgstRate?.toNumber() || 0,
          igstPercent: tax?.igstRate?.toNumber() || tax?.gstRate?.toNumber() || 0,
        },
        inventory: {
          quantityBase,
          displayQuantity,
          rackNo: sp.rackLocations?.[0]?.rackNo || 'A-12',
          reorderQtyBase: sp.inventoryPolicy?.reorderQty?.toNumber() || 15,
        },
        allowedActions: ['STOCK_INTAKE', 'BOX_INTAKE', 'ADJUST_STOCK', 'ARCHIVE']
      };

      await this.cacheService.set(cacheKey, response, 3600);
      return response;
    } catch {
      return { found: false, action: 'CREATE_PRODUCT_DRAFT', barcode };
    }
  }

  async updateProduct(
    userId: string,
    productId: string,
    data: {
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
    const role = await this.checkPermission(userId, data.storeId);
    
    if (role === 'SCANNER_STAFF' || role === 'STAFF') {
      const sp = await this.prisma.storeProduct.findFirst({ where: { id: productId, storeId: data.storeId }, include: { productBarcodes: true } });
      if (!sp) throw new NotFoundException('StoreProduct not found');
      
      const draft = await this.prisma.pendingProduct.create({
        data: {
          storeId: data.storeId,
          barcode: sp.productBarcodes?.[0]?.barcode || '',
          suggestedName: data.name,
          suggestedBrand: data.brand,
          suggestedCategory: data.category,
          mrp: data.mrp != null ? new Decimal(data.mrp) : undefined,
          sellingPrice: data.saleRateBaseUnit != null ? new Decimal(data.saleRateBaseUnit) : undefined,
          purchasePrice: data.purchaseRateBaseUnit != null ? new Decimal(data.purchaseRateBaseUnit) : undefined,
          gstRate: data.igstPercent != null ? new Decimal(data.igstPercent) : undefined,
          createdById: userId,
          status: 'PENDING_REVIEW',
          notes: `Staff requested updates. Rack: ${data.rackNo}. HSN: ${data.hsnSac}`,
        },
      });
      return { draftId: draft.id, status: draft.status, message: 'Changes queued for Manager approval.' };
    }

    await this.productsService.updatePricing(productId, userId, {
      mrp: data.mrp,
      sellingPrice: data.saleRateBaseUnit,
      purchaseRate: data.purchaseRateBaseUnit,
    });

    if (data.name) {
      await this.productsService.updateStoreProduct(productId, data.storeId, {
        displayName: data.name,
        updatedBy: userId,
      });
    }

    if (data.rackNo) {
      const existingRack = await this.prisma.productRackLocation.findFirst({ where: { storeProductId: productId } });
      if (existingRack) {
        await this.prisma.productRackLocation.update({ where: { id: existingRack.id }, data: { rackNo: data.rackNo } });
      } else {
        await this.prisma.productRackLocation.create({ data: { storeProductId: productId, rackNo: data.rackNo } });
      }
    }

    if (data.hsnSac || data.igstPercent !== undefined) {
      const sp = await this.prisma.storeProduct.findUnique({ where: { id: productId }, include: { taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 } } });
      const tax = sp?.taxProfile?.[0];
      await this.prisma.productTaxProfile.create({
        data: {
          storeProductId: productId,
          hsnSacCode: data.hsnSac ?? tax?.hsnSacCode,
          isTaxable: true,
          cgstRate: data.cgstPercent != null ? new Decimal(data.cgstPercent) : tax?.cgstRate,
          sgstRate: data.sgstPercent != null ? new Decimal(data.sgstPercent) : tax?.sgstRate,
          igstRate: data.igstPercent != null ? new Decimal(data.igstPercent) : tax?.igstRate,
          gstRate: data.igstPercent != null ? new Decimal(data.igstPercent) : tax?.gstRate,
          createdBy: userId,
        }
      });
    }

    await this.cacheService.delete(`store:${data.storeId}:product:${productId}`);
    return { success: true };
  }

  async updateStock(
    userId: string,
    data: {
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
    const quantityBase = data.quantityInput * data.conversionToBase;
    const isOutScan = ['DISPATCH', 'SALE', 'WASTE', 'WRITE_OFF', 'ADJUSTMENT_DOWN', 'SALE_RETURN'].includes(data.movementType);
    let movementType: MovementType = 'MANUAL_ADJUSTMENT';
    if (data.movementType === 'SALE') movementType = 'POS_SALE';
    if (data.movementType === 'WASTE') movementType = 'DAMAGE_WRITE_OFF';
    if (data.movementType === 'SALE_RETURN') movementType = 'SALE_RETURN';
    if (data.movementType === 'STOCK_INTAKE') movementType = 'PURCHASE_RECEIPT';
    
    await this.inventoryService.recordMovement({
      storeId: data.storeId,
      storeProductId: data.productId,
      type: movementType,
      quantityChange: isOutScan ? -Math.abs(quantityBase) : Math.abs(quantityBase),
      batchNo: data.batchNo,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      staffId: userId,
      note: data.note || `${isOutScan ? 'Out' : 'In'} scan: ${data.quantityInput} ${data.inputUnit}`,
    });

    await this.prisma.scannerEvent.create({
      data: {
        storeId: data.storeId,
        scannedById: userId,
        workflow: 'PRODUCT_INTAKE',
        rawValue: data.productId,
        symbology: 'INTERNAL',
        resolutionStatus: 'FOUND',
        idempotencyKey: uuidv4(),
        quantity: isOutScan ? -Math.abs(quantityBase) : Math.abs(quantityBase),
        metadata: {
          movementType: data.movementType,
          inputUnit: data.inputUnit,
          batchNo: data.batchNo,
        },
      },
    });

    const stock = await this.inventoryService.getAvailableStock(data.storeId, data.productId);
    
    const boxes = Math.floor(stock.onHand.toNumber() / (data.conversionToBase || 15));
    const pcs = stock.onHand.toNumber() % (data.conversionToBase || 15);
    const displayQuantity = `${boxes} BOX + ${pcs} PCS`;

    await this.realtimeService.broadcastInventoryUpdate(data.storeId, data.productId, {
      quantityBase: stock.onHand.toNumber(),
      displayQuantity,
    });

    return {
      success: true,
      quantityBase,
      newStockLevel: stock.onHand.toNumber(),
    };
  }

  async createProductDraft(
    userId: string,
    data: {
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
    const existing = await this.prisma.storeProductBarcode.findFirst({
      where: { barcode: data.barcode, storeProduct: { storeId: data.storeId } }
    });
    if (existing) {
      throw new BadRequestException('Barcode already registered');
    }

    const draft = await this.productsService.createPendingFromBarcode({
      storeId: data.storeId,
      barcode: data.barcode,
      createdById: userId,
      suggestedName: data.productName,
      mrp: data.mrp,
      sellingPrice: data.mrp,
      supplierId: data.supplierId,
    });

    return {
      draftId: draft.id,
      status: draft.status,
    };
  }

  async confirmProductExtraction(userId: string, extractionId: string, storeId: string, finalData: any) {
    const extraction = await this.prisma.scannerExtraction.findUnique({
      where: { id: extractionId }
    });
    if (!extraction || extraction.storeId !== storeId) {
      throw new NotFoundException('Extraction not found');
    }

    await this.prisma.scannerExtraction.update({
      where: { id: extractionId },
      data: { status: 'CONFIRMED' }
    });

    const product = await this.productsService.createStoreProduct({
      storeId,
      createdBy: userId,
      name: finalData.productName || 'Unknown Product',
      brandName: finalData.company,
      categoryName: finalData.category,
      barcode: finalData.productCode,
      mrp: Number(finalData.mrp) || 0,
      sellingPrice: Number(finalData.mrp) || 0,
      hsnSacCode: finalData.hsnSac,
      baseUnit: finalData.unit,
      cgstRate: Number(finalData.cgstPercent) || 0,
      sgstRate: Number(finalData.sgstPercent) || 0,
      igstRate: Number(finalData.igstPercent) || 0,
      shelfLifeDays: Number(finalData.shelfLifeDays) || undefined,
    });

    return product;
  }

  async confirmSupplierExtraction(userId: string, extractionId: string, storeId: string, finalData: any) {
    const extraction = await this.prisma.scannerExtraction.findUnique({
      where: { id: extractionId }
    });
    if (!extraction || extraction.storeId !== storeId) {
      throw new NotFoundException('Extraction not found');
    }

    await this.prisma.scannerExtraction.update({
      where: { id: extractionId },
      data: { status: 'CONFIRMED' }
    });

    const supplier = await this.prisma.supplier.create({
      data: {
        storeId,
        name: finalData.supplierName || finalData.ledgerName || 'Unknown Supplier',
        ledgerName: finalData.ledgerName,
        accountGroup: finalData.accountGroup,
        gstin: finalData.gstin,
        city: finalData.city,
        openingBalance: new Decimal(finalData.openingBalance || 0),
        openingBalanceType: finalData.openingBalanceType
      }
    });

    await this.prisma.storeSupplierConnection.create({
      data: { storeId, supplierId: supplier.id, status: 'CONNECTED' }
    });

    return supplier;
  }

  async generateInternalBarcode(storeId: string): Promise<string> {
    let isUnique = false;
    let finalBarcode = '';
    
    while (!isUnique) {
      const random10 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      const base = `02${random10}`;
      let oddSum = 0; let evenSum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(base[i], 10);
        if (i % 2 === 0) oddSum += digit;
        else evenSum += digit;
      }
      const checkDigit = (10 - ((oddSum + (evenSum * 3)) % 10)) % 10;
      finalBarcode = `${base}${checkDigit}`;
      
      const existing = await this.prisma.storeProductBarcode.findFirst({
        where: { barcode: finalBarcode, storeProduct: { storeId } }
      });
      if (!existing) isUnique = true;
    }
    
    return finalBarcode;
  }

  async resolveBarcode(data: any) { return { status: 'DEPRECATED' }; }
  async submitScanEvent(data: any) { return { status: 'DEPRECATED' }; }
  async batchSync(storeId: string, deviceId: string, events: any[]) { return { processed: 0, duplicates: 0, failed: [] }; }
  getWorkflows() { return { workflows: [] }; }
  async registerDevice(data: any) { return { success: true }; }
  async getScannerActivity(storeId: string, limit = 50) { return []; }
  async getDevices(storeId: string) { return []; }
  async deviceHeartbeat(deviceId: string) { return { success: true }; }
  
  async archiveProduct(userId: string, productId: string, storeId: string) {
    await this.productsService.updateStoreProduct(productId, storeId, {
      status: 'INACTIVE',
      updatedBy: userId,
    });
    return { success: true, status: 'ARCHIVED' };
  }
}
