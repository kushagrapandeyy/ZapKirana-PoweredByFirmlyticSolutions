import { PrismaService } from '../prisma.service';
export declare class CartService {
    private prisma;
    constructor(prisma: PrismaService);
    getCart(userId: string, storeId: string): Promise<{
        subtotal: number;
        totalMrp: number;
        discount: number;
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
                mrp: number;
                sellingPrice: number;
            };
        } & {
            id: string;
            productId: string;
            quantity: number;
            cartId: string;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        userId: string;
    }>;
    updateCartItem(userId: string, storeId: string, productId: string, quantity: number): Promise<{
        subtotal: number;
        totalMrp: number;
        discount: number;
        items: ({
            product: {
                id: string;
                name: string;
                imageUrl: string | null;
                mrp: number;
                sellingPrice: number;
            };
        } & {
            id: string;
            productId: string;
            quantity: number;
            cartId: string;
        })[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        storeId: string;
        userId: string;
    }>;
    clearCart(userId: string, storeId: string): Promise<{
        success: boolean;
    }>;
}
