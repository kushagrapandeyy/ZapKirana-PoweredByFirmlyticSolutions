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
        storeId: string;
        isActive: boolean;
        description: string | null;
        title: string;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    }>;
    getActiveCampaigns(storeId: string): Promise<({
        products: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            itemType: string | null;
            productId: string;
            legacyCode: string | null;
            displayName: string | null;
            type: string | null;
            isHidden: boolean;
            allowDecimalQty: boolean;
            packagingText: string | null;
            colorType: string | null;
            groupId: string | null;
            manufacturerLegacyRef: string | null;
            createdBy: string | null;
            updatedBy: string | null;
            source: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        isActive: boolean;
        description: string | null;
        title: string;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    })[]>;
    endCampaign(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        isActive: boolean;
        description: string | null;
        title: string;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    }>;
}
