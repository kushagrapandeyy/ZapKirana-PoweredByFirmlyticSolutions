import { SuppliersService } from './suppliers.service';
export declare class SuppliersController {
    private readonly suppliersService;
    constructor(suppliersService: SuppliersService);
    getAllSuppliers(): Promise<{
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
    }[]>;
    getStoreConnections(storeId: string): Promise<({
        supplier: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        supplierId: string;
    })[]>;
    connectStoreToSupplier(body: {
        storeId: string;
        supplierId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        supplierId: string;
    }>;
}
