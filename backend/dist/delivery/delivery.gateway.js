"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeliveryGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const delivery_service_1 = require("./delivery.service");
const jwt_1 = require("@nestjs/jwt");
let DeliveryGateway = DeliveryGateway_1 = class DeliveryGateway {
    deliveryService;
    jwtService;
    server;
    logger = new common_1.Logger(DeliveryGateway_1.name);
    constructor(deliveryService, jwtService) {
        this.deliveryService = deliveryService;
        this.jwtService = jwtService;
    }
    handleConnection(client) {
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
        }
        catch (e) {
            this.logger.warn(`Invalid WS token: ${client.id}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinOrder(client, data) {
        const room = `order_${data.orderId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} joined room ${room}`);
        return { event: 'joined', room };
    }
    async handleLocationUpdate(client, data) {
        const room = `order_${data.orderId}`;
        await this.deliveryService.updateLastLocation(data.orderId, data.lat, data.lng);
        this.server.to(room).emit('location_broadcast', {
            orderId: data.orderId,
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date().toISOString(),
        });
    }
    broadcastStatusChange(orderId, status) {
        const room = `order_${orderId}`;
        this.server.to(room).emit('order_status_change', { orderId, status, timestamp: new Date().toISOString() });
    }
    handleOrderStatusChanged(event) {
        this.broadcastStatusChange(event.orderId, event.status);
        this.logger.log(`WS broadcast: order ${event.orderId} → ${event.status}`);
    }
};
exports.DeliveryGateway = DeliveryGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], DeliveryGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_order'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], DeliveryGateway.prototype, "handleJoinOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('location_update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], DeliveryGateway.prototype, "handleLocationUpdate", null);
__decorate([
    (0, event_emitter_1.OnEvent)('order.status_changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeliveryGateway.prototype, "handleOrderStatusChanged", null);
exports.DeliveryGateway = DeliveryGateway = DeliveryGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'delivery',
        cors: { origin: process.env.NODE_ENV === 'production' ? ['https://consumer.zapkirana.app', 'https://vendor.zapkirana.app'] : '*' },
    }),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService,
        jwt_1.JwtService])
], DeliveryGateway);
//# sourceMappingURL=delivery.gateway.js.map