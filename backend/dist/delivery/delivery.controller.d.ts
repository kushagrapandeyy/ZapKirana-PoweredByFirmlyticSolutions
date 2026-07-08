import { DeliveryService } from './delivery.service';
export declare class DeliveryController {
    private readonly deliveryService;
    constructor(deliveryService: DeliveryService);
    getLastLocation(orderId: string): Promise<{
        orderId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        staffLat: number | null;
        staffLng: number | null;
        deliveryAddress: string | null;
        staff: {
            name: string | null;
            phone: string | null;
            avatarUrl: string | null;
        } | null;
    }>;
    updateLocation(orderId: string, body: {
        lat: number;
        lng: number;
        staffId: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
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
    }>;
}
