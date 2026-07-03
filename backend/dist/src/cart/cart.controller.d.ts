import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(storeId: string, userId: string): Promise<{
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
    updateCartItem(storeId: string, body: {
        userId: string;
        productId: string;
        quantity: number;
    }): Promise<{
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
    clearCart(storeId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
