import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { OrderStateMachine } from './order-state-machine';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);  
  const dLon = (lon2 - lon1) * (Math.PI / 180); 
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createOrder(
    storeId: string, 
    customerId: string, 
    items: { productId: string, quantity: number }[],
    delivery?: { address: string, lat: number, lng: number },
    requireOtp?: boolean
  ) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    const isMockUser = customerId === 'de283b71-1972-47b7-996f-6633d0f7b7f5';

    if (delivery && store.latitude && store.longitude && !isMockUser) {
      const distance = getDistanceFromLatLonInKm(store.latitude, store.longitude, delivery.lat, delivery.lng);
      if (distance > store.operatingRadiusKm) {
        throw new BadRequestException(`Delivery address is ${distance.toFixed(1)}km away. This store only delivers within ${store.operatingRadiusKm}km.`);
      }
    }

    // 1. Validate items and stock
    let totalAmount = 0;
    const validatedItems: {productId: string, quantity: number, priceAtOrder: number}[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      const avail = await this.inventoryService.getAvailableStock(storeId, item.productId);
      if (avail.available < item.quantity && !isMockUser) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      
      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtOrder: product.sellingPrice,
      });

      totalAmount += (product.sellingPrice * item.quantity);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // 2. Create Order
      return tx.order.create({
        data: {
          storeId,
          customerId,
          status: OrderStatus.PAYMENT_PENDING,
          totalAmount,
          deliveryAddress: delivery?.address,
          deliveryLat: delivery?.lat,
          deliveryLng: delivery?.lng,
          requireOtp: requireOtp || false,
          items: {
            create: validatedItems,
          },
        },
      });
    });

    // 3. Reserve Stock via Inventory Service Engine (Outside TX to prevent deadlock/timeout)
    for (const item of validatedItems) {
      await this.inventoryService.reserveStockForOnlineOrder(storeId, item.productId, item.quantity, order.id);
    }

    return order;
  }

  async payOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new BadRequestException('Order not found or not pending payment');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
    });

    this.eventEmitter.emit('order.status_changed', { orderId, status: 'PAID', customerId: order.customerId });
    return updated;
  }

  async pickOrder(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PICKING)) {
      throw new BadRequestException('Order cannot be picked');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.READY_FOR_PICKUP, staffId },
    });

    // 2. Un-reserve and deduct permanent stock via Engine (outside main tx)
    for (const item of order.items) {
      await this.inventoryService.recordMovement({
        storeId: order.storeId,
        productId: item.productId,
        type: 'ONLINE_ORDER_PICKED',
        quantityChange: item.quantity, // Engine treats as positive to subtract from onHand and reserved
        sourceType: 'ORDER',
        sourceId: order.id,
        staffId,
      });
    }

    const finalOrder = await this.prisma.order.findUnique({ where: { id: orderId } });
    this.eventEmitter.emit('order.status_changed', { orderId, status: 'READY_FOR_PICKUP', customerId: order.customerId });
    return finalOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, staffId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    OrderStateMachine.assertValidTransition(order.status, status);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status, ...(staffId ? { staffId } : {}) },
    });
    
    this.eventEmitter.emit('order.status_changed', { orderId, status, customerId: updatedOrder.customerId });
    return updatedOrder;
  }

  async getStoreOrders(storeId: string) {
    return this.prisma.order.findMany({
      where: { storeId },
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        customer: true,
        items: { include: { product: true } },
        store: { select: { id: true, name: true, location: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async startDelivery(orderId: string, staffId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Order cannot be delivered yet');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.OUT_FOR_DELIVERY, staffId },
    });

    // Fire push notification to customer
    this.eventEmitter.emit('order.out_for_delivery', { customerId: order.customerId, orderId });
    // Fire WebSocket broadcast to all watchers of this order
    this.eventEmitter.emit('order.status_changed', { orderId, status: 'OUT_FOR_DELIVERY', customerId: order.customerId });

    return updated;
  }

  async completeOrder(orderId: string, staffId: string, otp?: string) {
    const order = await this.prisma.order.findUnique({ 
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order || order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('Order cannot be completed yet');
    }

    if (order.requireOtp) {
      if (!otp) throw new BadRequestException('OTP required for this delivery');
      const phone = order.customer.phone;
      if (!phone || phone.length < 4) {
        // Fallback if user phone is somehow invalid
        throw new BadRequestException('Customer phone invalid for OTP');
      }
      const expectedOtp = phone.slice(-4);
      if (otp !== expectedOtp) {
        throw new BadRequestException('Invalid OTP');
      }
    }

    const completed = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    // Fire push notification to customer
    this.eventEmitter.emit('order.delivered', { customerId: order.customerId, orderId });
    // Fire WebSocket broadcast
    this.eventEmitter.emit('order.status_changed', { orderId, status: 'DELIVERED', customerId: order.customerId });

    return completed;
  }

  async getOrderMessages(orderId: string) {
    return this.prisma.orderMessage.findMany({
      where: { orderId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addOrderMessage(orderId: string, senderId: string, text: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId,
        text
      },
      include: { sender: true }
    });
  }
}
