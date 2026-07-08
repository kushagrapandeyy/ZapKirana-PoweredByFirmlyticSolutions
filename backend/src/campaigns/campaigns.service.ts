import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async createCampaign(storeId: string, data: { title: string; description?: string; type?: string; imageUrl?: string; displayOrder?: number; discountPercentage: number; animationType?: string; endsAt?: Date; productIds: string[] }) {
    // Enforce limits
    const activeCampaigns = await this.prisma.storeCampaign.findMany({
      where: { storeId, isActive: true },
      select: { type: true },
    });

    if (activeCampaigns.length >= 15) {
      throw new BadRequestException('Maximum limit of 15 active campaigns reached for this store.');
    }

    const campaignType = data.type || 'OFFER';
    if (campaignType === 'BANNER') {
      const activeBanners = activeCampaigns.filter(c => c.type === 'BANNER').length;
      if (activeBanners >= 3) {
        throw new BadRequestException('Maximum limit of 3 active banners reached. End an existing banner to create a new one.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the campaign
      const campaign = await tx.storeCampaign.create({
        data: {
          storeId,
          title: data.title,
          description: data.description,
          type: campaignType,
          imageUrl: data.imageUrl,
          displayOrder: data.displayOrder || 0,
          discountPercentage: data.discountPercentage,
          animationType: data.animationType || 'DEFAULT',
          endsAt: data.endsAt,
        },
      });

      // 2. Attach products to campaign and apply discount directly to their sellingPrice?
      // Wait, if it's a dynamic campaign, we shouldn't overwrite sellingPrice. Instead, we just link the campaign. 
      // In getProducts(), we can apply the discount on the fly, or the client can do it.
      // Or we can just set originalPrice = sellingPrice and change sellingPrice. 
      // Let's just associate them.
      
      for (const pId of data.productIds) {
        // Ensure product belongs to the store
        const product = await tx.storeProduct.findUnique({ where: { id: pId } });
        if (product && product.storeId === storeId) {
          await tx.storeProduct.update({
            where: { id: pId },
            data: { campaigns: { connect: { id: campaign.id } } },
          });
        }
      }

      return campaign;
    });
  }

  async getActiveCampaigns(storeId: string) {
    return this.prisma.storeCampaign.findMany({
      where: {
        storeId,
        isActive: true,
      },
      include: {
        products: true,
      }
    });
  }

  async endCampaign(campaignId: string) {
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.storeCampaign.update({
        where: { id: campaignId },
        data: { isActive: false, endsAt: new Date() },
      });

      // Remove campaign from products
      await tx.storeCampaign.update({
        where: { id: campaignId },
        data: { products: { set: [] } },
      });

      return campaign;
    });
  }
}
