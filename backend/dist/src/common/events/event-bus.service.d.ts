import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';
export interface EventPayload {
    storeId: string;
    [key: string]: any;
}
export declare class EventBusService {
    private eventEmitter;
    private readonly eventQueue;
    private readonly logger;
    constructor(eventEmitter: EventEmitter2, eventQueue: Queue);
    publish(eventName: string, payload: EventPayload): Promise<void>;
}
