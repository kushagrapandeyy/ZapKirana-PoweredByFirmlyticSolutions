import { PrismaService } from '../prisma.service';
export declare class RealtimeService {
    private prisma;
    private readonly supabase;
    private readonly logger;
    constructor(prisma: PrismaService);
    broadcastOrderUpdate(storeId: string, orderId: string, payload: any): Promise<void>;
    broadcastInventoryUpdate(storeId: string, productId: string, payload: any): Promise<void>;
    broadcastSubscriptionUpdate(storeId: string, payload: any): Promise<void>;
    handleOrderStatusChanged(event: {
        orderId: string;
        status: string;
        customerId: string;
    }): Promise<void>;
}
