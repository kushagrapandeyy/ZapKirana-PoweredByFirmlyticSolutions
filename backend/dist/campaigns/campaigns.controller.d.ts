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
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        type: string;
        title: string;
        displayOrder: number;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    }>;
    getActiveCampaigns(storeId: string): Promise<({
        products: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string;
            productId: string;
            itemType: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            type: string | null;
            createdBy: string | null;
            status: string;
            source: string | null;
            legacyCode: string | null;
            displayName: string | null;
            isHidden: boolean;
            allowDecimalQty: boolean;
            packagingText: string | null;
            colorType: string | null;
            groupId: string | null;
            manufacturerLegacyRef: string | null;
            updatedBy: string | null;
        }[];
    } & {
        id: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        type: string;
        title: string;
        displayOrder: number;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    })[]>;
    endCampaign(id: string): Promise<{
        id: string;
        isActive: boolean;
        imageUrl: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        type: string;
        title: string;
        displayOrder: number;
        discountPercentage: import("@prisma/client/runtime/library").Decimal;
        animationType: string;
        startsAt: Date;
        endsAt: Date | null;
    }>;
}
