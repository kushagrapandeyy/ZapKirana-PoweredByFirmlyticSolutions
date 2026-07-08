import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        email?: string;
        phone?: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
            storeId: any;
            isVerified: any;
            avatarUrl: any;
        };
    }>;
    register(body: {
        email: string;
        password: string;
        name: string;
        phone?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
            storeId: any;
            isVerified: any;
            avatarUrl: any;
        };
    }>;
    scannerLogin(body: {
        deviceCode: string;
        pin: string;
    }): Promise<{
        token: string;
        storeId: string;
        deviceId: string;
        staffId: string;
        sessionId: string;
        user: {
            id: string;
            name: string | null;
        };
    }>;
    scannerLogout(req: any): Promise<{
        success: boolean;
    }>;
    requestOtp(body: {
        phone: string;
    }): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(body: {
        phone: string;
        code: string;
    }): Promise<{
        access_token: string;
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
            storeId: any;
            isVerified: any;
            avatarUrl: any;
        };
    }>;
    getProfile(req: any): Promise<{
        savedAddresses: {
            id: string;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            address: string;
            city: string | null;
            state: string | null;
            pincode: string | null;
            label: string;
            streetAddress: string | null;
            landmark: string | null;
            isDefault: boolean;
        }[];
        id: string;
        organizationId: string | null;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
        zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
    updatePushToken(req: any, body: {
        pushToken: string;
    }): Promise<{
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
        zapCreditBalance: import("@prisma/client/runtime/library").Decimal;
    }>;
}
