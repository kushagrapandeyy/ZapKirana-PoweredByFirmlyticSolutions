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
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let OcrService = OcrService_1 = class OcrService {
    prisma;
    logger = new common_1.Logger(OcrService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async extractProductMaster(rawText, storeId) {
        this.logger.log(`Extracting Product Master from ${rawText.length} characters`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const parsedData = {
            productCode: { value: '001078', confidence: 0.95 },
            productName: { value: 'AMUL CHAZ 200ML.*15', confidence: 0.96 },
            unit: { value: 'Pcs', confidence: 0.98 },
            company: { value: 'AMUL INDIA LTD.', confidence: 0.92 },
            category: { value: 'DRINK', confidence: 0.90 },
            hsnSac: { value: '04039090', confidence: 0.94 },
            mrp: { value: 15.0, confidence: 0.98 },
            sgstPercent: { value: 2.5, confidence: 0.99 },
            cgstPercent: { value: 2.5, confidence: 0.99 },
            igstPercent: { value: 5.0, confidence: 0.97 },
            shelfLifeDays: { value: 258, confidence: 0.88 },
        };
        this.validateProductExtraction(parsedData);
        const extraction = await this.prisma.scannerExtraction.create({
            data: {
                storeId,
                type: 'PRODUCT_MASTER',
                status: 'DRAFT',
                rawText,
                confidenceScore: this.calculateAverageConfidence(parsedData),
                fields: {
                    create: Object.entries(parsedData).map(([key, field]) => ({
                        fieldKey: key,
                        extractedValue: String(field.value),
                        confidence: field.confidence,
                        finalValue: String(field.value)
                    }))
                }
            },
            include: { fields: true }
        });
        return extraction;
    }
    async extractSupplierLedger(rawText, storeId) {
        this.logger.log(`Extracting Supplier Ledger from ${rawText.length} characters`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const parsedData = {
            ledgerName: { value: 'BALAJI TRADERS', confidence: 0.95 },
            supplierName: { value: 'BALAJI TRADERS', confidence: 0.92 },
            accountGroup: { value: 'SUNDRY CREDITORS', confidence: 0.99 },
            gstin: { value: '27AADCB2230M1Z2', confidence: 0.97 },
            city: { value: 'MUMBAI', confidence: 0.90 },
            openingBalance: { value: 12500.50, confidence: 0.88 },
            openingBalanceType: { value: 'Cr', confidence: 0.96 },
        };
        const extraction = await this.prisma.scannerExtraction.create({
            data: {
                storeId,
                type: 'SUPPLIER_LEDGER',
                status: 'DRAFT',
                rawText,
                confidenceScore: this.calculateAverageConfidence(parsedData),
                fields: {
                    create: Object.entries(parsedData).map(([key, field]) => ({
                        fieldKey: key,
                        extractedValue: String(field.value),
                        confidence: field.confidence,
                        finalValue: String(field.value)
                    }))
                }
            },
            include: { fields: true }
        });
        return extraction;
    }
    validateProductExtraction(data) {
        if (data.sgstPercent?.value && data.cgstPercent?.value && data.igstPercent?.value) {
            const sum = Number(data.sgstPercent.value) + Number(data.cgstPercent.value);
            if (sum !== Number(data.igstPercent.value)) {
                data.igstPercent.confidence = 0.5;
                data.sgstPercent.confidence = 0.5;
                data.cgstPercent.confidence = 0.5;
            }
        }
    }
    calculateAverageConfidence(data) {
        const values = Object.values(data);
        if (values.length === 0)
            return 0;
        const sum = values.reduce((acc, field) => acc + field.confidence, 0);
        return sum / values.length;
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OcrService);
//# sourceMappingURL=ocr.service.js.map