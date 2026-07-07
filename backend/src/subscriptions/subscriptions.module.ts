import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaService } from '../prisma.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SubscriptionsCron } from './subscriptions.cron';

import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [RealtimeModule, EventEmitterModule.forRoot(), OrdersModule],
  providers: [SubscriptionsService, PrismaService, SubscriptionsCron],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

