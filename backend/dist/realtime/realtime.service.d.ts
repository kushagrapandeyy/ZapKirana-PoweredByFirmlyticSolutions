export declare class RealtimeService {
    private readonly supabase;
    private readonly logger;
    constructor();
    broadcastOrderUpdate(storeId: string, orderId: string, payload: any): Promise<void>;
    broadcastInventoryUpdate(storeId: string, productId: string, payload: any): Promise<void>;
}
