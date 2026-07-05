import { CampaignsService } from './campaigns.service';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    createCampaign(body: {
        storeId: string;
        title: string;
        description?: string;
        discountPercentage: number;
        animationType?: string;
        endsAt?: Date;
        productIds: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
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
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            imageUrl: string | null;
            description: string | null;
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
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        storeId: string;
        title: string;
        discountPercentage: number;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    })[]>;
    endCampaign(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        storeId: string;
        title: string;
        discountPercentage: number;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    }>;
}
