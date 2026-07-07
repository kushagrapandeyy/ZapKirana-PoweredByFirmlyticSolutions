import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export interface EventPayload {
  storeId: string;
  [key: string]: any;
}

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    @InjectQueue('basko-events') private readonly eventQueue: Queue
  ) {}

  /**
   * Publish an event synchronously (in-memory) and asynchronously (BullMQ)
   * This ensures immediate execution for fast modules, and persistent delivery for offline/slow modules.
   */
  async publish(eventName: string, payload: EventPayload) {
    this.logger.debug(`[Event Bus] Publishing Event: ${eventName} for Store: ${payload.storeId}`);

    // Synchronous execution for immediate system reactions
    this.eventEmitter.emit(eventName, payload);

    // Asynchronous background job for robust processing (Ledgers, Analytics)
    try {
      await this.eventQueue.add(eventName, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      });
    } catch (e) {
      this.logger.error(`Failed to push event to BullMQ: ${e.message}`);
      // Fallback or alert
    }
  }
}
