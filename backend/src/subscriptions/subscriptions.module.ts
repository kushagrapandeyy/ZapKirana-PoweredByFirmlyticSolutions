import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaService } from '../prisma.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [RealtimeModule, EventEmitterModule.forRoot()],
  providers: [SubscriptionsService, PrismaService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

