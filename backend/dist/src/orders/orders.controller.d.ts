import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getStoreOrders(storeId: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            storeId: string | null;
            name: string | null;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                storeId: string;
                name: string;
                barcode: string | null;
                internalSku: string;
                description: string | null;
                category: string | null;
                mrp: number;
                sellingPrice: number;
                purchaseCost: number | null;
                gstRate: number;
                imageUrl: string | null;
                isActive: boolean;
            };
        } & {
            id: string;
            quantity: number;
            priceAtOrder: number;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        staffId: string | null;
    })[]>;
    createOrder(body: {
        storeId: string;
        customerId: string;
        items: {
            productId: string;
            quantity: number;
        }[];
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        staffId: string | null;
    }>;
    payOrder(id: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        staffId: string | null;
    }>;
    pickOrder(id: string, staffId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        customerId: string;
        staffId: string | null;
    }>;
}
