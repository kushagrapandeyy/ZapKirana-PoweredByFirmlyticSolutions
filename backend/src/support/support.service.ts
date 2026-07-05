import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(data: any) {
    return this.prisma.supportTicket.create({
      data,
    });
  }

  async getTickets(query: any) {
    return this.prisma.supportTicket.findMany({
      where: query,
      include: {
        customer: true,
        store: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
        },
        customer: true,
        store: true,
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicketStatus(id: string, status: any) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
  }

  async interveneOrder(orderId: string, status: any, reason: string, adminId: string) {
    // Audit the intervention
    await this.prisma.auditLog.create({
      data: {
        action: 'ORDER_INTERVENTION',
        entityType: 'Order',
        entityId: orderId,
        userId: adminId,
        details: `Force status to ${status}. Reason: ${reason}`,
      }
    });

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
