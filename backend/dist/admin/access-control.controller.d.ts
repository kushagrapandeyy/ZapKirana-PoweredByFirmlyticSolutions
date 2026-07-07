import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';
export declare class AccessControlController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPlatformStaff(): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        phone: string | null;
    }[]>;
    inviteStaff(body: {
        name: string;
        email: string;
        role: Role;
    }, req: any): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string | null;
        storeId: string | null;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
        zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateRole(id: string, body: {
        role: Role;
    }, req: any): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string | null;
        storeId: string | null;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
        zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
}
