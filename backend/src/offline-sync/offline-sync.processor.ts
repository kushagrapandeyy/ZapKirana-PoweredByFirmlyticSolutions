import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '@prisma/client';

@Injectable()
export class OfflineSyncProcessor {
  private readonly logger = new Logger(OfflineSyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private inventory: InventoryService
  ) {}

  @OnEvent('offline.event.received')
  async handleOfflineEvent(payload: { storeId: string, inboxEventId: string, operationType: string }) {
    this.logger.debug(`Processing offline event: ${payload.inboxEventId}`);

    const event = await this.prisma.offlineSyncEvent.findUnique({ where: { id: payload.inboxEventId } });
    if (!event || event.status !== 'PENDING') return;

    try {
      if (event.operationType === 'POS_SALE') {
        await this.processPosSale(event);
      } else {
        throw new Error(`Unknown operation type: ${event.operationType}`);
      }

      await this.prisma.offlineSyncEvent.update({
        where: { id: event.id },
        data: { status: 'PROCESSED', processedAt: new Date() }
      });

    } catch (e) {
      this.logger.warn(`Conflict resolving offline event ${event.id}: ${e.message}`);
      await this.prisma.offlineSyncEvent.update({
        where: { id: event.id },
        data: { status: 'CONFLICT', conflictReason: e.message, processedAt: new Date() }
      });
    }
  }

  private async processPosSale(event: any) {
    const saleData = event.payload;
    // Example format: { items: [{ productId, quantity }], totalAmount: 100 }

    for (const item of saleData.items) {
      try {
        await this.inventory.recordMovement({
          storeId: event.storeId,
          storeProductId: item.storeProductId,
          type: 'POS_SALE' as MovementType,
          quantityChange: item.quantity,
          sourceType: 'OFFLINE_POS_SALE',
          sourceId: event.idempotencyKey,
        });
      } catch (error) {
        throw new Error(`Insufficient stock for offline sale of ${item.storeProductId}: ${error.message}`);
      }
    }

    // Emit higher-level system event to trigger payment ledgering
    await this.eventBus.publish('pos.sale.completed', {
      storeId: event.storeId,
      saleData,
      sourceEventId: event.id,
    });
  }
}
