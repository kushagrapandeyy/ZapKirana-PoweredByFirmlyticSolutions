import { PrismaService } from '../prisma.service';
export declare class AdminGovernanceService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logIntervention(data: {
        adminUserId: string;
        targetType: string;
        targetId: string;
        storeId?: string;
        action: string;
        reason: string;
        beforeSnapshot?: any;
        afterSnapshot?: any;
        ipAddress?: string;
        deviceInfo?: string;
        requiresStoreNotification?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        storeId: string | null;
        reason: string;
        action: string;
        targetType: string;
        targetId: string;
        beforeSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        afterSnapshot: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        deviceInfo: string | null;
        requiresStoreNotification: boolean;
        adminUserId: string;
    }>;
}
