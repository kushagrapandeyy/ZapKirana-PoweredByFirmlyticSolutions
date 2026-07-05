import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(body: any): Promise<{
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
    getAll(customerId: string): Promise<({
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
    getOne(id: string): Promise<{
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
    pause(id: string): Promise<{
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
    resume(id: string): Promise<{
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
    updateItems(id: string, body: {
        items: any[];
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
    cancel(id: string): Promise<{
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
    processActive(): Promise<any[]>;
    processNow(): Promise<any[]>;
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
