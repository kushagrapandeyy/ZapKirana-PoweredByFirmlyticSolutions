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
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                organizationId: string | null;
                location: string | null;
                latitude: number | null;
                longitude: number | null;
                operatingRadiusKm: number;
                gstin: string | null;
                imageUrl: string | null;
                operatingHours: string | null;
                rating: number;
                description: string | null;
                bankAccountNumber: string | null;
                bankRoutingNumber: string | null;
                taxId: string | null;
            };
            customer: {
                id: string;
                storeId: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string | null;
                organizationId: string | null;
                email: string;
                password: string | null;
                pin: string | null;
                phone: string | null;
                role: import(".prisma/client").$Enums.Role;
                avatarUrl: string | null;
                isVerified: boolean;
                pushToken: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            storeId: string;
            customerId: string;
            staffId: string | null;
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
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    getStores(): Promise<({
        _count: {
            users: number;
            products: number;
            orders: number;
        };
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingRadiusKm: number;
        gstin: string | null;
        imageUrl: string | null;
        operatingHours: string | null;
        rating: number;
        description: string | null;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    })[]>;
    createStore(body: any, req: any): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingRadiusKm: number;
        gstin: string | null;
        imageUrl: string | null;
        operatingHours: string | null;
        rating: number;
        description: string | null;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    }>;
    approveStoreOnboarding(id: string, req: any): {
        message: string;
        storeId: string;
    };
    updateStore(id: string, body: any, req: any): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        organizationId: string | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingRadiusKm: number;
        gstin: string | null;
        imageUrl: string | null;
        operatingHours: string | null;
        rating: number;
        description: string | null;
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
            isActive: boolean;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            organizationId: string | null;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            gstin: string | null;
            imageUrl: string | null;
            operatingHours: string | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        } | null;
    } & {
        id: string;
        storeId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        organizationId: string | null;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    })[]>;
    createVendor(body: any, req: any): Promise<{
        id: string;
        storeId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        organizationId: string | null;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    }>;
    getSuppliers(): Promise<({
        _count: {
            purchaseOrders: number;
            storeConnections: number;
            supplierProducts: number;
        };
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
    })[]>;
    getSupplier(id: string): Promise<{
        purchaseOrders: ({
            store: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                organizationId: string | null;
                location: string | null;
                latitude: number | null;
                longitude: number | null;
                operatingRadiusKm: number;
                gstin: string | null;
                imageUrl: string | null;
                operatingHours: string | null;
                rating: number;
                description: string | null;
                bankAccountNumber: string | null;
                bankRoutingNumber: string | null;
                taxId: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.POStatus;
            id: string;
            storeId: string;
            totalAmount: number;
            createdAt: Date;
            updatedAt: Date;
            supplierId: string;
            expectedDeliveryDate: Date | null;
            notes: string | null;
            shareToken: string | null;
            shareTokenExpiresAt: Date | null;
        })[];
        storeConnections: ({
            store: {
                isActive: boolean;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                organizationId: string | null;
                location: string | null;
                latitude: number | null;
                longitude: number | null;
                operatingRadiusKm: number;
                gstin: string | null;
                imageUrl: string | null;
                operatingHours: string | null;
                rating: number;
                description: string | null;
                bankAccountNumber: string | null;
                bankRoutingNumber: string | null;
                taxId: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.ConnectionStatus;
            id: string;
            storeId: string;
            createdAt: Date;
            updatedAt: Date;
            supplierId: string;
        })[];
        supplierProducts: ({
            product: {
                isActive: boolean;
                id: string;
                storeId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
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
            supplierId: string;
            productId: string;
            price: number;
        })[];
    } & {
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
    }>;
    createSupplier(body: any, req: any): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
    }>;
    updateSupplier(id: string, body: any, req: any): Promise<{
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
    }>;
    getAudits(limit?: string): Promise<({
        user: {
            id: string;
            storeId: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
            organizationId: string | null;
            email: string;
            password: string | null;
            pin: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            avatarUrl: string | null;
            isVerified: boolean;
            pushToken: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        action: string;
        entityType: string;
        entityId: string | null;
        userId: string | null;
        details: string | null;
    })[]>;
}
