import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    create(body: any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
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
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getOne(id: string): Promise<{
        store: {
            id: string;
            name: string;
            gstin: string | null;
            pan: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string | null;
            latitude: number | null;
            longitude: number | null;
            location: string | null;
            operatingRadiusKm: number;
            fssaiLicenseNo: string | null;
            isActive: boolean;
            imageUrl: string | null;
            logoUrl: string | null;
            bannerUrl: string | null;
            operatingHours: import("@prisma/client/runtime/library").JsonValue | null;
            rating: number;
            description: string | null;
            bankAccountNumber: string | null;
            bankRoutingNumber: string | null;
            taxId: string | null;
            stateCode: string | null;
            stateName: string | null;
        };
        items: {
            id: string;
            createdAt: Date;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
    }>;
    pause(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
    }>;
    resume(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateItems(id: string, body: {
        items: any[];
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            subscriptionId: string;
            productName: string;
        }[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
    }>;
    cancel(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
    }>;
    processActive(): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: import("@prisma/client/runtime/library").Decimal;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
        gstAmount: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: import("@prisma/client/runtime/library").Decimal;
        customerId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        deliveryFee: import("@prisma/client/runtime/library").Decimal;
        gstAmount: import("@prisma/client/runtime/library").Decimal;
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
        items: {
            id: string;
            createdAt: Date;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
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
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        deliverySlot: string | null;
        frequency: import(".prisma/client").$Enums.SubscriptionFrequency;
        nextDeliveryDate: Date | null;
        customDays: import("@prisma/client/runtime/library").JsonValue | null;
        discountApplied: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    getDueTodayCount(storeId: string): Promise<{
        storeId: string;
        dueToday: number;
        date: string;
    }>;
}
