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
    requestOtp(body: {
        phone: string;
    }): Promise<{
        message: string;
        expiresIn: number;
        _devOtp: string;
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
            address: string;
            userId: string;
            label: string;
            isDefault: boolean;
        }[];
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
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
        email: string;
        phone: string | null;
        password: string | null;
        role: import(".prisma/client").$Enums.Role;
        storeId: string | null;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
    }>;
}
