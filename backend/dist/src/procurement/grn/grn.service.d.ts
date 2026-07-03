import { PrismaService } from '../../prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class GrnService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    receiveGoods(poId: string, receivedItems: {
        poItemId: string;
        receivedQuantity: number;
    }[], staffId: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            purchasePrice: number;
            quantity: number;
            acceptedQuantity: number;
            receivedQuantity: number;
            poId: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.POStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        notes: string | null;
        totalAmount: number;
        supplierId: string;
        expectedDeliveryDate: Date | null;
        shareToken: string | null;
        shareTokenExpiresAt: Date | null;
    }>;
}
