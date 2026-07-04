import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';
import { SubscriptionFrequency, SubscriptionStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createSubscription(data: {
    customerId: string;
    storeId: string;
    frequency: SubscriptionFrequency;
    customDays?: any;
    discountApplied?: number;
    deliverySlot?: string;
    items: { productId: string; productName: string; quantity: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const nextDeliveryDate = this.calculateNextDelivery(data.frequency, data.customDays);

    return this.prisma.subscription.create({
      data: {
        customerId: data.customerId,
        storeId: data.storeId,
        frequency: data.frequency,
        customDays: data.customDays || null,
        discountApplied: data.discountApplied || 0,
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

  private calculateNextDelivery(frequency: SubscriptionFrequency, customDays?: any): Date {
    const now = new Date();
    // Default start looking at tomorrow
    now.setDate(now.getDate() + 1);
    now.setHours(7, 0, 0, 0); // 7 AM next day

    switch (frequency) {
      case 'DAILY':
        break; // already tomorrow
      case 'WEEKLY':
        now.setDate(now.getDate() + 6); // +1 above, +6 = +7
        break;
      case 'BIWEEKLY':
        now.setDate(now.getDate() + 13);
        break;
      case 'MONTHLY':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'CUSTOM':
        if (customDays && Array.isArray(customDays) && customDays.length > 0) {
           for (let i = 0; i < 7; i++) {
             const dayStr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
             if (customDays.includes(dayStr)) {
               break;
             }
             now.setDate(now.getDate() + 1);
           }
        }
        break;
    }
    return now;
  }

  // ─── Cron: runs every day at 5 AM ───────────────────────────────────────
  @Cron('0 5 * * *')
  async runDailySubscriptionCron() {
    this.logger.log('Running daily subscription processing cron...');
    const results = await this.processActiveSubscriptions();
    this.logger.log(`Subscription cron complete: ${results.length} processed`);
  }

  // ─── Process Due Subscriptions (also called by cron + manual trigger) ────
  async processActiveSubscriptions() {
    const now = new Date();
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextDeliveryDate: { lte: now },
      },
      include: {
        items: true,
        customer: { include: { savedAddresses: true } },
      },
    });

    const results: any[] = [];
    for (const sub of dueSubscriptions) {
      try {
        // 1. Find default delivery address
        const defaultAddress = sub.customer.savedAddresses.find((a) => a.isDefault);

        // 2. Create the actual order
        const orderItems = sub.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: 0, // Will be resolved in order creation
          gstAtOrder: 0,
        }));

        const order = await this.prisma.order.create({
          data: {
            storeId: sub.storeId,
            customerId: sub.customerId,
            status: OrderStatus.PAYMENT_PENDING,
            totalAmount: 0, // Recalculated below
            subscriptionId: sub.id,
            deliveryAddress: defaultAddress?.address,
            deliveryLat: defaultAddress?.latitude,
            deliveryLng: defaultAddress?.longitude,
            items: { create: orderItems },
          },
          include: { items: true },
        });

        // 3. Advance nextDeliveryDate
        const nextDeliveryDate = this.calculateNextDelivery(sub.frequency);
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { nextDeliveryDate },
        });

        // 4. Fire push notification event
        this.eventEmitter.emit('subscription.order_created', {
          customerId: sub.customerId,
          orderId: order.id,
          productCount: sub.items.length,
        });

        results.push({ subscriptionId: sub.id, orderId: order.id, status: 'processed', nextDeliveryDate });
      } catch (err: any) {
        this.logger.error(`Failed to process subscription ${sub.id}: ${err.message}`);
        results.push({ subscriptionId: sub.id, status: 'failed', error: err.message });
      }
    }
    return results;
  }

  // ─── Store-level view (for vendor dashboard) ──────────────────────────────
  async getStoreSubscriptions(storeId: string) {
    return this.prisma.subscription.findMany({
      where: { storeId },
      include: {
        items: true,
        customer: { select: { id: true, name: true, phone: true, avatarUrl: true } },
      },
      orderBy: { nextDeliveryDate: 'asc' },
    });
  }

  // ─── Count subscriptions due today (store ops planning) ──────────────────
  async getDueTodayCount(storeId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.prisma.subscription.count({
      where: {
        storeId,
        status: SubscriptionStatus.ACTIVE,
        nextDeliveryDate: { gte: startOfDay, lte: endOfDay },
      },
    });
    return { storeId, dueToday: count, date: startOfDay.toISOString().substring(0, 10) };
  }
}
