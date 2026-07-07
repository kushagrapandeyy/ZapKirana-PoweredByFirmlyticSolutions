import { PrismaService } from '../prisma.service';
export declare class SubscriptionsCron {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processDueSubscriptions(): Promise<void>;
}
