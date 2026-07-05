import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveryService } from './delivery.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'delivery',
  cors: { origin: process.env.NODE_ENV === 'production' ? ['https://consumer.zapkirana.app', 'https://vendor.zapkirana.app'] : '*' },
})
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DeliveryGateway.name);

  constructor(
    private deliveryService: DeliveryService,
    private jwtService: JwtService
  ) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization;
    if (!token) {
      this.logger.warn(`Rejected unauthenticated WS connection: ${client.id}`);
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      client.data.user = payload;
      this.logger.log(`Client authenticated & connected: ${client.id} (User: ${payload.sub})`);
    } catch (e) {
      this.logger.warn(`Invalid WS token: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Consumer joins a room to track their order.
   * Emit: { orderId: string }
   */
  @SubscribeMessage('join_order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const room = `order_${data.orderId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joined', room };
  }

  /**
   * Delivery staff sends their live GPS location.
   * Emit: { orderId: string, lat: number, lng: number, staffId: string }
   * Broadcasts to all consumers watching this order.
   */
  @SubscribeMessage('location_update')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; lat: number; lng: number; staffId: string },
  ) {
    const room = `order_${data.orderId}`;

    // Persist last known location to DB (REST fallback for cold-start)
    await this.deliveryService.updateLastLocation(data.orderId, data.lat, data.lng);

    // Broadcast to all consumers watching this order
    this.server.to(room).emit('location_broadcast', {
      orderId: data.orderId,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Internal method — called by OrdersService when status changes.
   * Pushes status transitions to all watchers in real-time.
   */
  broadcastStatusChange(orderId: string, status: string) {
    const room = `order_${orderId}`;
    this.server.to(room).emit('order_status_change', { orderId, status, timestamp: new Date().toISOString() });
  }

  /**
   * Listens for order status changes emitted by OrdersService (via EventEmitter2).
   * Avoids circular dependency — OrdersService → EventEmitter → DeliveryGateway.
   */
  @OnEvent('order.status_changed')
  handleOrderStatusChanged(event: { orderId: string; status: string; customerId: string }) {
    this.broadcastStatusChange(event.orderId, event.status);
    this.logger.log(`WS broadcast: order ${event.orderId} → ${event.status}`);
  }
}
