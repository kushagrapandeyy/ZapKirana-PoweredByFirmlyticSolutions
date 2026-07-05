import { ScannerService } from './scanner.service';
import { ScannerWorkflow } from '@prisma/client';
export declare class ScannerController {
    private readonly scannerService;
    constructor(scannerService: ScannerService);
    getWorkflows(): {
        workflows: string[];
    };
    resolveBarcode(body: {
        storeId: string;
        workflow: ScannerWorkflow;
        rawValue: string;
        symbology?: string;
        deviceId?: string;
        scannedById?: string;
        idempotencyKey: string;
        quantity?: number;
        metadata?: Record<string, unknown>;
    }): Promise<{
        status: string;
        barcodeScope: import(".prisma/client").$Enums.BarcodeScope;
        isDuplicate: boolean;
        product: {
            productId: any;
            name: any;
            brand: any;
            category: any;
            barcode: any;
            mrp: any;
            sellingPrice: any;
            gstRate: any;
            gstClass: any;
            imageUrl: any;
            availableQty: number;
        };
        workflow: {
            action: string;
            requiresExpiry: boolean;
            requiresBatch: boolean;
        };
        reference?: undefined;
    } | {
        status: string;
        barcodeScope: "INTERNAL_OPERATIONAL";
        isDuplicate: boolean;
        reference: {
            type: "ORDER" | "PO" | "BIN" | "SUPPLIER_CRATE" | undefined;
            id: string | undefined;
        };
        workflow: {
            action: string;
            requiresExpiry: boolean;
            requiresBatch: boolean;
        };
        product?: undefined;
    } | {
        status: string;
        barcodeScope: "GS1_EXTERNAL_PRODUCT" | "INTERNAL_FIXED_PACK" | "INTERNAL_VARIABLE_WEIGHT" | "UNKNOWN";
        isDuplicate: boolean;
        product: null;
        workflow: {
            action: string;
            requiresExpiry: boolean;
            requiresBatch: boolean;
        };
        reference?: undefined;
    }>;
    submitEvent(body: {
        storeId: string;
        workflow: ScannerWorkflow;
        rawValue: string;
        symbology?: string;
        productId?: string;
        quantity?: number;
        deviceId?: string;
        scannedById?: string;
        idempotencyKey: string;
        metadata?: Record<string, unknown>;
    }): Promise<{
        status: string;
        eventId: string;
    }>;
    batchSync(body: {
        storeId: string;
        deviceId: string;
        events: Array<{
            idempotencyKey: string;
            workflow: string;
            rawValue: string;
            symbology?: string;
            quantity?: number;
            scannedAt: string;
            metadata?: Record<string, unknown>;
        }>;
    }): Promise<{
        processed: number;
        duplicates: number;
        failed: string[];
    }>;
    getActivity(storeId: string, limit?: string): Promise<({
        device: {
            id: string;
            deviceName: string;
            deviceType: import(".prisma/client").$Enums.DeviceType;
        } | null;
        scannedBy: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        storeId: string;
        quantity: number | null;
        symbology: string | null;
        deviceId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        idempotencyKey: string;
        scannedById: string | null;
        workflow: import(".prisma/client").$Enums.ScannerWorkflow;
        rawValue: string;
        parsedJson: import("@prisma/client/runtime/library").JsonValue | null;
        resolutionStatus: import(".prisma/client").$Enums.ScanResolutionStatus;
    })[]>;
    getDevices(storeId: string): Promise<({
        assignedTo: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        status: import(".prisma/client").$Enums.DeviceStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deviceCode: string;
        deviceName: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        assignedToId: string | null;
        lastSeenAt: Date | null;
    })[]>;
    registerDevice(body: {
        storeId: string;
        deviceName: string;
        deviceType?: string;
        assignedToId?: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DeviceStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deviceCode: string;
        deviceName: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        assignedToId: string | null;
        lastSeenAt: Date | null;
    }>;
    heartbeat(deviceId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DeviceStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deviceCode: string;
        deviceName: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        assignedToId: string | null;
        lastSeenAt: Date | null;
    }>;
}
