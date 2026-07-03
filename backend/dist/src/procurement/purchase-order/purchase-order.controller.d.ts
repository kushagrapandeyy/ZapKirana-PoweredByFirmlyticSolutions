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
            name: string;
            createdAt: Date;
            updatedAt: Date;
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
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            rating: number;
            description: string | null;
            address: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                name: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
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
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
            poId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.POStatus;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    getStorePOs(storeId: string): Promise<({
        supplier: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            rating: number;
            description: string | null;
            address: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                name: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
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
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
            poId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.POStatus;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    })[]>;
    getPO(id: string): Promise<{
        store: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
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
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            rating: number;
            description: string | null;
            address: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                name: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
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
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
            poId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.POStatus;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    getPOByShareToken(token: string): Promise<{
        store: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
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
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            rating: number;
            description: string | null;
            address: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            categories: string | null;
            logoUrl: string | null;
            paymentTerms: string | null;
            onTimeRate: number;
            fillRate: number;
        };
        items: ({
            product: {
                id: string;
                name: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
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
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
            poId: string;
        })[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.POStatus;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    getPOPdf(id: string): Promise<string>;
    acceptPO(id: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
            poId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.POStatus;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    sendPO(id: string): Promise<{
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.POStatus;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
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
            productId: string;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            purchasePrice: number;
            poId: string;
        }[];
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.POStatus;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        notes: string | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
}
