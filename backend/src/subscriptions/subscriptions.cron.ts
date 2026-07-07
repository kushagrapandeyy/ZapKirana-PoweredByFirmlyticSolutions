import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubscriptionsCron {
  private readonly logger = new Logger(SubscriptionsCron.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs every day at midnight to process due subscriptions.
   * For active subscriptions where nextDeliveryDate <= today,
   * it auto-generates an Order (PACKING status) into the regular delivery flow.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDueSubscriptions() {
    this.logger.log('Starting daily subscription processing cron job...');
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    try {
      const dueSubscriptions = await this.prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
          nextDeliveryDate: {
            lte: today,
          },
        },
        include: {
          items: true,
        },
      });

      this.logger.log(`Found ${dueSubscriptions.length} due subscription(s).`);

      for (const sub of dueSubscriptions) {
        // 1. Generate Order for delivery/order flow
        const order = await this.prisma.order.create({
          data: {
            customerId: sub.customerId,
            storeId: sub.storeId,
            status: 'PICKING', // Automatically ready for vendor/staff to pack
            totalAmount: sub.discountApplied ? -sub.discountApplied : 0, // Placeholder, usually calculate from items
            
            
            deliveryAddress: 'Subscription Address', // TODO: link actual customer address
            items: {
              create: sub.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtOrder: 0, // Should be fetched from product master
              }))
            },
            subscriptionId: sub.id,
          },
        });

        this.logger.log(`Auto-queued Order ${order.id} for Subscription ${sub.id}`);

        // 2. Advance next delivery date based on frequency
        let nextDate = new Date(sub.nextDeliveryDate || today);
        if (sub.frequency === 'DAILY') {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (sub.frequency === 'WEEKLY') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (sub.frequency === 'MONTHLY') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { nextDeliveryDate: nextDate },
        });
      }

      this.logger.log('Daily subscription processing completed successfully.');
    } catch (error) {
      this.logger.error('Error processing subscriptions in cron', error);
    }
  }
}
