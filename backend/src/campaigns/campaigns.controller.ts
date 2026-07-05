import { Controller, Post, Get, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  async createCampaign(@Body() body: { storeId: string; title: string; description?: string; discountPercentage: number; animationType?: string; endsAt?: Date; productIds: string[] }) {
    if (!body.storeId || !body.title || !body.discountPercentage || !body.productIds) {
      throw new BadRequestException('storeId, title, discountPercentage, and productIds are required');
    }
    return this.campaignsService.createCampaign(body.storeId, body);
  }

  @Public()
  @Get()
  async getActiveCampaigns(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.campaignsService.getActiveCampaigns(storeId);
  }

  @Post(':id/end')
  async endCampaign(@Param('id') id: string) {
    return this.campaignsService.endCampaign(id);
  }
}
