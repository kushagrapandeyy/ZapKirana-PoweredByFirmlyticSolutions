import { PrismaService } from '../prisma.service';
export declare class CampaignsService {
    private prisma;
    constructor(prisma: PrismaService);
    createCampaign(storeId: string, data: {
        title: string;
        description?: string;
        discountPercentage: number;
        animationType?: string;
        endsAt?: Date;
        productIds: string[];
    }): Promise<{
        id: string;
        isActive: boolean;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        title: string;
        discountPercentage: number;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    }>;
    getActiveCampaigns(storeId: string): Promise<({
        products: {
            id: string;
            name: string;
            isActive: boolean;
            imageUrl: string | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            barcode: string | null;
            internalSku: string;
            category: string | null;
            mrp: number;
            sellingPrice: number;
            purchaseCost: number | null;
            gstRate: number;
            gstClass: import(".prisma/client").$Enums.GSTClass;
            subscriptionDiscount: number;
            campaignId: string | null;
        }[];
    } & {
        id: string;
        isActive: boolean;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        title: string;
        discountPercentage: number;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    })[]>;
    endCampaign(campaignId: string): Promise<{
        id: string;
        isActive: boolean;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        title: string;
        discountPercentage: number;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    }>;
}
