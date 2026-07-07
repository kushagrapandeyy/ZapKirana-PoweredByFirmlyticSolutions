import { PrismaService } from '../prisma.service';
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllSuppliers(): Promise<{
        id: string;
        name: string;
        gstin: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        ledgerName: string | null;
        accountGroup: string | null;
        pan: string | null;
        mobile: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        country: string | null;
        openingBalance: number | null;
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
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            email: string | null;
            phone: string | null;
            address: string | null;
            ledgerName: string | null;
            accountGroup: string | null;
            pan: string | null;
            mobile: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            country: string | null;
            openingBalance: number | null;
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
