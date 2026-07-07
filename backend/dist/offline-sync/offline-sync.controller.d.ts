import { PrismaService } from '../prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
export declare class SyncBatchDto {
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
export declare class OfflineSyncController {
    private prisma;
    private eventBus;
    constructor(prisma: PrismaService, eventBus: EventBusService);
    receiveBatch(req: any, body: SyncBatchDto): Promise<{
        success: boolean;
        processed: number;
        results: {
            localEventId: string;
            status: string;
        }[];
    }>;
}
