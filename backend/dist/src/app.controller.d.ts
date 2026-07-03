import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
export declare class AppController {
    private readonly appService;
    private prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getStore(id: string): Promise<{
        id: string;
        organizationId: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingRadiusKm: number;
        gstin: string | null;
        isActive: boolean;
        imageUrl: string | null;
        operatingHours: string | null;
        rating: number;
        description: string | null;
        bankAccountNumber: string | null;
        bankRoutingNumber: string | null;
        taxId: string | null;
    }>;
    getNearbyStores(lat: string, lng: string, radiusKm?: string): Promise<{
        distanceKm: number;
        id: string;
        organizationId: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        operatingRadiusKm: number;
        gstin: string | null;
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
