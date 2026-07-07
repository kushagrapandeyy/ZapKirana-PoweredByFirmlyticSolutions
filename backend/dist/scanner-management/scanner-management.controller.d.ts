import { ScannerManagementService } from './scanner-management.service';
export declare class ScannerManagementController {
    private readonly scannerManagementService;
    constructor(scannerManagementService: ScannerManagementService);
    getStaff(req: any): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        email: string;
        pin: string | null;
        phone: string | null;
    }[]>;
    createStaff(req: any, body: {
        name: string;
        pin: string;
    }): Promise<{
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
    }>;
    getDevices(req: any): Promise<{
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
    registerDevice(req: any, body: {
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
    getAnalytics(req: any): Promise<{
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
    heartbeat(req: any, body: {
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
}
