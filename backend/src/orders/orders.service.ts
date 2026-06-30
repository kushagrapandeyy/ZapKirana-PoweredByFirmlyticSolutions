import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
  ) {}

  async createOrder(storeId: string, customerId: string, items: { productId: string, quantity: number }[]) {
    // 1. Validate items and stock
    let totalAmount = 0;
    const validatedItems: {productId: string, quantity: number, priceAtOrder: number}[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      const avail = await this.inventoryService.getAvailableStock(storeId, item.productId);
      if (avail.available < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      
      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtOrder: product.sellingPrice,
      });

      totalAmount += (product.sellingPrice * item.quantity);
    }

    return this.prisma.$transaction(async (tx) => {
      // 2. Create Order
      const order = await tx.order.create({
        data: {
          storeId,
          customerId,
          status: OrderStatus.PAYMENT_PENDING,
          totalAmount,
          items: {
            create: validatedItems,
          },
        },
      });

      // 3. Reserve Stock
      for (const item of validatedItems) {
        await tx.inventory.updateMany({
          where: { storeId, productId: item.productId },
          data: {
            reservedQty: { increment: item.quantity }
          }
        });
        
        // Log movement
        const inv = await tx.inventory.findFirst({ where: { storeId, productId: item.productId }});
        if (inv) {
          await tx.stockMovement.create({
            data: {
              storeId,
              productId: item.productId,
              inventoryId: inv.id,
              type: 'ONLINE_ORDER_RESERVED',
              quantityChange: -item.quantity, // visually negative for available stock
              sourceType: 'ORDER',
              sourceId: order.id,
            }
          });
        }
      }

      return order;
    });
  }

  async payOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== OrderStatus.PAYMENT_PENDING) {
      throw new BadRequestException('Order not found or not pending payment');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
    });
  }

  async pickOrder(orderId: string, staffId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order || (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PICKING)) {
        throw new BadRequestException('Order cannot be picked');
      }

      // 1. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.READY_FOR_PICKUP, staffId },
      });

      // 2. Un-reserve and deduct permanent stock
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: { storeId: order.storeId, productId: item.productId },
          data: {
            reservedQty: { decrement: item.quantity },
            onHandQty: { decrement: item.quantity }
          }
        });
        
        const inv = await tx.inventory.findFirst({ where: { storeId: order.storeId, productId: item.productId }});
        if (inv) {
          await tx.stockMovement.create({
            data: {
              storeId: order.storeId,
              productId: item.productId,
              inventoryId: inv.id,
              type: 'ONLINE_ORDER_PICKED',
              quantityChange: -item.quantity, // this represents actual permanent deduction
              sourceType: 'ORDER',
              sourceId: order.id,
              staffId,
            }
          });
        }
      }

      return updatedOrder;
    });
  }

  async getStoreOrders(storeId: string) {
    return this.prisma.order.findMany({
      where: { storeId },
      include: { items: { include: { product: true } }, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
