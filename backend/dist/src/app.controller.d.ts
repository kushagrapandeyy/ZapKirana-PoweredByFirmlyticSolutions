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
