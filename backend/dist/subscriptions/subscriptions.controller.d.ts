import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(body: any): Promise<{
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
    getOne(id: string): Promise<{
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
    pause(id: string): Promise<{
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
    resume(id: string): Promise<{
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
    updateItems(id: string, body: {
        items: any[];
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
    cancel(id: string): Promise<{
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
    processActive(): Promise<{
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
    processNow(): Promise<{
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
