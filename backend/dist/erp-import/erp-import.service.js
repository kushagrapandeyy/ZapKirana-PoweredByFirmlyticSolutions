"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const erp_validation_service_1 = require("./erp-validation.service");
const client_1 = require("@prisma/client");
let ErpImportService = class ErpImportService {
    prisma;
    validator;
    constructor(prisma, validator) {
        this.prisma = prisma;
        this.validator = validator;
    }
    async dryRunProductImport(storeId, rows, uploadedBy) {
        const batch = await this.prisma.importBatch.create({
            data: {
                storeId,
                legacySystem: client_1.LegacySystem.MARG_ERP,
                entityType: client_1.ImportEntityType.PRODUCT,
                status: client_1.ImportBatchStatus.DRY_RUN,
                totalRows: rows.length,
                uploadedBy,
            },
        });
        const results = [];
        let validCount = 0;
        let invalidCount = 0;
        let duplicateCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const errors = this.validator.validateProductRow(row);
            const hasErrors = errors.some(e => e.severity === 'ERROR');
            const hasWarnings = errors.some(e => e.severity === 'WARNING');
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
            if (status === 'VALID' || status === 'WARNING')
                validCount++;
            if (status === 'INVALID')
                invalidCount++;
            const importRow = await this.prisma.importRow.create({
                data: {
                    importBatchId: batch.id,
                    storeId,
                    rowNumber: i + 1,
                    rawData: row,
                    validationStatus: status,
                    isDuplicate,
                },
            });
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
        await this.prisma.importBatch.update({
            where: { id: batch.id },
            data: {
                validRows: validCount,
                invalidRows: invalidCount,
                duplicateRows: duplicateCount,
                status: client_1.ImportBatchStatus.DRY_RUN_DONE,
            },
        });
        return {
            batchId: batch.id,
            summary: { total: rows.length, valid: validCount, invalid: invalidCount, duplicates: duplicateCount },
            results,
        };
    }
    async confirmProductImport(storeId, batchId, confirmedBy) {
        const batch = await this.prisma.importBatch.findFirst({
            where: { id: batchId, storeId, status: client_1.ImportBatchStatus.DRY_RUN_DONE },
            include: { rows: { where: { validationStatus: { in: ['VALID', 'WARNING'] }, isDuplicate: false } } },
        });
        if (!batch)
            throw new common_1.NotFoundException('Batch not found or not in DRY_RUN_DONE state');
        let importedCount = 0;
        const columnMap = this.validator.getMargProductColumnMap();
        for (const row of batch.rows) {
            const raw = row.rawData;
            try {
                await this.prisma.$transaction(async (tx) => {
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
                    let brandId;
                    if (raw.COMPANY) {
                        const brand = await tx.brand.upsert({
                            where: { name: raw.COMPANY.trim() },
                            create: { name: raw.COMPANY.trim(), normalizedName: raw.COMPANY.toLowerCase().trim() },
                            update: {},
                        });
                        brandId = brand.id;
                        if (brandId)
                            await tx.product.update({ where: { id: product.id }, data: { brandId } });
                    }
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
                    if (raw.BARCODE) {
                        await tx.storeProductBarcode.upsert({
                            where: { storeProductId_barcode: { storeProductId: storeProduct.id, barcode: raw.BARCODE } },
                            create: { storeProductId: storeProduct.id, barcode: raw.BARCODE, isPrimary: true, source: 'erp_import' },
                            update: {},
                        });
                    }
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
                    if (raw.RACK_NO ?? raw['RACK NO']) {
                        await tx.productRackLocation.create({
                            data: {
                                storeProductId: storeProduct.id,
                                rackNo: raw.RACK_NO ?? raw['RACK NO'],
                            },
                        });
                    }
                    await tx.legacyEntityMapping.upsert({
                        where: {
                            storeId_legacySystem_legacyEntityType_legacyEntityId: {
                                storeId,
                                legacySystem: client_1.LegacySystem.MARG_ERP,
                                legacyEntityType: client_1.ImportEntityType.PRODUCT,
                                legacyEntityId: raw.CODE ?? `ROW_${row.rowNumber}`,
                            },
                        },
                        create: {
                            storeId,
                            importBatchId: batch.id,
                            legacySystem: client_1.LegacySystem.MARG_ERP,
                            legacyEntityType: client_1.ImportEntityType.PRODUCT,
                            legacyEntityId: raw.CODE ?? `ROW_${row.rowNumber}`,
                            rawLegacyPayload: raw,
                            zapKirnanaEntityType: 'StoreProduct',
                            zapKirnanaEntityId: storeProduct.id,
                        },
                        update: {},
                    });
                    await tx.importRow.update({
                        where: { id: row.id },
                        data: { validationStatus: 'IMPORTED', resolvedEntityId: storeProduct.id },
                    });
                });
                importedCount++;
            }
            catch (err) {
                await this.prisma.importRow.update({
                    where: { id: row.id },
                    data: { validationStatus: 'INVALID' },
                });
            }
        }
        await this.prisma.importBatch.update({
            where: { id: batchId },
            data: { status: client_1.ImportBatchStatus.CONFIRMED, importedRows: importedCount, confirmedBy, confirmedAt: new Date() },
        });
        return { batchId, importedRows: importedCount, status: 'CONFIRMED' };
    }
    async dryRunSupplierImport(storeId, rows, uploadedBy) {
        const batch = await this.prisma.importBatch.create({
            data: {
                storeId,
                legacySystem: client_1.LegacySystem.MARG_ERP,
                entityType: client_1.ImportEntityType.LEDGER,
                status: client_1.ImportBatchStatus.DRY_RUN,
                totalRows: rows.length,
                uploadedBy,
            },
        });
        const results = [];
        let validCount = 0, invalidCount = 0, duplicateCount = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const errors = this.validator.validateSupplierRow(row);
            const hasErrors = errors.some(e => e.severity === 'ERROR');
            let isDuplicate = false;
            if (row.LEDGER_NAME ?? row['Ledger Name']) {
                const name = row.LEDGER_NAME ?? row['Ledger Name'];
                const existing = await this.prisma.partyLedger.findFirst({ where: { storeId, name: name.trim() } });
                if (existing) {
                    isDuplicate = true;
                    duplicateCount++;
                }
            }
            const status = isDuplicate ? 'DUPLICATE' : hasErrors ? 'INVALID' : 'VALID';
            if (!isDuplicate && !hasErrors)
                validCount++;
            if (hasErrors)
                invalidCount++;
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
            data: { validRows: validCount, invalidRows: invalidCount, duplicateRows: duplicateCount, status: client_1.ImportBatchStatus.DRY_RUN_DONE },
        });
        return { batchId: batch.id, summary: { total: rows.length, valid: validCount, invalid: invalidCount, duplicates: duplicateCount }, results };
    }
};
exports.ErpImportService = ErpImportService;
exports.ErpImportService = ErpImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        erp_validation_service_1.ErpValidationService])
], ErpImportService);
//# sourceMappingURL=erp-import.service.js.map