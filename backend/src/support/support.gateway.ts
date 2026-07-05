import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'support',
  cors: { origin: '*' },
})
export class SupportGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
    } catch (e) {
      client.disconnect();
    }
  }

  @SubscribeMessage('join_ticket')
  handleJoinTicket(@MessageBody() data: { ticketId: string }, @ConnectedSocket() client: Socket) {
    client.join(`ticket_${data.ticketId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { ticketId: string; text: string; isInternal?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
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
}
