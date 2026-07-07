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
        const product = await this.prisma.product.findFirst({
            where: { barcode, storeId, isActive: true },
            include: {
                inventory: {
                    where: { storeId },
                },
            },
        });
        if (!product) {
            return {
                found: false,
                action: 'CREATE_PRODUCT_DRAFT',
                barcode,
            };
        }
        const inventoryRecord = product.inventory[0];
        const quantityBase = inventoryRecord ? inventoryRecord.onHandQty : 0;
        const conversion = product.conversionToBase || 15;
        const boxes = Math.floor(quantityBase / conversion);
        const pcs = quantityBase % conversion;
        const displayQuantity = `${boxes} BOX + ${pcs} PCS`;
        const response = {
            found: true,
            product: {
                id: product.id,
                name: product.name,
                brand: product.brand || 'General',
                category: product.category || 'General',
                hsnSac: product.hsnSac || '04039090',
                baseUnit: product.baseUnit || 'PCS',
                saleUnit: product.saleUnit || 'PCS',
                packing: product.packing || `BOX OF ${conversion}`,
                shelfLifeDays: product.shelfLifeDays || 258,
            },
            barcodeUnit: {
                barcodeType: 'BOX',
                unitName: 'BOX',
                conversionToBase: conversion,
            },
            pricing: {
                mrp: product.mrp,
                purchaseRateBaseUnit: product.purchaseRateBaseUnit || (product.purchaseCost || 0),
                purchaseRateInputUnit: product.purchaseRateInputUnit || ((product.purchaseCost || 0) * conversion),
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
                    purchasePrice: data.purchaseRateBaseUnit || product.purchaseCost,
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
                purchaseCost: data.purchaseRateBaseUnit ?? product.purchaseCost,
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
                    onHandQty: 0,
                },
            });
        }
        const updatedInventory = await this.prisma.inventory.update({
            where: { id: inventory.id },
            data: {
                onHandQty: {
                    increment: quantityBase,
                },
            },
        });
        await this.prisma.stockMovement.create({
            data: {
                storeId: data.storeId,
                productId: data.productId,
                inventoryId: inventory.id,
                staffId: userId,
                type: data.movementType,
                quantityChange: quantityBase,
                reason: data.note || `Intake: ${data.quantityInput} ${data.inputUnit}`,
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
                quantity: quantityBase,
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
        const boxes = Math.floor(updatedInventory.onHandQty / (product.conversionToBase || 15));
        const pcs = updatedInventory.onHandQty % (product.conversionToBase || 15);
        const displayQuantity = `${boxes} BOX + ${pcs} PCS`;
        await this.realtimeService.broadcastInventoryUpdate(data.storeId, data.productId, {
            quantityBase: updatedInventory.onHandQty,
            displayQuantity,
        });
        return {
            success: true,
            quantityBase,
            newStockLevel: updatedInventory.onHandQty,
        };
    }
    async createProductDraft(userId, data) {
        const draft = await this.prisma.pendingProduct.create({
            data: {
                storeId: data.storeId,
                barcode: data.barcode,
                suggestedName: data.productName,
                suggestedBrand: data.brand || 'General',
                suggestedCategory: data.category || 'General',
                mrp: data.mrp,
                sellingPrice: data.mrp,
                gstRate: data.gstRate,
                createdById: userId,
                status: 'PENDING_REVIEW',
                notes: `New scanner onboard. HSN: ${data.hsnSac}. Purchase Unit: ${data.purchaseUnit}. Conversion: ${data.conversionToBase}`,
            },
        });
        return {
            draftId: draft.id,
            status: draft.status,
        };
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
};
exports.ScannerService = ScannerService;
exports.ScannerService = ScannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        realtime_service_1.RealtimeService])
], ScannerService);
//# sourceMappingURL=scanner.service.js.map