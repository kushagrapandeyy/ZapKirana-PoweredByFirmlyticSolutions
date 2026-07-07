import { PrismaService } from '../prisma.service';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    private readonly EXPO_PUSH_URL;
    constructor(prisma: PrismaService);
    sendPush(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void>;
    broadcastToStore(storeId: string, title: string, body: string, data?: Record<string, any>): Promise<void>;
    handlePurchaseOrderCreated(po: any): Promise<void>;
    handleLowStock(event: {
        storeId: string;
        productId: string;
        onHandQty: number;
    }): Promise<void>;
    handleSubscriptionOrderCreated(event: {
        customerId: string;
        orderId: string;
        productCount: number;
    }): Promise<void>;
    handleOrderOutForDelivery(event: {
        customerId: string;
        orderId: string;
    }): Promise<void>;
    handleOrderDelivered(event: {
        customerId: string;
        orderId: string;
    }): Promise<void>;
}
