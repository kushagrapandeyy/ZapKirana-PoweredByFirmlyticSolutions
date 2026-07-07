import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getStoreOrders(storeId: string): Promise<({
        items: ({
            storeProduct: {
                product: {
                    name: string;
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                itemType: string | null;
                productId: string;
                legacyCode: string | null;
                displayName: string | null;
                type: string | null;
                isHidden: boolean;
                allowDecimalQty: boolean;
                packagingText: string | null;
                colorType: string | null;
                groupId: string | null;
                manufacturerLegacyRef: string | null;
                createdBy: string | null;
                updatedBy: string | null;
                source: string | null;
            };
        } & {
            id: string;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            productNameSnapshot: string | null;
            barcodeSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            unitSnapshot: string | null;
            mrpSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            discountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            taxableValueSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            totalLineAmount: import("@prisma/client/runtime/library").Decimal | null;
            orderId: string;
            priceAtOrderSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        customer: {
            id: string;
            name: string | null;
            phone: string | null;
        };
    } & {
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
    })[]>;
    getOrderById(id: string): Promise<{
        items: ({
            storeProduct: {
                product: {
                    name: string;
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                itemType: string | null;
                productId: string;
                legacyCode: string | null;
                displayName: string | null;
                type: string | null;
                isHidden: boolean;
                allowDecimalQty: boolean;
                packagingText: string | null;
                colorType: string | null;
                groupId: string | null;
                manufacturerLegacyRef: string | null;
                createdBy: string | null;
                updatedBy: string | null;
                source: string | null;
            };
        } & {
            id: string;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            productNameSnapshot: string | null;
            barcodeSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            unitSnapshot: string | null;
            mrpSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            discountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            taxableValueSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            totalLineAmount: import("@prisma/client/runtime/library").Decimal | null;
            orderId: string;
            priceAtOrderSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        customer: {
            id: string;
            name: string | null;
            phone: string | null;
        };
    } & {
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
    }>;
    getCustomerOrders(customerId: string): Promise<({
        store: {
            id: string;
            name: string;
            location: string | null;
        };
        items: ({
            storeProduct: {
                product: {
                    name: string;
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                itemType: string | null;
                productId: string;
                legacyCode: string | null;
                displayName: string | null;
                type: string | null;
                isHidden: boolean;
                allowDecimalQty: boolean;
                packagingText: string | null;
                colorType: string | null;
                groupId: string | null;
                manufacturerLegacyRef: string | null;
                createdBy: string | null;
                updatedBy: string | null;
                source: string | null;
            };
        } & {
            id: string;
            storeProductId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            productNameSnapshot: string | null;
            barcodeSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            unitSnapshot: string | null;
            mrpSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            discountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            taxableValueSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            sgstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            igstAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessRateSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            cessAmountSnapshot: import("@prisma/client/runtime/library").Decimal | null;
            totalLineAmount: import("@prisma/client/runtime/library").Decimal | null;
            orderId: string;
            priceAtOrderSnapshot: import("@prisma/client/runtime/library").Decimal;
        })[];
        customer: {
            id: string;
            name: string | null;
        };
    } & {
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
    })[]>;
    createOrder(body: {
        storeId: string;
        customerId: string;
        items: {
            storeProductId: string;
            quantity: number;
        }[];
        delivery?: {
            address: string;
            lat: number;
            lng: number;
        };
        requireOtp?: boolean;
    }): Promise<{
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
    }>;
    payOrder(id: string): Promise<{
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
    }>;
    updateOrderStatus(id: string, status: any, staffId?: string): Promise<{
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
    }>;
    pickOrder(id: string, staffId: string): Promise<{
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
    }>;
    startDelivery(id: string, staffId: string): Promise<{
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
    }>;
    completeOrder(id: string, staffId: string, otp?: string): Promise<{
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
    }>;
    getOrderMessages(id: string): Promise<({
        sender: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        orderId: string;
        senderId: string;
        text: string;
    })[]>;
    addOrderMessage(id: string, senderId: string, text: string): Promise<{
        sender: {
            id: string;
            name: string | null;
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
        id: string;
        createdAt: Date;
        orderId: string;
        senderId: string;
        text: string;
    }>;
}
