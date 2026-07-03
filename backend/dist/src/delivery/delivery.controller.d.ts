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
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        customerId: string;
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
    }>;
}
