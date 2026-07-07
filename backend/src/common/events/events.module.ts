import { Global, Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { EventBusService } from './event-bus.service';

const queueDriver = process.env.QUEUE_DRIVER || 'memory';
const imports = [];
const providers: any[] = [EventBusService];

if (queueDriver === 'redis') {
  imports.push(BullModule.registerQueue({ name: 'basko-events' }));
} else {
  providers.push({
    provide: getQueueToken('basko-events'),
    useValue: {
      add: async (name: string) => {
        console.log(`[Memory Queue] Job ${name} executed in memory (Redis disabled).`);
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
