import { Controller, Get, Post, Delete, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':storeId')
  getCart(
    @Param('storeId') storeId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.cartService.getCart(userId, storeId);
  }

  @Post(':storeId/items')
  updateCartItem(
    @Param('storeId') storeId: string,
    @Body() body: { userId: string; productId: string; quantity: number },
  ) {
    if (!body.userId || !body.productId || body.quantity == null) {
      throw new BadRequestException('userId, productId, and quantity are required');
    }
    return this.cartService.updateCartItem(body.userId, storeId, body.productId, body.quantity);
  }

  @Delete(':storeId')
  clearCart(
    @Param('storeId') storeId: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.cartService.clearCart(userId, storeId);
  }
}
