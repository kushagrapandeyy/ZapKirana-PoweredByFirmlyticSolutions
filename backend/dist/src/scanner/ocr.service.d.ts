import { PrismaService } from '../prisma.service';
export interface ExtractedField {
    value: string | number | boolean | null;
    confidence: number;
}
export interface ProductMasterExtraction {
    productCode: ExtractedField;
    productName: ExtractedField;
    unit: ExtractedField;
    company: ExtractedField;
    category: ExtractedField;
    hsnSac: ExtractedField;
    mrp: ExtractedField;
    sgstPercent: ExtractedField;
    cgstPercent: ExtractedField;
    igstPercent: ExtractedField;
    shelfLifeDays: ExtractedField;
}
export declare class OcrService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    extractProductMaster(rawText: string, storeId: string): Promise<{
        fields: {
            id: string;
            fieldKey: string;
            extractedValue: string | null;
            confidence: number | null;
            isEdited: boolean;
            finalValue: string | null;
            extractionId: string;
        }[];
    } & {
        id: string;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: string;
        type: string;
        rawText: string | null;
        confidenceScore: number | null;
    }>;
    extractSupplierLedger(rawText: string, storeId: string): Promise<{
        fields: {
            id: string;
            fieldKey: string;
            extractedValue: string | null;
            confidence: number | null;
            isEdited: boolean;
            finalValue: string | null;
            extractionId: string;
        }[];
    } & {
        id: string;
        imageUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: string;
        type: string;
        rawText: string | null;
        confidenceScore: number | null;
    }>;
    private validateProductExtraction;
    private calculateAverageConfidence;
}
