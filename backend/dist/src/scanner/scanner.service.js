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
exports.ScannerService = void 0;
exports.classifyBarcode = classifyBarcode;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const cache_service_1 = require("../cache/cache.service");
const realtime_service_1 = require("../realtime/realtime.service");
const uuid_1 = require("uuid");
function classifyBarcode(rawValue) {
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
let ScannerService = class ScannerService {
    prisma;
    cacheService;
    realtimeService;
    constructor(prisma, cacheService, realtimeService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.realtimeService = realtimeService;
    }
    async checkPermission(userId, storeId) {
        const roleRecord = await this.prisma.userStoreRole.findFirst({
            where: { userId, storeId, status: 'ACTIVE' },
        });
        if (!roleRecord) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user && (user.role === 'OWNER' || user.role === 'ORG_ADMIN')) {
                return user.role;
            }
            throw new common_1.ForbiddenException('User has no active role or access to this store');
        }
        return roleRecord.role;
    }
    async lookupBarcode(storeId, barcode, scanMode) {
        const cacheKey = `store:${storeId}:barcode:${barcode}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            console.log(`[Scanner] Cache HIT for barcode: ${barcode}`);
            return cached;
        }
        console.log(`[Scanner] Cache MISS for barcode: ${barcode}`);
        const barcodeEntry = await this.prisma.productBarcode.findFirst({
            where: { barcode, storeId, isActive: true },
            include: {
                product: {
                    include: {
                        inventory: { where: { storeId } },
                    }
                }
            }
        });
        if (!barcodeEntry || !barcodeEntry.product) {
            return {
                found: false,
                action: 'CREATE_PRODUCT_DRAFT',
                barcode,
            };
        }
        const product = barcodeEntry.product;
        const inventoryRecord = product.inventory[0];
        const quantityBase = inventoryRecord ? inventoryRecord.quantityBase : 0;
        const conversion = barcodeEntry.conversionToBase || product.conversionToBase || 1;
        const boxes = conversion > 1 ? Math.floor(quantityBase / conversion) : 0;
        const pcs = conversion > 1 ? quantityBase % conversion : quantityBase;
        const displayQuantity = conversion > 1 ? `${boxes} BOX + ${pcs} PCS` : `${pcs} PCS`;
        const response = {
            found: true,
            product: {
                id: product.id,
                name: product.name,
                brand: product.brand || 'General',
                category: product.category || 'General',
                hsnSac: product.hsnSac || '04039090',
                unit: product.unit || 'PCS',
                saleUnit: product.saleUnit || 'PCS',
                packing: product.packing || `BOX OF ${conversion}`,
                shelfLifeDays: product.shelfLifeDays || 258,
                status: product.status,
            },
            barcodeUnit: {
                barcodeType: barcodeEntry.barcodeType,
                unitName: barcodeEntry.unitName,
                conversionToBase: conversion,
            },
            pricing: {
                mrp: product.mrp,
                purchaseRateBaseUnit: product.purchaseRateBaseUnit || (product.purchaseRate || 0),
                purchaseRateInputUnit: product.purchaseRateInputUnit || ((product.purchaseRate || 0) * conversion),
                saleRateBaseUnit: product.saleRateBaseUnit || product.sellingPrice,
            },
            tax: {
                sgstPercent: product.sgstPercent || (product.gstRate / 2),
                cgstPercent: product.cgstPercent || (product.gstRate / 2),
                igstPercent: product.igstPercent || product.gstRate,
            },
            inventory: {
                quantityBase,
                displayQuantity,
                rackNo: inventoryRecord?.rackNo || 'A-12',
                reorderQtyBase: inventoryRecord ? inventoryRecord.lowStockThreshold : 15,
            },
            allowedActions: ['STOCK_INTAKE', 'BOX_INTAKE', 'ADJUST_STOCK', 'ARCHIVE']
        };
        await this.cacheService.set(cacheKey, response, 3600);
        return response;
    }
    async updateProduct(userId, productId, data) {
        const role = await this.checkPermission(userId, data.storeId);
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product || product.storeId !== data.storeId) {
            throw new common_1.NotFoundException('Product not found in this store');
        }
        if (data.mrp !== undefined && data.mrp <= 0) {
            throw new common_1.BadRequestException('MRP must be positive');
        }
        if (data.sgstPercent !== undefined && data.cgstPercent !== undefined && data.igstPercent !== undefined) {
            if (data.sgstPercent + data.cgstPercent !== data.igstPercent) {
                throw new common_1.BadRequestException('CGST + SGST must equal IGST');
            }
        }
        if (data.hsnSac !== undefined && !/^\d{6,8}$/.test(data.hsnSac)) {
            throw new common_1.BadRequestException('HSN/SAC format is invalid (must be 6-8 digits)');
        }
        if (role === 'SCANNER_STAFF' || role === 'STAFF') {
            const draft = await this.prisma.pendingProduct.create({
                data: {
                    storeId: data.storeId,
                    barcode: product.barcode,
                    suggestedName: data.name || product.name,
                    suggestedBrand: data.brand || product.brand,
                    suggestedCategory: data.category || product.category,
                    mrp: data.mrp || product.mrp,
                    sellingPrice: data.saleRateBaseUnit || product.sellingPrice,
                    purchasePrice: data.purchaseRateBaseUnit || product.purchaseRate,
                    gstRate: data.igstPercent || product.gstRate,
                    createdById: userId,
                    status: 'PENDING_REVIEW',
                    notes: `Staff requested updates. Rack: ${data.rackNo || product.rackNo}. HSN: ${data.hsnSac || product.hsnSac}`,
                },
            });
            return {
                draftId: draft.id,
                status: draft.status,
                message: 'Changes queued for Manager approval.',
            };
        }
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: {
                mrp: data.mrp ?? product.mrp,
                sellingPrice: data.saleRateBaseUnit ?? product.sellingPrice,
                purchaseRate: data.purchaseRateBaseUnit ?? product.purchaseRate,
                purchaseRateBaseUnit: data.purchaseRateBaseUnit ?? product.purchaseRateBaseUnit,
                purchaseRateInputUnit: data.purchaseRateBaseUnit ? (data.purchaseRateBaseUnit * (product.conversionToBase || 15)) : product.purchaseRateInputUnit,
                saleRateBaseUnit: data.saleRateBaseUnit ?? product.saleRateBaseUnit,
                hsnSac: data.hsnSac ?? product.hsnSac,
                sgstPercent: data.sgstPercent ?? product.sgstPercent,
                cgstPercent: data.cgstPercent ?? product.cgstPercent,
                igstPercent: data.igstPercent ?? product.igstPercent,
                gstRate: data.igstPercent ?? product.gstRate,
            },
        });
        let updatedRackNo = 'A-12';
        if (data.rackNo) {
            const inventory = await this.prisma.inventory.findFirst({ where: { storeId: data.storeId, productId } });
            if (inventory) {
                await this.prisma.inventory.update({ where: { id: inventory.id }, data: { rackNo: data.rackNo } });
                updatedRackNo = data.rackNo;
            }
        }
        if (product.barcode) {
            await this.cacheService.delete(`store:${data.storeId}:barcode:${product.barcode}`);
        }
        await this.cacheService.delete(`store:${data.storeId}:product:${productId}`);
        await this.realtimeService.broadcastInventoryUpdate(data.storeId, productId, {
            name: updated.name,
            mrp: updated.mrp,
            sellingPrice: updated.sellingPrice,
            rackNo: updatedRackNo,
        });
        return { success: true, product: updated };
    }
    async updateStock(userId, data) {
        const quantityBase = data.quantityInput * data.conversionToBase;
        const product = await this.prisma.product.findUnique({
            where: { id: data.productId },
        });
        if (!product || product.storeId !== data.storeId) {
            throw new common_1.NotFoundException('Product not found in this store');
        }
        let inventory = await this.prisma.inventory.findFirst({
            where: { storeId: data.storeId, productId: data.productId, batchNo: data.batchNo || null },
        });
        if (!inventory) {
            inventory = await this.prisma.inventory.create({
                data: {
                    storeId: data.storeId,
                    productId: data.productId,
                    batchNo: data.batchNo || null,
                    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                    quantityBase: 0,
                },
            });
        }
        const isOutScan = ['DISPATCH', 'SALE', 'WASTE', 'WRITE_OFF', 'ADJUSTMENT_DOWN', 'SALE_RETURN'].includes(data.movementType);
        const finalQuantityChange = isOutScan ? -Math.abs(quantityBase) : Math.abs(quantityBase);
        if (isOutScan && !product.allowNegativeStock) {
            const remainingStock = inventory.quantityBase + finalQuantityChange;
            const minimumQty = inventory.minimumQtyBase || product.minimumQty || 0;
            if (remainingStock < minimumQty) {
                throw new common_1.BadRequestException(`Cannot dispatch. Remaining stock (${remainingStock}) would fall below minimum reserve quantity (${minimumQty})`);
            }
        }
        const movement = await this.prisma.stockMovement.create({
            data: {
                storeId: data.storeId,
                productId: data.productId,
                inventoryId: inventory.id,
                createdBy: userId,
                type: data.movementType,
                quantityDeltaBase: finalQuantityChange,
                previousQuantityBase: inventory.quantityBase,
                newQuantityBase: inventory.quantityBase + finalQuantityChange,
                inputQuantity: data.quantityInput,
                inputUnit: data.inputUnit,
                conversionToBase: data.conversionToBase,
                supplierId: data.supplierId,
                note: data.note || `${isOutScan ? 'Out' : 'In'} scan: ${data.quantityInput} ${data.inputUnit}`,
            },
        });
        const updatedInventory = await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: {
                quantityBase: {
                    increment: finalQuantityChange,
                },
                onHandQty: {
                    increment: finalQuantityChange,
                }
            },
        });
        await this.prisma.scannerEvent.create({
            data: {
                storeId: data.storeId,
                scannedById: userId,
                workflow: 'PRODUCT_INTAKE',
                rawValue: product.barcode || '',
                symbology: 'EAN_13',
                resolutionStatus: 'FOUND',
                idempotencyKey: (0, uuid_1.v4)(),
                quantity: finalQuantityChange,
                metadata: {
                    movementType: data.movementType,
                    inputUnit: data.inputUnit,
                    batchNo: data.batchNo,
                },
            },
        });
        if (product.barcode) {
            await this.cacheService.delete(`store:${data.storeId}:barcode:${product.barcode}`);
        }
        const boxes = Math.floor(updatedInventory.quantityBase / (product.conversionToBase || 15));
        const pcs = updatedInventory.quantityBase % (product.conversionToBase || 15);
        const displayQuantity = `${boxes} BOX + ${pcs} PCS`;
        await this.realtimeService.broadcastInventoryUpdate(data.storeId, data.productId, {
            quantityBase: updatedInventory.quantityBase,
            displayQuantity,
        });
        return {
            success: true,
            quantityBase,
            newStockLevel: updatedInventory.quantityBase,
        };
    }
    async createProductDraft(userId, data) {
        const existing = await this.prisma.productBarcode.findFirst({
            where: { storeId: data.storeId, barcode: data.barcode }
        });
        if (existing) {
            throw new common_1.BadRequestException('Barcode already registered');
        }
        const product = await this.prisma.$transaction(async (tx) => {
            const prod = await tx.product.create({
                data: {
                    storeId: data.storeId,
                    skuCode: `SKU-${Date.now()}`,
                    name: data.productName,
                    brand: data.brand || null,
                    category: data.category || null,
                    hsnSac: data.hsnSac || null,
                    unit: data.baseUnit,
                    saleUnit: data.baseUnit,
                    mrp: data.mrp,
                    sellingPrice: data.mrp,
                    gstRate: data.gstRate,
                    status: 'PENDING_APPROVAL',
                    isArchived: false,
                    createdFromBarcode: data.barcode,
                    createdBy: userId,
                    inventory: {
                        create: {
                            storeId: data.storeId,
                            quantityBase: 0,
                        }
                    }
                }
            });
            await tx.productBarcode.create({
                data: {
                    storeId: data.storeId,
                    productId: prod.id,
                    barcode: data.barcode,
                    unitName: data.purchaseUnit || data.baseUnit,
                    conversionToBase: data.conversionToBase || 1,
                    isPrimary: true,
                }
            });
            await tx.productVersion.create({
                data: {
                    storeId: data.storeId,
                    productId: prod.id,
                    versionNo: 1,
                    snapshot: prod,
                    changedBy: userId,
                    changeReason: 'Initial Draft Registration'
                }
            });
            return prod;
        });
        return {
            draftId: product.id,
            status: product.status,
        };
    }
    async confirmProductExtraction(userId, extractionId, storeId, finalData) {
        const extraction = await this.prisma.scannerExtraction.findUnique({
            where: { id: extractionId }
        });
        if (!extraction || extraction.storeId !== storeId) {
            throw new common_1.NotFoundException('Extraction not found');
        }
        await this.prisma.scannerExtraction.update({
            where: { id: extractionId },
            data: { status: 'CONFIRMED' }
        });
        const product = await this.prisma.product.create({
            data: {
                storeId,
                skuCode: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: finalData.productName || 'Unknown Product',
                mrp: Number(finalData.mrp) || 0,
                sellingPrice: Number(finalData.mrp) || 0,
                hsnSac: finalData.hsnSac,
                unit: finalData.unit,
                company: finalData.company,
                category: finalData.category,
                sgstPercent: Number(finalData.sgstPercent) || 0,
                cgstPercent: Number(finalData.cgstPercent) || 0,
                igstPercent: Number(finalData.igstPercent) || 0,
                shelfLifeDays: Number(finalData.shelfLifeDays) || null,
                source: 'scanner'
            }
        });
        if (finalData.productCode) {
            await this.prisma.barcodeRegistry.create({
                data: {
                    storeId,
                    productId: product.id,
                    barcodeValue: finalData.productCode,
                    symbology: 'EAN_13',
                    barcodeScope: 'GS1_EXTERNAL_PRODUCT'
                }
            });
        }
        return product;
    }
    async confirmSupplierExtraction(userId, extractionId, storeId, finalData) {
        const extraction = await this.prisma.scannerExtraction.findUnique({
            where: { id: extractionId }
        });
        if (!extraction || extraction.storeId !== storeId) {
            throw new common_1.NotFoundException('Extraction not found');
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
                openingBalance: Number(finalData.openingBalance) || 0,
                openingBalanceType: finalData.openingBalanceType
            }
        });
        await this.prisma.storeSupplierConnection.create({
            data: {
                storeId,
                supplierId: supplier.id,
                status: 'CONNECTED'
            }
        });
        return supplier;
    }
    async generateInternalBarcode(storeId) {
        let isUnique = false;
        let finalBarcode = '';
        while (!isUnique) {
            const random10 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
            const base = `02${random10}`;
            let oddSum = 0;
            let evenSum = 0;
            for (let i = 0; i < 12; i++) {
                const digit = parseInt(base[i], 10);
                if (i % 2 === 0) {
                    oddSum += digit;
                }
                else {
                    evenSum += digit;
                }
            }
            const totalSum = oddSum + (evenSum * 3);
            const checkDigit = (10 - (totalSum % 10)) % 10;
            finalBarcode = `${base}${checkDigit}`;
            const existing = await this.prisma.product.findFirst({
                where: { barcode: finalBarcode, storeId }
            });
            if (!existing) {
                isUnique = true;
            }
        }
        return finalBarcode;
    }
    async resolveBarcode(data) {
        return { status: 'DEPRECATED' };
    }
    async submitScanEvent(data) {
        return { status: 'DEPRECATED' };
    }
    async batchSync(storeId, deviceId, events) {
        return { processed: 0, duplicates: 0, failed: [] };
    }
    getWorkflows() {
        return { workflows: [] };
    }
    async registerDevice(data) {
        return { success: true };
    }
    async getScannerActivity(storeId, limit = 50) {
        return [];
    }
    async getDevices(storeId) {
        return [];
    }
    async deviceHeartbeat(deviceId) {
        return { success: true };
    }
    async archiveProduct(userId, productId, storeId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product || product.storeId !== storeId) {
            throw new common_1.NotFoundException('Product not found in this store');
        }
        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: {
                status: 'ARCHIVED',
                isArchived: true,
                isActive: false,
                archivedAt: new Date(),
            }
        });
        await this.prisma.productVersion.create({
            data: {
                storeId,
                productId,
                versionNo: Date.now(),
                snapshot: updated,
                changedBy: userId,
                changeReason: 'Archived from scanner'
            }
        });
        if (product.barcode) {
            await this.cacheService.delete(`store:${storeId}:barcode:${product.barcode}`);
        }
        return { success: true, status: 'ARCHIVED' };
    }
};
exports.ScannerService = ScannerService;
exports.ScannerService = ScannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        realtime_service_1.RealtimeService])
], ScannerService);
//# sourceMappingURL=scanner.service.js.map