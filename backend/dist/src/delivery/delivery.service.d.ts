import { PrismaService } from '../prisma.service';
export declare class DeliveryService {
    private prisma;
    constructor(prisma: PrismaService);
    updateLastLocation(orderId: string, lat: number, lng: number): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
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
        customerId: string;
        staffId: string | null;
    }>;
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
}
