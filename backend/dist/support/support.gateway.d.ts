import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class SupportGateway implements OnGatewayConnection {
    private prisma;
    private jwtService;
    server: Server;
    constructor(prisma: PrismaService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleJoinTicket(data: {
        ticketId: string;
    }, client: Socket): void;
    handleMessage(data: {
        ticketId: string;
        text: string;
        isInternal?: boolean;
    }, client: Socket): Promise<{
        sender: {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            storeId: string | null;
            role: import(".prisma/client").$Enums.Role;
            email: string;
            password: string | null;
            pin: string | null;
            phone: string | null;
            avatarUrl: string | null;
            isVerified: boolean;
            pushToken: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        senderId: string;
        text: string;
        isInternal: boolean;
        ticketId: string;
    }>;
}
