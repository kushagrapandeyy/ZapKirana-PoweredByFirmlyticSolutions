import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';
export declare class CartService {
    private prisma;
    private cache;
    constructor(prisma: PrismaService, cache: CacheService);
    getCart(userId: string, storeId: string): Promise<any>;
    updateCartItem(userId: string, storeId: string, storeProductId: string, quantity: number): Promise<any>;
    clearCart(userId: string, storeId: string): Promise<{
        success: boolean;
    }>;
}
