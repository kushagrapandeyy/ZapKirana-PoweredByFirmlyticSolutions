import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SubscriptionFrequency } from '@prisma/client';
export declare class SubscriptionsService {
    private prisma;
    private eventEmitter;
    private realtimeService;
    private readonly logger;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2, realtimeService: RealtimeService);
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
            productName: string;
            quantity: number;
            subscriptionId: string;
        }[];
    } & {
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
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
            productName: string;
            quantity: number;
            subscriptionId: string;
        }[];
    } & {
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
    })[]>;
    getSubscriptionById(id: string): Promise<{
        store: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            organizationId: string | null;
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
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
        };
        items: {
            id: string;
            createdAt: Date;
            productId: string;
            productName: string;
            quantity: number;
            subscriptionId: string;
        }[];
    } & {
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
    }>;
    pauseSubscription(id: string): Promise<{
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
    }>;
    resumeSubscription(id: string): Promise<{
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
    }>;
    cancelSubscription(id: string): Promise<{
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
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
            productName: string;
            quantity: number;
            subscriptionId: string;
        }[];
    } & {
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
    }>;
    private calculateNextDelivery;
    runDailySubscriptionCron(): Promise<void>;
    processActiveSubscriptions(): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        deliverySlot: string | null;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
        subscriptionId: string | null;
        totalAmount: number;
        deliveryFee: number;
        gstAmount: number;
        tipAmount: number;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        staffId: string | null;
    }[]>;
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
            productId: string;
            productName: string;
            quantity: number;
            subscriptionId: string;
        }[];
    } & {
        id: string;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        storeId: string;
    })[]>;
    getDueTodayCount(storeId: string): Promise<{
        storeId: string;
        dueToday: number;
        date: string;
    }>;
}
