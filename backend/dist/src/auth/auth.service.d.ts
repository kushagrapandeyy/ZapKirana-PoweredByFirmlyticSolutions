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
        _devOtp: string;
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
    getProfile(userId: string): Promise<{
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
}
