import { PrismaService } from '../prisma.service';
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllSuppliers(): Promise<{
        id: string;
        name: string;
        gstin: string | null;
        pan: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        phone: string | null;
        storeId: string;
        address: string | null;
        ledgerName: string | null;
        accountGroup: string | null;
        mobile: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        country: string | null;
        openingBalance: import("@prisma/client/runtime/library").Decimal | null;
        openingBalanceType: string | null;
        contactPerson: string | null;
        foodLicenseNo: string | null;
        importBatchId: string | null;
    }[]>;
    getStoreConnections(storeId: string): Promise<({
        supplier: {
            id: string;
            name: string;
            gstin: string | null;
            pan: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            phone: string | null;
            storeId: string;
            address: string | null;
            ledgerName: string | null;
            accountGroup: string | null;
            mobile: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            country: string | null;
            openingBalance: import("@prisma/client/runtime/library").Decimal | null;
            openingBalanceType: string | null;
            contactPerson: string | null;
            foodLicenseNo: string | null;
            importBatchId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
    })[]>;
    connectStoreToSupplier(storeId: string, supplierId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
    }>;
}
