import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(body: any): Promise<{
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
    getAll(customerId: string): Promise<({
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
    pause(id: string): Promise<{
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
    resume(id: string): Promise<{
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
    updateItems(id: string, body: {
        items: any[];
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
    cancel(id: string): Promise<{
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
    processActive(): Promise<{
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
    processNow(): Promise<{
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
