import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/fulfillment'
})
export class FulfillmentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('FulfillmentGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to fulfillment stream: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from fulfillment stream: ${client.id}`);
  }

  /**
   * Called by backend services when a delivery status changes 
   * (e.g. PACKING -> OUT_FOR_DELIVERY)
   */
  broadcastDeliveryUpdate(orderId: string, status: string, location?: { lat: number; lng: number }) {
    this.server.emit(`order_${orderId}_update`, {
      orderId,
      status,
      location,
      timestamp: new Date().toISOString()
    });
    this.logger.log(`Broadcasted fulfillment update for Order ${orderId}: ${status}`);
  }

  /**
   * Delivery Partners or Store Managers can manually emit status pings.
   */
  @SubscribeMessage('ping_delivery_location')
  handleLocationPing(client: Socket, payload: { orderId: string, lat: number, lng: number }) {
    // Broadcast to consumers watching this order
    this.server.emit(`order_${payload.orderId}_location`, {
      lat: payload.lat,
      lng: payload.lng,
      timestamp: new Date().toISOString()
    });
  }
}
