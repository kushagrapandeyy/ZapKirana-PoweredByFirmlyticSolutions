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
            subscriptionId: string;
            productId: string;
            quantity: number;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
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
            subscriptionId: string;
            productId: string;
            quantity: number;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
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
            logoUrl: string | null;
            bannerUrl: string | null;
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
            subscriptionId: string;
            productId: string;
            quantity: number;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
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
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
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
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
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
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
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
            subscriptionId: string;
            productId: string;
            quantity: number;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: number;
    }>;
    private calculateNextDelivery;
    runDailySubscriptionCron(): Promise<void>;
    processActiveSubscriptions(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        staffId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        deliveryFee: number;
        gstAmount: number;
        tipAmount: number;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
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
            subscriptionId: string;
            productId: string;
            quantity: number;
            productName: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
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
