import { Controller, Get, Post, Patch, Body, Query, Param, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Get()
  getStoreOrders(@Query('storeId') storeId: string) {
    if (!storeId) throw new BadRequestException('storeId is required');
    return this.ordersService.getStoreOrders(storeId);
  }

  @Public()
  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Public()
  @Get('customer/:customerId')
  getCustomerOrders(@Param('customerId') customerId: string) {
    return this.ordersService.getCustomerOrders(customerId);
  }

  @Public()
  @Post()
  createOrder(@Body() body: { 
    storeId: string; 
    customerId: string; 
    items: { productId: string, quantity: number }[];
    delivery?: { address: string, lat: number, lng: number };
    requireOtp?: boolean;
  }) {
    if (!body.storeId || !body.customerId || !body.items || body.items.length === 0) {
      throw new BadRequestException('Invalid order payload');
    }
    return this.ordersService.createOrder(body.storeId, body.customerId, body.items, body.delivery, body.requireOtp);
  }

  @Public()
  @Post(':id/pay')
  payOrder(@Param('id') id: string) {
    return this.ordersService.payOrder(id);
  }

  @Public()
  @Patch(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body('status') status: any, @Body('staffId') staffId?: string) {
    return this.ordersService.updateOrderStatus(id, status, staffId);
  }

  @Public()
  @Patch(':id/pick')
  pickOrder(@Param('id') id: string, @Body('staffId') staffId: string) {
    if (!staffId) throw new BadRequestException('staffId required');
    return this.ordersService.pickOrder(id, staffId);
  }

  @Public()
  @Patch(':id/deliver')
  startDelivery(@Param('id') id: string, @Body('staffId') staffId: string) {
    if (!staffId) throw new BadRequestException('staffId required');
    return this.ordersService.startDelivery(id, staffId);
  }

  @Public()
  @Patch(':id/complete')
  completeOrder(
    @Param('id') id: string,
    @Body('staffId') staffId: string,
    @Body('otp') otp?: string
  ) {
    if (!staffId) throw new BadRequestException('staffId required');
    return this.ordersService.completeOrder(id, staffId, otp);
  }

  @Public()
  @Get(':id/messages')
  getOrderMessages(@Param('id') id: string) {
    return this.ordersService.getOrderMessages(id);
  }

  @Public()
  @Post(':id/messages')
  addOrderMessage(
    @Param('id') id: string,
    @Body('senderId') senderId: string,
    @Body('text') text: string
  ) {
    if (!senderId || !text) throw new BadRequestException('senderId and text required');
    return this.ordersService.addOrderMessage(id, senderId, text);
  }
}
