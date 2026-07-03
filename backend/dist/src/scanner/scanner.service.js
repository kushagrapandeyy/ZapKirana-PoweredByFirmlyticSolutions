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
        const gtin = '0' + v;
        return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'EAN_13', gtin };
    }
    if (/^\d{8}$/.test(v)) {
        const gtin = '000000' + v;
        return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'EAN_8', gtin };
    }
    if (/^\d{12}$/.test(v)) {
        const gtin = '00' + v;
        return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'UPC_A', gtin };
    }
    if (/^\d{14}$/.test(v)) {
        return { scope: 'GS1_EXTERNAL_PRODUCT', rawValue: v, symbology: 'ITF_14', gtin: v };
    }
    return { scope: 'UNKNOWN', rawValue: v, symbology: 'UNKNOWN' };
}
const WORKFLOW_NEXT_ACTION = {
    GOODS_RECEIVING: { action: 'ENTER_RECEIVED_QUANTITY', requiresExpiry: true, requiresBatch: false },
    STOCK_AUDIT: { action: 'ENTER_COUNT', requiresExpiry: false, requiresBatch: false },
    PRODUCT_INTAKE: { action: 'CREATE_PENDING_PRODUCT', requiresExpiry: false, requiresBatch: false },
    LOOSE_ITEM_PACKING: { action: 'ENTER_PACK_QUANTITY', requiresExpiry: true, requiresBatch: false },
    ORDER_PICKING: { action: 'CONFIRM_PICKED', requiresExpiry: false, requiresBatch: false },
    SHELF_REFILL: { action: 'CONFIRM_REFILLED', requiresExpiry: false, requiresBatch: false },
    DAMAGED_EXPIRED: { action: 'ENTER_DAMAGED_QUANTITY', requiresExpiry: false, requiresBatch: false },
    LABEL_REPRINT: { action: 'SELECT_LABEL_TEMPLATE', requiresExpiry: false, requiresBatch: false },
    POS_BILLING: { action: 'ADD_TO_BILL', requiresExpiry: false, requiresBatch: false },
};
let ScannerService = class ScannerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolveBarcode(data) {
        const classified = classifyBarcode(data.rawValue);
        const symbology = classified.symbology;
        const parsedJson = { ...classified, workflow: data.workflow };
        let resolutionStatus = 'UNKNOWN_BARCODE';
        let product = null;
        let inventory = null;
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
        if (!product && classified.scope === 'GS1_EXTERNAL_PRODUCT') {
            product = await this.prisma.product.findFirst({
                where: { barcode: data.rawValue, storeId: data.storeId, isActive: true },
            });
            if (product)
                resolutionStatus = 'FOUND';
        }
        if (product) {
            inventory = await this.prisma.inventory.findFirst({
                where: { storeId: data.storeId, productId: product.id },
            });
        }
        if (classified.scope === 'INTERNAL_OPERATIONAL') {
            resolutionStatus = 'OPERATIONAL_BARCODE';
        }
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
        return {
            status: 'UNKNOWN_BARCODE',
            barcodeScope: classified.scope,
            isDuplicate: !!existingEvent,
            product: null,
            workflow: { action: 'CREATE_PENDING_PRODUCT', requiresExpiry: false, requiresBatch: false },
        };
    }
    async submitScanEvent(data) {
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
                parsedJson: classifyBarcode(data.rawValue),
                resolutionStatus: data.productId ? 'FOUND' : 'UNKNOWN_BARCODE',
                idempotencyKey: data.idempotencyKey,
                quantity: data.quantity ?? null,
                metadata: (data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : {}),
            },
        });
        return { status: 'ACCEPTED', eventId: event.id };
    }
    async batchSync(storeId, deviceId, events) {
        let processed = 0;
        let duplicates = 0;
        const failed = [];
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
                        workflow: e.workflow,
                        rawValue: e.rawValue,
                        symbology: e.symbology ?? classified.symbology,
                        parsedJson: classified,
                        resolutionStatus: classified.scope === 'UNKNOWN' ? 'UNKNOWN_BARCODE' : 'FOUND',
                        idempotencyKey: e.idempotencyKey,
                        quantity: e.quantity ?? null,
                        metadata: JSON.parse(JSON.stringify({ ...e.metadata, offlineScannedAt: e.scannedAt })),
                    },
                });
                processed++;
            }
            catch {
                failed.push(e.idempotencyKey);
            }
        }
        return { processed, duplicates, failed };
    }
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
    async registerDevice(data) {
        return this.prisma.scannerDevice.create({
            data: {
                deviceCode: (0, uuid_1.v4)(),
                storeId: data.storeId,
                deviceName: data.deviceName,
                deviceType: data.deviceType ?? 'ANDROID_PHONE',
                assignedToId: data.assignedToId ?? null,
                lastSeenAt: new Date(),
                status: 'ACTIVE',
            },
        });
    }
    async getScannerActivity(storeId, limit = 50) {
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
    async getDevices(storeId) {
        return this.prisma.scannerDevice.findMany({
            where: { storeId },
            include: { assignedTo: { select: { id: true, name: true, role: true } } },
            orderBy: { lastSeenAt: 'desc' },
        });
    }
    async deviceHeartbeat(deviceId) {
        const device = await this.prisma.scannerDevice.findUnique({ where: { id: deviceId } });
        if (!device)
            throw new common_1.NotFoundException('Device not found');
        return this.prisma.scannerDevice.update({
            where: { id: deviceId },
            data: { lastSeenAt: new Date() },
        });
    }
};
exports.ScannerService = ScannerService;
exports.ScannerService = ScannerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScannerService);
//# sourceMappingURL=scanner.service.js.map