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
            productId: string;
            quantity: number;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
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
            productId: string;
            quantity: number;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    })[]>;
    getSubscriptionById(id: string): Promise<{
        store: {
            id: string;
            organizationId: string | null;
            name: string;
            location: string | null;
            latitude: number | null;
            longitude: number | null;
            operatingRadiusKm: number;
            gstin: string | null;
            isActive: boolean;
            imageUrl: string | null;
            operatingHours: string | null;
            rating: number;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        };
        items: {
            id: string;
            createdAt: Date;
            productId: string;
            quantity: number;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    pauseSubscription(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    resumeSubscription(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    cancelSubscription(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
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
            productId: string;
            quantity: number;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    private calculateNextDelivery;
    runDailySubscriptionCron(): Promise<void>;
    processActiveSubscriptions(): Promise<any[]>;
    getStoreSubscriptions(storeId: string): Promise<({
        items: {
            id: string;
            createdAt: Date;
            productId: string;
            quantity: number;
            subscriptionId: string;
            productName: string;
        }[];
        customer: {
            id: string;
            name: string | null;
            phone: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        customerId: string;
        deliverySlot: string | null;
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
