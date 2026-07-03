import { PrismaService } from '../prisma.service';
export declare class LabelsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateBarcode(data: {
        storeId: string;
        productId: string;
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
        productId?: undefined;
    } | {
        barcode: string;
        barcodeRegistryId: string;
        scope: "INTERNAL_FIXED_PACK" | "INTERNAL_VARIABLE_WEIGHT";
        productId: string;
        alreadyExisted: boolean;
    }>;
    registerExternalBarcode(data: {
        productId: string;
        barcodeValue: string;
        symbology?: string;
        storeId?: string;
        isPrimary?: boolean;
    }): Promise<{
        id: string;
        storeId: string | null;
        createdAt: Date;
        isActive: boolean;
        productId: string | null;
        barcodeValue: string;
        symbology: string;
        barcodeScope: import(".prisma/client").$Enums.BarcodeScope;
        isInternal: boolean;
        isPrimary: boolean;
    }>;
    getBarcodesForProduct(productId: string): Promise<{
        id: string;
        storeId: string | null;
        createdAt: Date;
        isActive: boolean;
        productId: string | null;
        barcodeValue: string;
        symbology: string;
        barcodeScope: import(".prisma/client").$Enums.BarcodeScope;
        isInternal: boolean;
        isPrimary: boolean;
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
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PrintJobStatus;
        templateType: string;
        labelDataJson: import("@prisma/client/runtime/library").JsonValue;
        r2PdfPath: string | null;
        requestedById: string | null;
    }>;
    listPrintJobs(storeId: string): Promise<({
        requestedBy: {
            id: string;
            name: string | null;
        } | null;
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PrintJobStatus;
        templateType: string;
        labelDataJson: import("@prisma/client/runtime/library").JsonValue;
        r2PdfPath: string | null;
        requestedById: string | null;
    })[]>;
}
