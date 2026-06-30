import { PrismaService } from '../prisma.service';
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllSuppliers(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        contactEmail: string | null;
        contactPhone: string | null;
        categories: string | null;
        rating: number;
    }[]>;
    getStoreConnections(storeId: string): Promise<({
        supplier: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            contactEmail: string | null;
            contactPhone: string | null;
            categories: string | null;
            rating: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        supplierId: string;
    })[]>;
    connectStoreToSupplier(storeId: string, supplierId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        supplierId: string;
    }>;
}
