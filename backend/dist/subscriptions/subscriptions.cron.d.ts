import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsCron {
    private readonly subscriptionsService;
    private readonly logger;
    constructor(subscriptionsService: SubscriptionsService);
    processDueSubscriptions(): Promise<void>;
}
