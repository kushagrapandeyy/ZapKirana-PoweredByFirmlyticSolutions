import { PrismaService } from '../prisma.service';
import { EventBusService } from '../common/events/event-bus.service';
import { InventoryService } from '../inventory/inventory.service';
export declare class OfflineSyncProcessor {
    private prisma;
    private eventBus;
    private inventory;
    private readonly logger;
    constructor(prisma: PrismaService, eventBus: EventBusService, inventory: InventoryService);
    handleOfflineEvent(payload: {
        storeId: string;
        inboxEventId: string;
        operationType: string;
    }): Promise<void>;
    private processPosSale;
}
