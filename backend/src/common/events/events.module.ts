import { Global, Module, Logger } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { EventBusService } from './event-bus.service';

const queueDriver = process.env.QUEUE_DRIVER || 'memory';
const imports = [];
const providers: any[] = [EventBusService];

const memoryQueueLogger = new Logger('MemoryQueue');

if (queueDriver === 'redis') {
  imports.push(BullModule.registerQueue({ name: 'basko-events' }));
} else {
  providers.push({
    provide: getQueueToken('basko-events'),
    useValue: {
      add: async (name: string) => {
        memoryQueueLogger.debug(`Job "${name}" queued in-memory (set QUEUE_DRIVER=redis for production).`);
      }
    }
  });
}

@Global()
@Module({
  imports,
  providers,
  exports: [EventBusService],
})
export class EventsModule {}
