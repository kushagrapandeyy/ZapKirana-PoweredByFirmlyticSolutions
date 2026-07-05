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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma.service");
const jwt_1 = require("@nestjs/jwt");
let SupportGateway = class SupportGateway {
    prisma;
    jwtService;
    server;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.data.user = payload;
        }
        catch (e) {
            client.disconnect();
        }
    }
    handleJoinTicket(data, client) {
        client.join(`ticket_${data.ticketId}`);
    }
    async handleMessage(data, client) {
        const userId = client.data.user.sub || client.data.user.id;
        const message = await this.prisma.ticketMessage.create({
            data: {
                ticketId: data.ticketId,
                senderId: userId,
                text: data.text,
                isInternal: data.isInternal || false,
            },
            include: {
                sender: true,
            },
        });
        this.server.to(`ticket_${data.ticketId}`).emit('new_message', message);
        return message;
    }
};
exports.SupportGateway = SupportGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SupportGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_ticket'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], SupportGateway.prototype, "handleJoinTicket", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], SupportGateway.prototype, "handleMessage", null);
exports.SupportGateway = SupportGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'support',
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], SupportGateway);
//# sourceMappingURL=support.gateway.js.map