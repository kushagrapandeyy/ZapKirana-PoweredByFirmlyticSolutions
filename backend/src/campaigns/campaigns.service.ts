import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async createCampaign(storeId: string, data: { title: string; description?: string; discountPercentage: number; animationType?: string; endsAt?: Date; productIds: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the campaign
      const campaign = await tx.storeCampaign.create({
        data: {
          storeId,
          title: data.title,
          description: data.description,
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
        const product = await tx.product.findUnique({ where: { id: pId } });
        if (product && product.storeId === storeId) {
          await tx.product.update({
            where: { id: pId },
            data: { campaignId: campaign.id },
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
      await tx.product.updateMany({
        where: { campaignId },
        data: { campaignId: null },
      });

      return campaign;
    });
  }
}
