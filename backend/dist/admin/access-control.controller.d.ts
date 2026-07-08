import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';
export declare class AccessControlController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPlatformStaff(): Promise<{
        id: string;
        email: string;
        name: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }[]>;
    inviteStaff(body: {
        name: string;
        email: string;
        role: Role;
    }, req: any): Promise<{
        id: string;
        organizationId: string | null;
        email: string;
        password: string | null;
        pin: string | null;
        name: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
        createdAt: Date;
        updatedAt: Date;
        zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateRole(id: string, body: {
        role: Role;
    }, req: any): Promise<{
        id: string;
        organizationId: string | null;
        email: string;
        password: string | null;
        pin: string | null;
        name: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
        createdAt: Date;
        updatedAt: Date;
        zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
}
