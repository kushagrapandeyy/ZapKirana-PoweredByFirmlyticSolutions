import { ErpImportService } from './erp-import.service';
export declare class ErpImportController {
    private readonly erpImportService;
    constructor(erpImportService: ErpImportService);
    dryRunProductImport(storeId: string, body: {
        rows: any[];
        uploadedBy: string;
    }): Promise<{
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
    confirmProductImport(storeId: string, body: {
        batchId: string;
        confirmedBy: string;
    }): Promise<{
        batchId: string;
        importedRows: number;
        status: string;
    }>;
    dryRunSupplierImport(storeId: string, body: {
        rows: any[];
        uploadedBy: string;
    }): Promise<{
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
