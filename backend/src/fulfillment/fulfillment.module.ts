import { Module } from '@nestjs/common';
import { FulfillmentGateway } from './fulfillment.gateway';

/**
 * FulfillmentModule — WebSocket gateway for real-time delivery status
 * Clients subscribe to `order_{id}_update` and `order_{id}_location` events.
 * Namespace: /fulfillment
 */
@Module({
  providers: [FulfillmentGateway],
  exports: [FulfillmentGateway],
})
export class FulfillmentModule {}
