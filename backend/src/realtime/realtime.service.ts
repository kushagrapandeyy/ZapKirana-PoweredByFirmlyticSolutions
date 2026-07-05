import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class RealtimeService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(RealtimeService.name);

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async broadcastOrderUpdate(storeId: string, orderId: string, payload: any) {
    try {
      // Broadcast to vendor (store-level)
      await this.supabase.channel(`store:${storeId}:orders`).send({
        type: 'broadcast',
        event: 'order_update',
        payload,
      });

      // Broadcast to consumer (order-level)
      await this.supabase.channel(`order:${orderId}`).send({
        type: 'broadcast',
        event: 'order_status_change',
        payload,
      });

      this.logger.log(`Broadcasted order update for order ${orderId} in store ${storeId}`);
    } catch (error) {
      this.logger.error(`Error broadcasting order update: ${error}`);
    }
  }

  async broadcastInventoryUpdate(storeId: string, productId: string, payload: any) {
    try {
      // Broadcast to consumers looking at the store
      await this.supabase.channel(`store:${storeId}:inventory`).send({
        type: 'broadcast',
        event: 'inventory_update',
        payload: { productId, ...payload },
      });
    } catch (error) {
      this.logger.error(`Error broadcasting inventory update: ${error}`);
    }
  }

  async broadcastSubscriptionUpdate(storeId: string, payload: any) {
    try {
      await this.supabase.channel(`store:${storeId}:subscriptions`).send({
        type: 'broadcast',
        event: 'subscription_update',
        payload,
      });
      this.logger.log(`Broadcasted subscription update for store ${storeId}`);
    } catch (error) {
      this.logger.error(`Error broadcasting subscription update: ${error}`);
    }
  }
}
