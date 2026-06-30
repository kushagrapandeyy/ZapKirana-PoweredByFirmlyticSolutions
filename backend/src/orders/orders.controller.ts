import { Controller, Get, Post, Patch, Body, Query, Param, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getStoreOrders(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.ordersService.getStoreOrders(storeId);
  }

  @Post()
  createOrder(@Body() body: { storeId: string; customerId: string; items: { productId: string, quantity: number }[] }) {
    if (!body.storeId || !body.customerId || !body.items || body.items.length === 0) {
      throw new BadRequestException('Invalid order payload');
    }
    return this.ordersService.createOrder(body.storeId, body.customerId, body.items);
  }

  @Post(':id/pay')
  payOrder(@Param('id') id: string) {
    return this.ordersService.payOrder(id);
  }

  @Patch(':id/pick')
  pickOrder(@Param('id') id: string, @Body('staffId') staffId: string) {
    if (!staffId) throw new BadRequestException('staffId required');
    return this.ordersService.pickOrder(id, staffId);
  }
}
