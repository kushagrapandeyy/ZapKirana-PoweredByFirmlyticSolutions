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
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            label: string;
            streetAddress: string | null;
            landmark: string | null;
            city: string | null;
            state: string | null;
            pincode: string | null;
            address: string;
            latitude: number;
            longitude: number;
            isDefault: boolean;
        }[];
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string | null;
        storeId: string | null;
        role: import(".prisma/client").$Enums.Role;
        email: string;
        pin: string | null;
        phone: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    }>;
    updatePushToken(req: any, body: {
        pushToken: string;
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
}
