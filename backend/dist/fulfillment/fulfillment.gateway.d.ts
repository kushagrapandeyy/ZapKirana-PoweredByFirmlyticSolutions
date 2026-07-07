import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class FulfillmentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    broadcastDeliveryUpdate(orderId: string, status: string, location?: {
        lat: number;
        lng: number;
    }): void;
    handleLocationPing(client: Socket, payload: {
        orderId: string;
        lat: number;
        lng: number;
    }): void;
}
