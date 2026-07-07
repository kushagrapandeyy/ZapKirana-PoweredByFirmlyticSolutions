import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ErpValidationService } from './erp-validation.service';
import { LegacySystem, ImportEntityType, ImportBatchStatus } from '@prisma/client';

@Injectable()
export class ErpImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ErpValidationService,
  ) {}

  // =====================================================
  // PRODUCT MASTER DRY RUN
  // =====================================================

  async dryRunProductImport(storeId: string, rows: any[], uploadedBy: string) {
    // Create import batch in DRY_RUN state
    const batch = await this.prisma.importBatch.create({
      data: {
        storeId,
        legacySystem: LegacySystem.MARG_ERP,
        entityType: ImportEntityType.PRODUCT,
        status: ImportBatchStatus.DRY_RUN,
        totalRows: rows.length,
        uploadedBy,
      },
    });

    const results: {
      rowNumber: number;
      legacyCode: string;
      productName: string;
      status: 'VALID' | 'INVALID' | 'DUPLICATE' | 'WARNING';
      errors: any[];
    }[] = [];

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors = this.validator.validateProductRow(row);

      const hasErrors = errors.some(e => e.severity === 'ERROR');
      const hasWarnings = errors.some(e => e.severity === 'WARNING');

      // Check for duplicate legacyCode in this store
      let isDuplicate = false;
      if (row.CODE) {
        const existing = await this.prisma.storeProduct.findUnique({
          where: { storeId_legacyCode: { storeId, legacyCode: row.CODE } },
        });
        if (existing) {
          isDuplicate = true;
          duplicateCount++;
        }
      }

      const status = isDuplicate ? 'DUPLICATE' : hasErrors ? 'INVALID' : hasWarnings ? 'WARNING' : 'VALID';
      if (status === 'VALID' || status === 'WARNING') validCount++;
      if (status === 'INVALID') invalidCount++;

      // Save import row with full raw data preserved
      const importRow = await this.prisma.importRow.create({
        data: {
          importBatchId: batch.id,
          storeId,
          rowNumber: i + 1,
          rawData: row, // Full original row — never modified
          validationStatus: status,
          isDuplicate,
        },
      });

      // Save validation errors
      if (errors.length > 0) {
        await this.prisma.importValidationError.createMany({
          data: errors.map(e => ({
            importRowId: importRow.id,
            field: e.field,
            legacyValue: e.legacyValue,
            errorCode: e.errorCode,
            errorMessage: e.errorMessage,
            severity: e.severity,
          })),
        });
      }

      results.push({
        rowNumber: i + 1,
        legacyCode: row.CODE ?? `ROW_${i + 1}`,
        productName: row.PRODUCT ?? '',
        status,
        errors,
      });
    }

    // Update batch counts
    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        validRows: validCount,
        invalidRows: invalidCount,
        duplicateRows: duplicateCount,
        status: ImportBatchStatus.DRY_RUN_DONE,
      },
    });

    return {
      batchId: batch.id,
      summary: { total: rows.length, valid: validCount, invalid: invalidCount, duplicates: duplicateCount },
      results,
    };
  }

  // =====================================================
  // PRODUCT MASTER CONFIRM
  // =====================================================

  async confirmProductImport(storeId: string, batchId: string, confirmedBy: string) {
    const batch = await this.prisma.importBatch.findFirst({
      where: { id: batchId, storeId, status: ImportBatchStatus.DRY_RUN_DONE },
      include: { rows: { where: { validationStatus: { in: ['VALID', 'WARNING'] }, isDuplicate: false } } },
    });

    if (!batch) throw new NotFoundException('Batch not found or not in DRY_RUN_DONE state');

    let importedCount = 0;
    const columnMap = this.validator.getMargProductColumnMap();

    for (const row of batch.rows) {
      const raw = row.rawData as Record<string, string>;

      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Resolve or create global Product
          let product = raw.BARCODE
            ? await tx.product.findFirst({ where: { productBarcodes: { some: { barcode: raw.BARCODE } } } })
            : null;

          if (!product) {
            product = await tx.product.create({
              data: {
                name: raw.PRODUCT ?? 'Unknown Product',
                normalizedName: (raw.PRODUCT ?? '').toLowerCase().trim(),
                baseUnit: raw.UNIT ?? 'PCS',
                hsnSacCode: raw.HSN_SAC ?? raw['HSN/SAC'],
                itemType: raw.ITEM_TYPE ?? raw['ITEM TYPE'],
                productType: raw.TYPE ?? 'NORMAL',
                packagingDescription: raw.PACKING,
                allowDecimalQuantity: this.validator.parseBooleanFromMarg(raw.DECIMAL),
              },
            });
          }

          // 2. Resolve Brand
          let brandId: string | undefined;
          if (raw.COMPANY) {
            const brand = await tx.brand.upsert({
              where: { name: raw.COMPANY.trim() },
              create: { name: raw.COMPANY.trim(), normalizedName: raw.COMPANY.toLowerCase().trim() },
              update: {},
            });
            brandId = brand.id;
            if (brandId) await tx.product.update({ where: { id: product.id }, data: { brandId } });
          }

          // 3. Create StoreProduct
          const storeProduct = await tx.storeProduct.upsert({
            where: { storeId_legacyCode: { storeId, legacyCode: raw.CODE } },
            create: {
              storeId,
              productId: product.id,
              legacyCode: raw.CODE,
              displayName: raw.PRODUCT,
              status: raw.STATUS ?? 'ACTIVE',
              type: raw.TYPE,
              itemType: raw.ITEM_TYPE ?? raw['ITEM TYPE'],
              isHidden: this.validator.parseBooleanFromMarg(raw.HIDE),
              allowDecimalQty: this.validator.parseBooleanFromMarg(raw.DECIMAL),
              packagingText: raw.PACKING,
              colorType: raw.COLOR_TYPE ?? raw['COLOR TYPE'],
              manufacturerLegacyRef: raw.MANUFACTURER_F3 ?? raw['MANUFACTURER F3'],
              source: 'erp_import',
              createdBy: confirmedBy,
            },
            update: {
              updatedBy: confirmedBy,
            },
          });

          // 4. Create barcode
          if (raw.BARCODE) {
            await tx.storeProductBarcode.upsert({
              where: { storeProductId_barcode: { storeProductId: storeProduct.id, barcode: raw.BARCODE } },
              create: { storeProductId: storeProduct.id, barcode: raw.BARCODE, isPrimary: true, source: 'erp_import' },
              update: {},
            });
          }

          // 5. Create Pricing
          const mrp = this.validator.parseDecimalSafe(raw.MRP ?? raw['M.R.P.']);
          const rateA = this.validator.parseDecimalSafe(raw.RATE_A ?? raw['Rate-A']);
          const rateB = this.validator.parseDecimalSafe(raw.RATE_B ?? raw['Rate-B']);
          const rateC = this.validator.parseDecimalSafe(raw.RATE_C ?? raw['Rate-C']);
          const purchaseRate = this.validator.parseDecimalSafe(raw.P_RATE ?? raw['P.RATE']);
          const costPerPiece = this.validator.parseDecimalSafe(raw.COST_PCS ?? raw['COST/PCS']);

          await tx.storeProductPricing.create({
            data: {
              storeProductId: storeProduct.id,
              mrp: mrp ?? undefined,
              sellingPrice: rateA ?? mrp ?? undefined,
              rateA: rateA ?? undefined,
              rateB: rateB ?? undefined,
              rateC: rateC ?? undefined,
              purchaseRate: purchaseRate ?? undefined,
              costPerPiece: costPerPiece ?? undefined,
              createdBy: confirmedBy,
            },
          });

          // 6. Create Tax Profile
          const cgst = this.validator.parseDecimalSafe(raw.CGST ?? raw['CGST %']);
          const sgst = this.validator.parseDecimalSafe(raw.SGST ?? raw['SGST %']);
          const igst = this.validator.parseDecimalSafe(raw.IGST ?? raw['IGST %']);
          const cess = this.validator.parseDecimalSafe(raw.CESS ?? raw['CESS %']);

          await tx.productTaxProfile.create({
            data: {
              storeProductId: storeProduct.id,
              hsnSacCode: raw.HSN_SAC ?? raw['HSN/SAC'],
              localTaxabilityStatus: raw.LOCAL_TAX_STATUS ?? raw['LOCAL TAX STATUS'],
              centralTaxabilityStatus: raw.CENTRAL_TAX_STATUS ?? raw['CENTRAL TAX STATUS'],
              isTaxable: true,
              gstRate: cgst && sgst ? cgst + sgst : undefined,
              cgstRate: cgst ?? undefined,
              sgstRate: sgst ?? undefined,
              igstRate: igst ?? undefined,
              cessRate: cess ?? undefined,
              createdBy: confirmedBy,
            },
          });

          // 7. Create Inventory Policy
          await tx.productInventoryPolicy.upsert({
            where: { storeProductId: storeProduct.id },
            create: {
              storeProductId: storeProduct.id,
              allowNegativeStock: this.validator.parseBooleanFromMarg(raw.NEGATIVE),
              minimumQty: this.validator.parseDecimalSafe(raw.MINIMUM_QTY ?? raw['MINIMUM QTY']) ?? undefined,
              maximumQty: this.validator.parseDecimalSafe(raw.MAXIMUM_QTY ?? raw['MAXIMUM QTY']) ?? undefined,
              reorderQty: this.validator.parseDecimalSafe(raw.REORDER_QTY ?? raw['REORDER QTY']) ?? undefined,
              defaultSaleQty: this.validator.parseDecimalSafe(raw.DEFAULT_SALE_QTY ?? raw['DEFAULT SALE QTY']) ?? undefined,
              boxConversionQty: this.validator.parseDecimalSafe(raw.CONV_BOX ?? raw['CONV.BOX']) ?? undefined,
              shelfLifeDays: raw.SHELFLIFE ? parseInt(raw.SHELFLIFE) : undefined,
              stockUom: raw.UNIT ?? 'PCS',
              purchaseUom: raw.UNIT ?? 'PCS',
              saleUom: raw.UNIT ?? 'PCS',
              createdBy: confirmedBy,
            },
            update: {},
          });

          // 8. Create Discount Policy
          await tx.productDiscountPolicy.upsert({
            where: { storeProductId: storeProduct.id },
            create: {
              storeProductId: storeProduct.id,
              discountApplicable: this.validator.parseBooleanFromMarg(raw.DISCOUNT ?? raw['DISCOUNT']),
              itemDiscount1Percent: this.validator.parseDecimalSafe(raw.ITEM_DISC_1 ?? raw['ITEM DISC-1']) ?? undefined,
              itemDiscount2Percent: this.validator.parseDecimalSafe(raw.DISC_2 ?? raw['DISC-2']) ?? undefined,
              specialDiscountPercent: this.validator.parseDecimalSafe(raw.SPECIAL_DISC ?? raw['SPECIAL DISC']) ?? undefined,
              maximumDiscountPercent: this.validator.parseDecimalSafe(raw.MAX_DISC_PERCENT ?? raw['MAXIMUM DISCOUNT %']) ?? undefined,
              rateOverrideAllowed: this.validator.parseBooleanFromMarg(raw['F6/RATE ±']),
              createdBy: confirmedBy,
            },
            update: {},
          });

          // 9. Create Rack Location
          if (raw.RACK_NO ?? raw['RACK NO']) {
            await tx.productRackLocation.create({
              data: {
                storeProductId: storeProduct.id,
                rackNo: raw.RACK_NO ?? raw['RACK NO'],
              },
            });
          }

          // 10. Store LegacyEntityMapping — full raw payload forever
          await tx.legacyEntityMapping.upsert({
            where: {
              storeId_legacySystem_legacyEntityType_legacyEntityId: {
                storeId,
                legacySystem: LegacySystem.MARG_ERP,
                legacyEntityType: ImportEntityType.PRODUCT,
                legacyEntityId: raw.CODE ?? `ROW_${row.rowNumber}`,
              },
            },
            create: {
              storeId,
              importBatchId: batch.id,
              legacySystem: LegacySystem.MARG_ERP,
              legacyEntityType: ImportEntityType.PRODUCT,
              legacyEntityId: raw.CODE ?? `ROW_${row.rowNumber}`,
              rawLegacyPayload: raw, // Full original data
              zapKirnanaEntityType: 'StoreProduct',
              zapKirnanaEntityId: storeProduct.id,
            },
            update: {},
          });

          // Mark row as imported
          await tx.importRow.update({
            where: { id: row.id },
            data: { validationStatus: 'IMPORTED', resolvedEntityId: storeProduct.id },
          });
        });

        importedCount++;
      } catch (err) {
        // Mark row as failed but continue processing others
        await this.prisma.importRow.update({
          where: { id: row.id },
          data: { validationStatus: 'INVALID' },
        });
      }
    }

    await this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: ImportBatchStatus.CONFIRMED, importedRows: importedCount, confirmedBy, confirmedAt: new Date() },
    });

    return { batchId, importedRows: importedCount, status: 'CONFIRMED' };
  }

  // =====================================================
  // SUPPLIER / LEDGER DRY RUN
  // =====================================================

  async dryRunSupplierImport(storeId: string, rows: any[], uploadedBy: string) {
    const batch = await this.prisma.importBatch.create({
      data: {
        storeId,
        legacySystem: LegacySystem.MARG_ERP,
        entityType: ImportEntityType.LEDGER,
        status: ImportBatchStatus.DRY_RUN,
        totalRows: rows.length,
        uploadedBy,
      },
    });

    const results: any[] = [];
    let validCount = 0, invalidCount = 0, duplicateCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const errors = this.validator.validateSupplierRow(row);
      const hasErrors = errors.some(e => e.severity === 'ERROR');

      let isDuplicate = false;
      if (row.LEDGER_NAME ?? row['Ledger Name']) {
        const name = row.LEDGER_NAME ?? row['Ledger Name'];
        const existing = await this.prisma.partyLedger.findFirst({ where: { storeId, name: name.trim() } });
        if (existing) { isDuplicate = true; duplicateCount++; }
      }

      const status = isDuplicate ? 'DUPLICATE' : hasErrors ? 'INVALID' : 'VALID';
      if (!isDuplicate && !hasErrors) validCount++;
      if (hasErrors) invalidCount++;

      const importRow = await this.prisma.importRow.create({
        data: { importBatchId: batch.id, storeId, rowNumber: i + 1, rawData: row, validationStatus: status, isDuplicate },
      });

      if (errors.length > 0) {
        await this.prisma.importValidationError.createMany({
          data: errors.map(e => ({ importRowId: importRow.id, field: e.field, legacyValue: e.legacyValue, errorCode: e.errorCode, errorMessage: e.errorMessage, severity: e.severity })),
        });
      }

      results.push({ rowNumber: i + 1, ledgerName: row.LEDGER_NAME ?? row['Ledger Name'] ?? '', status, errors });
    }

    await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: { validRows: validCount, invalidRows: invalidCount, duplicateRows: duplicateCount, status: ImportBatchStatus.DRY_RUN_DONE },
    });

    return { batchId: batch.id, summary: { total: rows.length, valid: validCount, invalid: invalidCount, duplicates: duplicateCount }, results };
  }
}
