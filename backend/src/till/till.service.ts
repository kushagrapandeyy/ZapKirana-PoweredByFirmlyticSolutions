import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TillService {
  constructor(private prisma: PrismaService) {}

  async getActiveTill(storeId: string) {
    return this.prisma.till.findFirst({
      where: { storeId, status: 'OPEN' },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async openTill(storeId: string, openingBalance: number) {
    const active = await this.getActiveTill(storeId);
    if (active) throw new BadRequestException('A till is already open for this store');

    return this.prisma.till.create({
      data: {
        storeId,
        openingBalance,
        expectedBalance: openingBalance,
        status: 'OPEN',
      },
    });
  }

  async logTransaction(tillId: string, type: 'CASH_IN' | 'CASH_OUT' | 'EXPENSE' | 'SALE', amount: number, reason?: string) {
    const till = await this.prisma.till.findUnique({ where: { id: tillId } });
    if (!till || till.status !== 'OPEN') throw new BadRequestException('Invalid or closed till');

    let delta = 0;
    if (type === 'CASH_IN' || type === 'SALE') delta = amount;
    else if (type === 'CASH_OUT' || type === 'EXPENSE') delta = -amount;

    await this.prisma.$transaction([
      this.prisma.tillTransaction.create({
        data: {
          tillId,
          type,
          amount,
          reason,
        },
      }),
      this.prisma.till.update({
        where: { id: tillId },
        data: {
          expectedBalance: { increment: delta },
        },
      }),
    ]);

    return this.getActiveTill(till.storeId);
  }

  async closeTill(tillId: string, actualClosingBalance: number) {
    const till = await this.prisma.till.findUnique({ where: { id: tillId } });
    if (!till || till.status !== 'OPEN') throw new BadRequestException('Invalid or closed till');

    const discrepancy = actualClosingBalance - (till.expectedBalance as any).toNumber();

    return this.prisma.till.update({
      where: { id: tillId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingBalance: actualClosingBalance,
        discrepancy,
      },
    });
  }
}
