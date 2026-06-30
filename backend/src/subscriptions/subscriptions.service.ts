import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SubscriptionFrequency, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async createSubscription(data: {
    customerId: string;
    storeId: string;
    frequency: SubscriptionFrequency;
    deliverySlot?: string;
    items: { productId: string; productName: string; quantity: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const nextDeliveryDate = this.calculateNextDelivery(data.frequency);

    return this.prisma.subscription.create({
      data: {
        customerId: data.customerId,
        storeId: data.storeId,
        frequency: data.frequency,
        deliverySlot: data.deliverySlot,
        nextDeliveryDate,
        status: SubscriptionStatus.ACTIVE,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getSubscriptions(customerId: string) {
    return this.prisma.subscription.findMany({
      where: { customerId },
      include: {
        items: true,
        store: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionById(id: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { items: true, store: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async pauseSubscription(id: string) {
    return this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.PAUSED },
    });
  }

  async resumeSubscription(id: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');

    const nextDeliveryDate = this.calculateNextDelivery(sub.frequency);
    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextDeliveryDate,
      },
    });
  }

  async cancelSubscription(id: string) {
    return this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
  }

  async updateSubscriptionItems(id: string, items: { productId: string; productName: string; quantity: number }[]) {
    // Delete existing items and recreate
    await this.prisma.subscriptionItem.deleteMany({ where: { subscriptionId: id } });
    
    return this.prisma.subscription.update({
      where: { id },
      data: {
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  }

  private calculateNextDelivery(frequency: SubscriptionFrequency): Date {
    const now = new Date();
    switch (frequency) {
      case 'DAILY':
        now.setDate(now.getDate() + 1);
        now.setHours(7, 0, 0, 0); // 7 AM next day
        break;
      case 'WEEKLY':
        now.setDate(now.getDate() + 7);
        break;
      case 'BIWEEKLY':
        now.setDate(now.getDate() + 14);
        break;
      case 'MONTHLY':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now;
  }

  // Called by a cron/scheduled task to auto-create orders from active subscriptions
  async processActiveSubscriptions() {
    const now = new Date();
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextDeliveryDate: { lte: now },
      },
      include: { items: true, customer: { include: { savedAddresses: true } } },
    });

    const results: any[] = [];
    for (const sub of dueSubscriptions) {
      try {
        // Auto-create order (would call OrdersService in production)
        const nextDeliveryDate = this.calculateNextDelivery(sub.frequency);
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { nextDeliveryDate },
        });
        results.push({ subscriptionId: sub.id, status: 'processed', nextDeliveryDate });
      } catch (err) {
        results.push({ subscriptionId: sub.id, status: 'failed', error: err.message });
      }
    }
    return results;
  }
}
