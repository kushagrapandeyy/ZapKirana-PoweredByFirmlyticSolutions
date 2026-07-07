import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { OrderStateMachine } from './order-state-machine';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * OrdersService — fixed for ERP schema.
 * - createOrder uses StoreProduct pricing (not Product.sellingPrice)
 * - OrderItem stores full invoice snapshot
 * - inventory calls use storeProductId
 * - All include paths updated to storeProduct (not product)
 */

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    items: { storeProductId: string; quantity: number }[],
    delivery?: { address: string; lat: number; lng: number },
    requireOtp?: boolean,
  ) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    if (delivery && store.latitude && store.longitude) {
      const distance = getDistanceKm(store.latitude, store.longitude, delivery.lat, delivery.lng);
      if (distance > store.operatingRadiusKm) {
        throw new BadRequestException(
          `Delivery address is ${distance.toFixed(1)}km away. This store only delivers within ${store.operatingRadiusKm}km.`,
        );
      }
    }

    // Validate items and resolve prices from StoreProductPricing
    let totalAmount = new Decimal(0);
    const validatedItems: {
      storeProductId: string;
      quantity: Decimal;
      priceAtOrderSnapshot: Decimal;
      productNameSnapshot?: string;
      hsnSacCodeSnapshot?: string;
      mrpSnapshot?: Decimal;
      cgstRateSnapshot?: Decimal;
      cgstAmountSnapshot?: Decimal;
      sgstRateSnapshot?: Decimal;
      sgstAmountSnapshot?: Decimal;
      igstRateSnapshot?: Decimal;
      igstAmountSnapshot?: Decimal;
      cessRateSnapshot?: Decimal;
      cessAmountSnapshot?: Decimal;
      taxableValueSnapshot?: Decimal;
      totalLineAmount?: Decimal;
    }[] = [];

    for (const item of items) {
      const sp = await this.prisma.storeProduct.findFirst({
        where: { id: item.storeProductId, storeId },
        include: {
          product: { select: { name: true, hsnSacCode: true } },
          pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
          taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        },
      });

      if (!sp) throw new NotFoundException(`StoreProduct ${item.storeProductId} not found in store ${storeId}`);
      if (!sp.pricing?.length) throw new BadRequestException(`StoreProduct ${item.storeProductId} has no active pricing`);

      const pricing = sp.pricing[0];
      const tax = sp.taxProfile?.[0];

      const sellingPrice = pricing.sellingPrice ?? pricing.rateA ?? pricing.mrp ?? new Decimal(0);
      const qty = new Decimal(item.quantity);
      const cgstRate = tax?.cgstRate ?? new Decimal(0);
      const sgstRate = tax?.sgstRate ?? new Decimal(0);
      const igstRate = tax?.igstRate ?? new Decimal(0);
      const cessRate = tax?.cessRate ?? new Decimal(0);
      const totalGstRate = cgstRate.plus(sgstRate).plus(igstRate);

      let taxableValue: Decimal;
      if (tax?.taxInclusive !== false && totalGstRate.greaterThan(0)) {
        taxableValue = sellingPrice.dividedBy(new Decimal(1).plus(totalGstRate.dividedBy(100))).times(qty).toDecimalPlaces(2);
      } else {
        taxableValue = sellingPrice.times(qty).toDecimalPlaces(2);
      }

      const lineTotal = sellingPrice.times(qty).toDecimalPlaces(2);
      totalAmount = totalAmount.plus(lineTotal);

      validatedItems.push({
        storeProductId: item.storeProductId,
        quantity: qty,
        priceAtOrderSnapshot: sellingPrice,
        productNameSnapshot: sp.displayName ?? sp.product?.name,
        hsnSacCodeSnapshot: tax?.hsnSacCode ?? sp.product?.hsnSacCode ?? undefined,
        mrpSnapshot: pricing.mrp != null ? pricing.mrp : undefined,
        taxableValueSnapshot: taxableValue,
        cgstRateSnapshot: cgstRate.greaterThan(0) ? cgstRate : undefined,
        cgstAmountSnapshot: taxableValue.times(cgstRate.dividedBy(100)).toDecimalPlaces(2),
        sgstRateSnapshot: sgstRate.greaterThan(0) ? sgstRate : undefined,
        sgstAmountSnapshot: taxableValue.times(sgstRate.dividedBy(100)).toDecimalPlaces(2),
        igstRateSnapshot: igstRate.greaterThan(0) ? igstRate : undefined,
        igstAmountSnapshot: taxableValue.times(igstRate.dividedBy(100)).toDecimalPlaces(2),
        cessRateSnapshot: cessRate.greaterThan(0) ? cessRate : undefined,
        cessAmountSnapshot: taxableValue.times(cessRate.dividedBy(100)).toDecimalPlaces(2),
        totalLineAmount: lineTotal,
      });

      // Check stock availability
      const stock = await this.inventoryService.getAvailableStock(storeId, item.storeProductId);
      if (stock.available.lessThan(qty)) {
        throw new BadRequestException(`Insufficient stock for ${sp.displayName ?? sp.product?.name}`);
      }
    }

    const order = await this.prisma.$transaction(async (tx) => {
      return tx.order.create({
        data: {
          storeId,
          customerId,
          status: OrderStatus.PAYMENT_PENDING,
          totalAmount,
          deliveryAddress: delivery?.address,
          deliveryLat: delivery?.lat,
          deliveryLng: delivery?.lng,
          requireOtp: requireOtp ?? false,
          items: { create: validatedItems },
        },
      });
    });

    // Reserve stock (outside main tx to avoid long-held locks)
    for (const item of validatedItems) {
      await this.inventoryService.reserveStockForOnlineOrder(
        storeId, item.storeProductId, item.quantity.toNumber(), order.id,
      );
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

    // Deduct permanent stock and release reservation
    for (const item of order.items) {
      await this.inventoryService.recordMovement({
        storeId: order.storeId,
        storeProductId: item.storeProductId,
        type: 'ONLINE_ORDER_PICKED',
        quantityChange: Number(item.quantity),
        sourceType: 'ORDER',
        sourceId: order.id,
        staffId,
      });
    }

    this.eventEmitter.emit('order.status_changed', {
      orderId, status: 'READY_FOR_PICKUP', customerId: order.customerId,
    });
    return updatedOrder;
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

  async getStoreOrders(storeId: string, opts?: { status?: OrderStatus; limit?: number }) {
    return this.prisma.order.findMany({
      where: { storeId, ...(opts?.status ? { status: opts.status } : {}) },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            storeProduct: {
              include: { product: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: opts?.limit ?? 100,
    });
  }

  async getCustomerOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            storeProduct: { include: { product: { select: { name: true } } } },
          },
        },
        store: { select: { id: true, name: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            storeProduct: { include: { product: { select: { name: true } } } },
          },
        },
      },
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

    this.eventEmitter.emit('order.out_for_delivery', { customerId: order.customerId, orderId });
    this.eventEmitter.emit('order.status_changed', { orderId, status: 'OUT_FOR_DELIVERY', customerId: order.customerId });
    return updated;
  }

  async completeOrder(orderId: string, staffId: string, otp?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order || order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('Order cannot be completed yet');
    }

    if (order.requireOtp) {
      if (!otp) throw new BadRequestException('OTP required for this delivery');
      const phone = order.customer?.phone;
      if (!phone || phone.length < 4) throw new BadRequestException('Customer phone invalid for OTP');
      const expectedOtp = phone.slice(-4);
      if (otp !== expectedOtp) throw new BadRequestException('Invalid OTP');
    }

    const completed = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    this.eventEmitter.emit('order.delivered', { customerId: order.customerId, orderId });
    this.eventEmitter.emit('order.status_changed', { orderId, status: 'DELIVERED', customerId: order.customerId });
    return completed;
  }

  async getOrderMessages(orderId: string) {
    return this.prisma.orderMessage.findMany({
      where: { orderId },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addOrderMessage(orderId: string, senderId: string, text: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.orderMessage.create({
      data: { orderId, senderId, text },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  }
}
