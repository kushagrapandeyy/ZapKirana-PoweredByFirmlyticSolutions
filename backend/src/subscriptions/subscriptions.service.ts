import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SubscriptionFrequency, SubscriptionStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private realtimeService: RealtimeService,
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

    const results = [];
    
    // Group by store and customer to create "Bundles"
    const groupedSubs = new Map<string, any[]>();
    for (const sub of dueSubscriptions) {
      const key = `${sub.storeId}_${sub.customerId}`;
      if (!groupedSubs.has(key)) groupedSubs.set(key, []);
      groupedSubs.get(key)!.push(sub);
    }

    for (const [key, subs] of groupedSubs.entries()) {
      try {
        const firstSub = subs[0];
        const defaultAddress = firstSub.customer.savedAddresses.find((a: any) => a.isDefault) || firstSub.customer.savedAddresses[0];

        // Combine items from all subscriptions in this bundle
        const combinedItems: any[] = [];
        let totalAmount = 0;
        let totalSavings = 0;
        
        for (const sub of subs) {
          for (const item of sub.items) {
            combinedItems.push({
              productId: item.productId,
              quantity: item.quantity,
              priceAtOrder: 0,
              gstAtOrder: 0,
            });
          }
        }

        const bundledOrder = await this.prisma.order.create({
          data: {
            storeId: firstSub.storeId,
            customerId: firstSub.customerId,
            status: OrderStatus.PAYMENT_PENDING,
            totalAmount: 0, 
            subscriptionId: firstSub.id, // Primary reference
            deliveryAddress: defaultAddress?.address,
            deliveryLat: defaultAddress?.latitude,
            deliveryLng: defaultAddress?.longitude,
            items: { create: combinedItems },
          },
        });

        results.push(bundledOrder);

        // Update next delivery dates
        for (const sub of subs) {
          const nextDate = this.calculateNextDelivery(sub.frequency, sub.customDays);
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { nextDeliveryDate: nextDate },
          });
        }
        
        // Notify Vendor App about bundled subscription order
        this.realtimeService.broadcastSubscriptionUpdate(firstSub.storeId, {
          orderId: bundledOrder.id,
          bundleSize: subs.length,
          customerName: firstSub.customer.name
        });

      } catch (error) {
        this.logger.error(`Failed to process bundled subscription for key ${key}`, error);
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
