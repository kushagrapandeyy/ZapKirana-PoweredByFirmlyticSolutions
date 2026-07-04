import { PrismaService } from '../prisma.service';
export declare class HRService {
    private prisma;
    constructor(prisma: PrismaService);
    getStaffList(storeId: string): Promise<{
        timesheets: any;
        storeRoles: {
            id: string;
            status: string;
            organizationId: string;
            role: import(".prisma/client").$Enums.Role;
            storeId: string;
            userId: string;
            permissionsJson: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string | null;
        email: string;
        phone: string | null;
        password: string | null;
        pin: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    }[]>;
    getTimesheets(storeId: string): Promise<any>;
    getWageSlips(storeId: string): Promise<any>;
}
