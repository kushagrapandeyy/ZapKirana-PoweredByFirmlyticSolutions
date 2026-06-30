import { PurchaseOrderService } from './purchase-order.service';
import { GrnService } from '../grn/grn.service';
export declare class PurchaseOrderController {
    private poService;
    private grnService;
    constructor(poService: PurchaseOrderService, grnService: GrnService);
    createPO(body: {
        storeId: string;
        supplierId: string;
        expectedDeliveryDate: string;
        items: any[];
        notes?: string;
    }): Promise<{
        store: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            gstin: string | null;
            isActive: boolean;
            imageUrl: string | null;
            operatingHours: string | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        };
        supplier: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            rating: number;
            description: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            address: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            poId: string;
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
        })[];
    } & {
        id: string;
        shareToken: string | null;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        expectedDeliveryDate: Date | null;
        totalAmount: number;
        notes: string | null;
        shareTokenExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStorePOs(storeId: string): Promise<({
        supplier: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            rating: number;
            description: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            address: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            poId: string;
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
        })[];
    } & {
        id: string;
        shareToken: string | null;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        expectedDeliveryDate: Date | null;
        totalAmount: number;
        notes: string | null;
        shareTokenExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getPO(id: string): Promise<{
        store: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            gstin: string | null;
            isActive: boolean;
            imageUrl: string | null;
            operatingHours: string | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        };
        supplier: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            rating: number;
            description: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            address: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            poId: string;
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
        })[];
    } & {
        id: string;
        shareToken: string | null;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        expectedDeliveryDate: Date | null;
        totalAmount: number;
        notes: string | null;
        shareTokenExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPOByShareToken(token: string): Promise<{
        store: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            gstin: string | null;
            isActive: boolean;
            imageUrl: string | null;
            operatingHours: string | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        };
        supplier: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isActive: boolean;
            rating: number;
            description: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            address: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            poId: string;
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
        })[];
    } & {
        id: string;
        shareToken: string | null;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        expectedDeliveryDate: Date | null;
        totalAmount: number;
        notes: string | null;
        shareTokenExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPOPdf(id: string): Promise<string>;
    acceptPO(id: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            poId: string;
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
        }[];
    } & {
        id: string;
        shareToken: string | null;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        expectedDeliveryDate: Date | null;
        totalAmount: number;
        notes: string | null;
        shareTokenExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sendPO(id: string): Promise<{
        id: string;
        shareToken: string | null;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        expectedDeliveryDate: Date | null;
        totalAmount: number;
        notes: string | null;
        shareTokenExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    completeGRN(id: string, body: {
        staffId: string;
        receivedItems: {
            poItemId: string;
            receivedQuantity: number;
        }[];
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            poId: string;
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
        }[];
    } & {
        id: string;
        shareToken: string | null;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.POStatus;
        expectedDeliveryDate: Date | null;
        totalAmount: number;
        notes: string | null;
        shareTokenExpiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
