import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';
import { SubscriptionFrequency } from '@prisma/client';
export declare class SubscriptionsService {
    private prisma;
    private eventEmitter;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    createSubscription(data: {
        customerId: string;
        storeId: string;
        frequency: SubscriptionFrequency;
        customDays?: any;
        discountApplied?: number;
        deliverySlot?: string;
        items: {
            productId: string;
            productName: string;
            quantity: number;
        }[];
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            subscriptionId: string;
            quantity: number;
            productId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    getSubscriptions(customerId: string): Promise<({
        store: {
            id: string;
            name: string;
            imageUrl: string | null;
        };
        items: {
            id: string;
            createdAt: Date;
            subscriptionId: string;
            quantity: number;
            productId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    })[]>;
    getSubscriptionById(id: string): Promise<{
        store: {
            id: string;
            name: string;
            gstin: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            isActive: boolean;
            imageUrl: string | null;
            operatingHours: string | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        };
        items: {
            id: string;
            createdAt: Date;
            subscriptionId: string;
            quantity: number;
            productId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    pauseSubscription(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    resumeSubscription(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    cancelSubscription(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    updateSubscriptionItems(id: string, items: {
        productId: string;
        productName: string;
        quantity: number;
    }[]): Promise<{
        items: {
            id: string;
            createdAt: Date;
            subscriptionId: string;
            quantity: number;
            productId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    private calculateNextDelivery;
    runDailySubscriptionCron(): Promise<void>;
    processActiveSubscriptions(): Promise<any[]>;
    getStoreSubscriptions(storeId: string): Promise<({
        customer: {
            id: string;
            name: string | null;
            phone: string | null;
            avatarUrl: string | null;
        };
        items: {
            id: string;
            createdAt: Date;
            subscriptionId: string;
            quantity: number;
            productId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        deliverySlot: string | null;
        customerId: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    })[]>;
    getDueTodayCount(storeId: string): Promise<{
        storeId: string;
        dueToday: number;
        date: string;
    }>;
}
