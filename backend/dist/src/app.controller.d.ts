import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
export declare class AppController {
    private readonly appService;
    private prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getStore(id: string): Promise<{
        id: string;
        name: string;
        gstin: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingRadiusKm: number;
        isActive: boolean;
        imageUrl: string | null;
        operatingHours: string | null;
        rating: number;
        description: string | null;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    }>;
    getStoreStaff(storeId: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        email: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
    }[]>;
    updateStaffRole(storeId: string, userId: string, role: string): Promise<{
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
    getNearbyStores(lat: string, lng: string, radiusKm?: string): Promise<{
        distanceKm: number;
        id: string;
        name: string;
        gstin: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingRadiusKm: number;
        isActive: boolean;
        imageUrl: string | null;
        operatingHours: string | null;
        rating: number;
        description: string | null;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    }[] | {
        error: string;
    }>;
    private haversine;
}
