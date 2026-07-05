import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        totalStores: number;
        totalVendors: number;
        totalSuppliers: number;
        totalOrders: number;
        totalSubscriptions: number;
        recentOrders: ({
            store: {
                id: string;
                organizationId: string | null;
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
                createdAt: Date;
                updatedAt: Date;
                bankAccountNumber: string | null;
                bankRoutingNumber: string | null;
                taxId: string | null;
            };
            customer: {
                id: string;
                organizationId: string | null;
                name: string | null;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                password: string | null;
                pin: string | null;
                phone: string | null;
                role: import(".prisma/client").$Enums.Role;
                storeId: string | null;
                avatarUrl: string | null;
                isVerified: boolean;
                pushToken: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            staffId: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            customerId: string;
            totalAmount: number;
            deliveryFee: number;
            gstAmount: number;
            tipAmount: number;
            deliveryAddress: string | null;
            deliveryLat: number | null;
            deliveryLng: number | null;
            deliverySlot: string | null;
            deliveryInstructions: string | null;
            requireOtp: boolean;
            otp: string | null;
            subscriptionId: string | null;
        })[];
    }>;
    getStaffList(storeId: string): Promise<{
        id: string;
        organizationId: string | null;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    }[]>;
    getAlerts(storeId: string): Promise<{
        lowStock: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
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
                campaignId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            batchNo: string | null;
            expiryDate: Date | null;
            onHandQty: number;
            reservedQty: number;
            blockedQty: number;
            lowStockThreshold: number;
        })[];
        expiringSoon: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
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
                campaignId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            batchNo: string | null;
            expiryDate: Date | null;
            onHandQty: number;
            reservedQty: number;
            blockedQty: number;
            lowStockThreshold: number;
        })[];
        damagedGoods: ({
            inventory: {
                product: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    imageUrl: string | null;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
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
                    campaignId: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                productId: string;
                batchNo: string | null;
                expiryDate: Date | null;
                onHandQty: number;
                reservedQty: number;
                blockedQty: number;
                lowStockThreshold: number;
            };
        } & {
            id: string;
            createdAt: Date;
            storeId: string;
            type: import(".prisma/client").$Enums.MovementType;
            productId: string;
            inventoryId: string;
            quantityChange: number;
            sourceType: string | null;
            sourceId: string | null;
            reason: string | null;
            staffId: string | null;
        })[];
    }>;
    getStores(): Promise<({
        _count: {
            users: number;
            products: number;
            orders: number;
        };
    } & {
        id: string;
        organizationId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    })[]>;
    createStore(body: any, req: any): Promise<{
        id: string;
        organizationId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    }>;
    approveStoreOnboarding(id: string, req: any): {
        message: string;
        storeId: string;
    };
    updateStore(id: string, body: any, req: any): Promise<{
        id: string;
        organizationId: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    }>;
    archiveStore(id: string, req: any): Promise<{
        success: boolean;
    }>;
    bulkCreateStores(body: {
        stores: any[];
    }, req: any): Promise<{
        count: number;
    }>;
    getVendors(): Promise<({
        store: {
            id: string;
            organizationId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        } | null;
    } & {
        id: string;
        organizationId: string | null;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    })[]>;
    createVendor(body: any, req: any): Promise<{
        id: string;
        organizationId: string | null;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    }>;
    getSuppliers(): Promise<({
        _count: {
            purchaseOrders: number;
            supplierProducts: number;
            storeConnections: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        rating: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        categories: string | null;
        logoUrl: string | null;
        paymentTerms: string | null;
        onTimeRate: number;
        fillRate: number;
    })[]>;
    getSupplier(id: string): Promise<{
        purchaseOrders: ({
            store: {
                id: string;
                organizationId: string | null;
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
                createdAt: Date;
                updatedAt: Date;
                bankAccountNumber: string | null;
                bankRoutingNumber: string | null;
                taxId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            status: import(".prisma/client").$Enums.POStatus;
            notes: string | null;
            totalAmount: number;
            supplierId: string;
            expectedDeliveryDate: Date | null;
            shareToken: string | null;
            shareTokenExpiresAt: Date | null;
        })[];
        supplierProducts: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                imageUrl: string | null;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
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
                campaignId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            supplierId: string;
            price: number;
        })[];
        storeConnections: ({
            store: {
                id: string;
                organizationId: string | null;
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
                createdAt: Date;
                updatedAt: Date;
                bankAccountNumber: string | null;
                bankRoutingNumber: string | null;
                taxId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            status: import(".prisma/client").$Enums.ConnectionStatus;
            supplierId: string;
        })[];
    } & {
        id: string;
        name: string;
        isActive: boolean;
        rating: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        categories: string | null;
        logoUrl: string | null;
        paymentTerms: string | null;
        onTimeRate: number;
        fillRate: number;
    }>;
    createSupplier(body: any, req: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        rating: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        categories: string | null;
        logoUrl: string | null;
        paymentTerms: string | null;
        onTimeRate: number;
        fillRate: number;
    }>;
    updateSupplier(id: string, body: any, req: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        rating: number;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        categories: string | null;
        logoUrl: string | null;
        paymentTerms: string | null;
        onTimeRate: number;
        fillRate: number;
    }>;
    getAudits(limit?: string): Promise<({
        user: {
            id: string;
            organizationId: string | null;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            password: string | null;
            pin: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            storeId: string | null;
            avatarUrl: string | null;
            isVerified: boolean;
            pushToken: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        action: string;
        entityType: string;
        entityId: string | null;
        details: string | null;
    })[]>;
}
