import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionsCron {
  private readonly logger = new Logger(SubscriptionsCron.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Runs every day at midnight to process due subscriptions.
   * For active subscriptions where nextDeliveryDate <= today,
   * it auto-generates an Order (PACKING status) into the regular delivery flow.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDueSubscriptions() {
    this.logger.log('Starting daily subscription processing cron job...');
    
    try {
      const results = await this.subscriptionsService.processActiveSubscriptions();
      this.logger.log(`Daily subscription processing completed successfully. Processed ${results.length} bundle(s).`);
    } catch (error) {
      this.logger.error('Error processing subscriptions in cron', error);
    }
  }
}
