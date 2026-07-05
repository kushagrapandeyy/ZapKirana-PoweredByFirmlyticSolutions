import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

  async getCart(userId: string, storeId: string) {
    const cacheKey = `cart:${userId}:${storeId}`;
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) return cached;

    let cart = await this.prisma.cart.findUnique({
      where: {
        userId_storeId: { userId, storeId },
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, sellingPrice: true, mrp: true, imageUrl: true }
            }
          },
          orderBy: { createdAt: 'asc' } as any
        }
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, storeId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sellingPrice: true, mrp: true, imageUrl: true }
              }
            }
          }
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
    const totalMrp = cart.items.reduce((sum, item) => sum + (item.product.mrp * item.quantity), 0);
    const discount = totalMrp - subtotal;

    const result = { ...cart, subtotal, totalMrp, discount };
    await this.cache.set(cacheKey, result, 3600); // Cache for 1 hour
    return result;
  }

  async updateCartItem(userId: string, storeId: string, productId: string, quantity: number) {
    const cart = await this.getCart(userId, storeId);

    if (quantity <= 0) {
      // Remove item
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
    } else {
      // Upsert item
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId },
        },
        update: { quantity },
        create: { cartId: cart.id, productId, quantity },
      });
    }

    const cacheKey = `cart:${userId}:${storeId}`;
    await this.cache.delete(cacheKey);

    return this.getCart(userId, storeId);
  }

  async clearCart(userId: string, storeId: string) {
    const cart = await this.getCart(userId, storeId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    
    const cacheKey = `cart:${userId}:${storeId}`;
    await this.cache.delete(cacheKey);

    return { success: true };
  }
}
