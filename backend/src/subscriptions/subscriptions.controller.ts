import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() body: any) {
    return this.subscriptionsService.createSubscription(body);
  }

  @Get()
  getAll(@Query('customerId') customerId: string) {
    return this.subscriptionsService.getSubscriptions(customerId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionById(id);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.subscriptionsService.pauseSubscription(id);
  }

  @Patch(':id/resume')
  resume(@Param('id') id: string) {
    return this.subscriptionsService.resumeSubscription(id);
  }

  @Patch(':id/items')
  updateItems(@Param('id') id: string, @Body() body: { items: any[] }) {
    return this.subscriptionsService.updateSubscriptionItems(id, body.items);
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(id);
  }

  // Admin/Cron endpoint to process due subscriptions
  @Post('process')
  processActive() {
    return this.subscriptionsService.processActiveSubscriptions();
  }
}
