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
exports.LabelsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
function generateFixedPackBarcode(storeCode, productCode, packGrams) {
    const sc = storeCode.substring(0, 2).toUpperCase().padStart(2, '0');
    const pc = productCode.substring(0, 4).toUpperCase().padEnd(4, 'X');
    const pg = String(packGrams).padStart(4, '0');
    return `BK${sc}${pc}${pg}`;
}
function generateVariableWeightBarcode(productCode, weightGrams) {
    const prefix = '29';
    const pc = String(productCode).substring(0, 5).padStart(5, '0');
    const wg = String(weightGrams).substring(0, 5).padStart(5, '0');
    const body = `${prefix}${pc}${wg}`;
    const checkDigit = calculateEan13CheckDigit(body);
    return `${body}${checkDigit}`;
}
function calculateEan13CheckDigit(body) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(body[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    return (10 - (sum % 10)) % 10;
}
let LabelsService = class LabelsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateBarcode(data) {
        const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        let barcodeValue;
        let scope;
        if (data.barcodeType === 'INTERNAL_FIXED_PACK') {
            if (!data.packGrams)
                throw new common_1.BadRequestException('packGrams is required for fixed-pack barcodes');
            const storeCode = data.storeCode ?? '01';
            const productCode = data.productCode ?? product.skuCode.substring(0, 4);
            barcodeValue = generateFixedPackBarcode(storeCode, productCode, data.packGrams);
            scope = 'INTERNAL_FIXED_PACK';
        }
        else {
            if (!data.packGrams && !data.weightGrams)
                throw new common_1.BadRequestException('packGrams or weightGrams is required for variable-weight barcodes');
            const numCode = data.productNumericCode ?? Math.abs(product.id.charCodeAt(0) * 100 + product.id.charCodeAt(1));
            barcodeValue = generateVariableWeightBarcode(numCode % 100000, data.packGrams ?? data.weightGrams ?? 0);
            scope = 'INTERNAL_VARIABLE_WEIGHT';
        }
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
    async registerExternalBarcode(data) {
        const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        const existing = await this.prisma.barcodeRegistry.findFirst({
            where: { barcodeValue: data.barcodeValue, storeId: data.storeId ?? null },
        });
        if (existing)
            throw new common_1.BadRequestException('Barcode already registered');
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
    async getBarcodesForProduct(productId) {
        return this.prisma.barcodeRegistry.findMany({
            where: { productId, isActive: true },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createPrintJob(data) {
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
    async getPrintJob(id) {
        const job = await this.prisma.printJob.findUnique({
            where: { id },
            include: { requestedBy: { select: { id: true, name: true } } },
        });
        if (!job)
            throw new common_1.NotFoundException('Print job not found');
        return job;
    }
    async listPrintJobs(storeId) {
        return this.prisma.printJob.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { requestedBy: { select: { id: true, name: true } } },
        });
    }
};
exports.LabelsService = LabelsService;
exports.LabelsService = LabelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LabelsService);
//# sourceMappingURL=labels.service.js.map