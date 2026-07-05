import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    getCart(storeId: string, userId: string): Promise<any>;
    updateCartItem(storeId: string, body: {
        userId: string;
        productId: string;
        quantity: number;
    }): Promise<any>;
    clearCart(storeId: string, userId: string): Promise<{
        success: boolean;
    }>;
}
