import { Controller, Get, Post, Patch, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';

import { SubscriptionsService } from './subscriptions.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() body: any) {
    return this.subscriptionsService.createSubscription(body);
  }

  @Public()
  @Get()
  getAll(@Query('customerId') customerId: string) {
    return this.subscriptionsService.getSubscriptions(customerId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionById(id);
  }

  @Public()
  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.subscriptionsService.pauseSubscription(id);
  }

  @Public()
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

  // Manual trigger alias — same as process, explicit name for dashboards
  @Post('process-now')
  processNow() {
    return this.subscriptionsService.processActiveSubscriptions();
  }

  // GET /subscriptions/store/:storeId — all subscriptions for a store (vendor dashboard)
  @Get('store/:storeId')
  getStoreSubscriptions(@Param('storeId') storeId: string) {
    return this.subscriptionsService.getStoreSubscriptions(storeId);
  }

  // GET /subscriptions/due-today?storeId=x — count of subscriptions firing today
  @Get('due-today')
  getDueTodayCount(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.subscriptionsService.getDueTodayCount(storeId);
  }
}
