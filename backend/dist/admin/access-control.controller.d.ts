import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';
export declare class AccessControlController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPlatformStaff(): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
    }[]>;
    inviteStaff(body: {
        name: string;
        email: string;
        role: Role;
    }, req: any): Promise<{
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
    updateRole(id: string, body: {
        role: Role;
    }, req: any): Promise<{
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
}
