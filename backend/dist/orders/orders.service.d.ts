import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
export declare class OrdersService {
    private prisma;
    private inventoryService;
    private eventEmitter;
    constructor(prisma: PrismaService, inventoryService: InventoryService, eventEmitter: EventEmitter2);
    createOrder(storeId: string, customerId: string, items: {
        storeProductId: string;
        quantity: number;
    }[], delivery?: {
        address: string;
        lat: number;
        lng: number;
    }, requireOtp?: boolean): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    }>;
    payOrder(orderId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    }>;
    pickOrder(orderId: string, staffId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    }>;
    updateOrderStatus(orderId: string, status: OrderStatus, staffId?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    }>;
    getStoreOrders(storeId: string, opts?: {
        status?: OrderStatus;
        limit?: number;
    }): Promise<({
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
            quantity: Decimal;
            productNameSnapshot: string | null;
            barcodeSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            unitSnapshot: string | null;
            mrpSnapshot: Decimal | null;
            discountSnapshot: Decimal | null;
            taxableValueSnapshot: Decimal | null;
            cgstRateSnapshot: Decimal | null;
            cgstAmountSnapshot: Decimal | null;
            sgstRateSnapshot: Decimal | null;
            sgstAmountSnapshot: Decimal | null;
            igstRateSnapshot: Decimal | null;
            igstAmountSnapshot: Decimal | null;
            cessRateSnapshot: Decimal | null;
            cessAmountSnapshot: Decimal | null;
            totalLineAmount: Decimal | null;
            orderId: string;
            priceAtOrderSnapshot: Decimal;
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
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    })[]>;
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
            quantity: Decimal;
            productNameSnapshot: string | null;
            barcodeSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            unitSnapshot: string | null;
            mrpSnapshot: Decimal | null;
            discountSnapshot: Decimal | null;
            taxableValueSnapshot: Decimal | null;
            cgstRateSnapshot: Decimal | null;
            cgstAmountSnapshot: Decimal | null;
            sgstRateSnapshot: Decimal | null;
            sgstAmountSnapshot: Decimal | null;
            igstRateSnapshot: Decimal | null;
            igstAmountSnapshot: Decimal | null;
            cessRateSnapshot: Decimal | null;
            cessAmountSnapshot: Decimal | null;
            totalLineAmount: Decimal | null;
            orderId: string;
            priceAtOrderSnapshot: Decimal;
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
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
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
            quantity: Decimal;
            productNameSnapshot: string | null;
            barcodeSnapshot: string | null;
            hsnSacCodeSnapshot: string | null;
            unitSnapshot: string | null;
            mrpSnapshot: Decimal | null;
            discountSnapshot: Decimal | null;
            taxableValueSnapshot: Decimal | null;
            cgstRateSnapshot: Decimal | null;
            cgstAmountSnapshot: Decimal | null;
            sgstRateSnapshot: Decimal | null;
            sgstAmountSnapshot: Decimal | null;
            igstRateSnapshot: Decimal | null;
            igstAmountSnapshot: Decimal | null;
            cessRateSnapshot: Decimal | null;
            cessAmountSnapshot: Decimal | null;
            totalLineAmount: Decimal | null;
            orderId: string;
            priceAtOrderSnapshot: Decimal;
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
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    }>;
    startDelivery(orderId: string, staffId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    }>;
    completeOrder(orderId: string, staffId: string, otp?: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        staffId: string | null;
        discount: Decimal;
        customerId: string;
        totalAmount: Decimal;
        deliveryFee: Decimal;
        gstAmount: Decimal;
        deliveryAddress: string | null;
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliverySlot: string | null;
        deliveryInstructions: string | null;
        requireOtp: boolean;
        otp: string | null;
        subscriptionId: string | null;
    }>;
    getOrderMessages(orderId: string): Promise<({
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
    addOrderMessage(orderId: string, senderId: string, text: string): Promise<{
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
