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
            gstin: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                storeId: string;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
                subscriptionDiscount: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            purchasePrice: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            poId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        totalAmount: number;
        notes: string | null;
        expectedDeliveryDate: Date | null;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                storeId: string;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
                subscriptionDiscount: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            purchasePrice: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            poId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        totalAmount: number;
        notes: string | null;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    })[]>;
    getPO(id: string): Promise<{
        store: {
            id: string;
            name: string;
            gstin: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                storeId: string;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
                subscriptionDiscount: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            purchasePrice: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            poId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        totalAmount: number;
        notes: string | null;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    getPOByShareToken(token: string): Promise<{
        store: {
            id: string;
            name: string;
            gstin: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                storeId: string;
                barcode: string | null;
                internalSku: string;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                gstClass: import(".prisma/client").$Enums.GSTClass;
                subscriptionDiscount: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            quantity: number;
            purchasePrice: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            poId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        totalAmount: number;
        notes: string | null;
        expectedDeliveryDate: Date | null;
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
            purchasePrice: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            poId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        totalAmount: number;
        notes: string | null;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
    sendPO(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        totalAmount: number;
        notes: string | null;
        expectedDeliveryDate: Date | null;
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
            purchasePrice: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            poId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        totalAmount: number;
        notes: string | null;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
}
