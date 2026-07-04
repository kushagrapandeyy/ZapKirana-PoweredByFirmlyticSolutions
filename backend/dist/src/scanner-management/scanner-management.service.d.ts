import { PrismaService } from '../prisma.service';
export declare class ScannerManagementService {
    private prisma;
    constructor(prisma: PrismaService);
    getScannerStaff(storeId: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        email: string;
        phone: string | null;
        pin: string | null;
    }[]>;
    createScannerStaff(storeId: string, data: {
        name: string;
        pin: string;
    }): Promise<{
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
    }>;
    getDevices(storeId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DeviceStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deviceCode: string;
        deviceName: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        assignedToId: string | null;
        lastSeenAt: Date | null;
    }[]>;
    registerDevice(storeId: string, data: {
        deviceName: string;
        deviceCode: string;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DeviceStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deviceCode: string;
        deviceName: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        assignedToId: string | null;
        lastSeenAt: Date | null;
    }>;
    getAnalytics(storeId: string): Promise<{
        totalTimeSpentSeconds: number;
        scansToday: number;
        recentSessions: ({
            staff: {
                name: string | null;
            };
            device: {
                deviceCode: string;
                deviceName: string;
            };
        } & {
            id: string;
            storeId: string;
            staffId: string;
            deviceId: string;
            startedAt: Date;
            endedAt: Date | null;
            durationSeconds: number | null;
        })[];
    }>;
    heartbeatDevice(storeId: string, deviceCode: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.DeviceStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deviceCode: string;
        deviceName: string;
        deviceType: import(".prisma/client").$Enums.DeviceType;
        assignedToId: string | null;
        lastSeenAt: Date | null;
    }>;
}
