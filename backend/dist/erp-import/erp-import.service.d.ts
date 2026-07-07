import { PrismaService } from '../prisma.service';
import { ErpValidationService } from './erp-validation.service';
export declare class ErpImportService {
    private readonly prisma;
    private readonly validator;
    constructor(prisma: PrismaService, validator: ErpValidationService);
    dryRunProductImport(storeId: string, rows: any[], uploadedBy: string): Promise<{
        batchId: string;
        summary: {
            total: number;
            valid: number;
            invalid: number;
            duplicates: number;
        };
        results: {
            rowNumber: number;
            legacyCode: string;
            productName: string;
            status: "VALID" | "INVALID" | "DUPLICATE" | "WARNING";
            errors: any[];
        }[];
    }>;
    confirmProductImport(storeId: string, batchId: string, confirmedBy: string): Promise<{
        batchId: string;
        importedRows: number;
        status: string;
    }>;
    dryRunSupplierImport(storeId: string, rows: any[], uploadedBy: string): Promise<{
        batchId: string;
        summary: {
            total: number;
            valid: number;
            invalid: number;
            duplicates: number;
        };
        results: any[];
    }>;
}
