import { PrismaService } from '../prisma.service';
export declare class SuppliersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllSuppliers(): Promise<{
        id: string;
        name: string;
        gstin: string | null;
        pan: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        email: string | null;
        phone: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        address: string | null;
        isActive: boolean;
        ledgerName: string | null;
        accountGroup: string | null;
        mobile: string | null;
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
            pan: string | null;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            email: string | null;
            phone: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            address: string | null;
            isActive: boolean;
            ledgerName: string | null;
            accountGroup: string | null;
            mobile: string | null;
            country: string | null;
            openingBalance: number | null;
            openingBalanceType: string | null;
            contactPerson: string | null;
            foodLicenseNo: string | null;
            importBatchId: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
    })[]>;
    connectStoreToSupplier(storeId: string, supplierId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ConnectionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        supplierId: string;
    }>;
}
