import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(data: {
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
    validateUser(identifier: string, pass: string): Promise<any>;
    requestOtp(phone: string): Promise<{
        message: string;
        expiresIn: number;
    }>;
    verifyOtp(phone: string, code: string): Promise<{
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
    login(user: any): Promise<{
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
    updatePushToken(userId: string, pushToken: string): Promise<{
        id: string;
        organizationId: string | null;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string | null;
        email: string;
        password: string | null;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
        zapCreditBalance: number;
    }>;
    scannerLogin(deviceCode: string, pin: string): Promise<{
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
    scannerLogout(sessionId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getProfile(userId: string): Promise<{
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
        storeId: string | null;
        email: string;
        pin: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        avatarUrl: string | null;
        isVerified: boolean;
        pushToken: string | null;
        zapCreditBalance: number;
    }>;
}
