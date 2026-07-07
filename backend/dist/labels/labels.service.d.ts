import { PrismaService } from '../prisma.service';
export declare class LabelsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateBarcode(data: {
        storeId: string;
        storeProductId: string;
        barcodeType: 'INTERNAL_FIXED_PACK' | 'INTERNAL_VARIABLE_WEIGHT';
        storeCode?: string;
        productCode?: string;
        productNumericCode?: number;
        packGrams?: number;
        weightGrams?: number;
    }): Promise<{
        barcode: string;
        barcodeRegistryId: string;
        alreadyExisted: boolean;
        scope?: undefined;
        storeProductId?: undefined;
    } | {
        barcode: string;
        barcodeRegistryId: string;
        scope: "INTERNAL_FIXED_PACK" | "INTERNAL_VARIABLE_WEIGHT";
        storeProductId: string;
        alreadyExisted: boolean;
    }>;
    registerExternalBarcode(data: {
        storeProductId: string;
        barcodeValue: string;
        symbology?: string;
        storeId?: string;
        isPrimary?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        storeId: string | null;
        isActive: boolean;
        storeProductId: string | null;
        isPrimary: boolean;
        symbology: string;
        barcodeValue: string;
        barcodeScope: import(".prisma/client").$Enums.BarcodeScope;
        isInternal: boolean;
    }>;
    getBarcodesForProduct(storeProductId: string): Promise<{
        id: string;
        createdAt: Date;
        storeId: string | null;
        isActive: boolean;
        storeProductId: string | null;
        isPrimary: boolean;
        symbology: string;
        barcodeValue: string;
        barcodeScope: import(".prisma/client").$Enums.BarcodeScope;
        isInternal: boolean;
    }[]>;
    createPrintJob(data: {
        storeId: string;
        requestedById?: string;
        templateType: string;
        items: Array<{
            variantId: string;
            barcode: string;
            quantity: number;
            metadata?: Record<string, unknown>;
        }>;
    }): Promise<{
        printJobId: string;
        status: string;
        labelDataJson: {
            templateType: string;
            items: {
                variantId: string;
                barcode: string;
                quantity: number;
                metadata?: Record<string, unknown>;
            }[];
            generatedAt: string;
        };
        itemCount: number;
        totalLabels: number;
    }>;
    getPrintJob(id: string): Promise<{
        requestedBy: {
            id: string;
            name: string | null;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PrintJobStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        requestedById: string | null;
        templateType: string;
        labelDataJson: import("@prisma/client/runtime/library").JsonValue;
        r2PdfPath: string | null;
    }>;
    listPrintJobs(storeId: string): Promise<({
        requestedBy: {
            id: string;
            name: string | null;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PrintJobStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        requestedById: string | null;
        templateType: string;
        labelDataJson: import("@prisma/client/runtime/library").JsonValue;
        r2PdfPath: string | null;
    })[]>;
}
