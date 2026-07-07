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
const inventory_service_1 = require("../inventory/inventory.service");
const products_service_1 = require("../products/products.service");
const uuid_1 = require("uuid");
const library_1 = require("@prisma/client/runtime/library");
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
    inventoryService;
    productsService;
    constructor(prisma, cacheService, realtimeService, inventoryService, productsService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.realtimeService = realtimeService;
        this.inventoryService = inventoryService;
        this.productsService = productsService;
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
        if (cached)
            return cached;
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
            if (!sp)
                throw new Error('Not found');
            const pricing = sp.pricing?.[0];
            const tax = sp.taxProfile?.[0];
            const inventory = await this.inventoryService.getAvailableStock(storeId, sp.id);
            const quantityBase = inventory.onHand.toNumber();
            const barcodeData = sp.productBarcodes?.find(b => b.barcode === barcode);
            const conversion = 1;
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
                    unitName: 'PCS',
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
        }
        catch {
            return { found: false, action: 'CREATE_PRODUCT_DRAFT', barcode };
        }
    }
    async updateProduct(userId, productId, data) {
        const role = await this.checkPermission(userId, data.storeId);
        if (role === 'SCANNER_STAFF' || role === 'STAFF') {
            const sp = await this.prisma.storeProduct.findFirst({ where: { id: productId, storeId: data.storeId }, include: { productBarcodes: true } });
            if (!sp)
                throw new common_1.NotFoundException('StoreProduct not found');
            const draft = await this.prisma.pendingProduct.create({
                data: {
                    storeId: data.storeId,
                    barcode: sp.productBarcodes?.[0]?.barcode || '',
                    suggestedName: data.name,
                    suggestedBrand: data.brand,
                    suggestedCategory: data.category,
                    mrp: data.mrp != null ? new library_1.Decimal(data.mrp) : undefined,
                    sellingPrice: data.saleRateBaseUnit != null ? new library_1.Decimal(data.saleRateBaseUnit) : undefined,
                    purchasePrice: data.purchaseRateBaseUnit != null ? new library_1.Decimal(data.purchaseRateBaseUnit) : undefined,
                    gstRate: data.igstPercent != null ? new library_1.Decimal(data.igstPercent) : undefined,
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
            }
            else {
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
                    cgstRate: data.cgstPercent != null ? new library_1.Decimal(data.cgstPercent) : tax?.cgstRate,
                    sgstRate: data.sgstPercent != null ? new library_1.Decimal(data.sgstPercent) : tax?.sgstRate,
                    igstRate: data.igstPercent != null ? new library_1.Decimal(data.igstPercent) : tax?.igstRate,
                    gstRate: data.igstPercent != null ? new library_1.Decimal(data.igstPercent) : tax?.gstRate,
                    createdBy: userId,
                }
            });
        }
        await this.cacheService.delete(`store:${data.storeId}:product:${productId}`);
        return { success: true };
    }
    async updateStock(userId, data) {
        const quantityBase = data.quantityInput * data.conversionToBase;
        const isOutScan = ['DISPATCH', 'SALE', 'WASTE', 'WRITE_OFF', 'ADJUSTMENT_DOWN', 'SALE_RETURN'].includes(data.movementType);
        let movementType = 'MANUAL_ADJUSTMENT';
        if (data.movementType === 'SALE')
            movementType = 'POS_SALE';
        if (data.movementType === 'WASTE')
            movementType = 'DAMAGE_WRITE_OFF';
        if (data.movementType === 'SALE_RETURN')
            movementType = 'SALE_RETURN';
        if (data.movementType === 'STOCK_INTAKE')
            movementType = 'PURCHASE_RECEIPT';
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
                idempotencyKey: (0, uuid_1.v4)(),
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
    async createProductDraft(userId, data) {
        const existing = await this.prisma.storeProductBarcode.findFirst({
            where: { barcode: data.barcode, storeProduct: { storeId: data.storeId } }
        });
        if (existing) {
            throw new common_1.BadRequestException('Barcode already registered');
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
                openingBalance: new library_1.Decimal(finalData.openingBalance || 0),
                openingBalanceType: finalData.openingBalanceType
            }
        });
        await this.prisma.storeSupplierConnection.create({
            data: { storeId, supplierId: supplier.id, status: 'CONNECTED' }
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
                if (i % 2 === 0)
                    oddSum += digit;
                else
                    evenSum += digit;
            }
            const checkDigit = (10 - ((oddSum + (evenSum * 3)) % 10)) % 10;
            finalBarcode = `${base}${checkDigit}`;
            const existing = await this.prisma.storeProductBarcode.findFirst({
                where: { barcode: finalBarcode, storeProduct: { storeId } }
            });
            if (!existing)
                isUnique = true;
        }
        return finalBarcode;
    }
    async resolveBarcode(data) { return { status: 'DEPRECATED' }; }
    async submitScanEvent(data) { return { status: 'DEPRECATED' }; }
    async batchSync(storeId, deviceId, events) { return { processed: 0, duplicates: 0, failed: [] }; }
    getWorkflows() { return { workflows: [] }; }
    async registerDevice(data) { return { success: true }; }
    async getScannerActivity(storeId, limit = 50) { return []; }
    async getDevices(storeId) { return []; }
    async deviceHeartbeat(deviceId) { return { success: true }; }
    async archiveProduct(userId, productId, storeId) {
        await this.productsService.updateStoreProduct(productId, storeId, {
            status: 'INACTIVE',
            updatedBy: userId,
        });
        return { success: true, status: 'ARCHIVED' };
    }
};
exports.ScannerService = ScannerService;
exports.ScannerService = ScannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        realtime_service_1.RealtimeService,
        inventory_service_1.InventoryService,
        products_service_1.ProductsService])
], ScannerService);
//# sourceMappingURL=scanner.service.js.map