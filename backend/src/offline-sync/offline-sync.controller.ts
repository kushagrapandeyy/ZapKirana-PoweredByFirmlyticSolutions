import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StoreScopeGuard } from '../common/guards/store-scope.guard';
import { PrismaService } from '../prisma.service';
import { EventBusService } from '../common/events/event-bus.service';

export class SyncBatchDto {
  deviceId: string;
  events: {
    localEventId: string;
    idempotencyKey: string;
    operationType: string;
    payload: any;
    baseVersion?: number;
    createdAtDevice: string;
  }[];
}

@Controller('offline-sync')
@UseGuards(JwtAuthGuard, StoreScopeGuard)
export class OfflineSyncController {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService
  ) {}

  @Post('batch/:storeId')
  async receiveBatch(@Req() req: any, @Body() body: SyncBatchDto) {
    const storeId = req.params.storeId;
    const deviceId = body.deviceId;
    const results = [];

    for (const ev of body.events) {
      // Idempotency Check: if it already exists, ignore
      const existing = await this.prisma.offlineSyncEvent.findUnique({
        where: { storeId_localEventId_deviceId: { storeId, localEventId: ev.localEventId, deviceId } }
      });

      if (existing) {
        results.push({ localEventId: ev.localEventId, status: existing.status });
        continue;
      }

      // Store in Inbox
      const inboxEvent = await this.prisma.offlineSyncEvent.create({
        data: {
          storeId,
          deviceId,
          localEventId: ev.localEventId,
          idempotencyKey: ev.idempotencyKey,
          operationType: ev.operationType,
          payload: ev.payload,
          baseVersion: ev.baseVersion,
          createdAtDevice: new Date(ev.createdAtDevice),
        }
      });

      // Route to Event Bus for processing
      await this.eventBus.publish('offline.event.received', {
        storeId,
        inboxEventId: inboxEvent.id,
        operationType: ev.operationType,
      });

      results.push({ localEventId: ev.localEventId, status: 'PENDING' });
    }

    return { success: true, processed: results.length, results };
  }
}
