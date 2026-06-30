import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Core function to record a stock movement.
   * This is the only way inventory quantities should be updated.
   */
  async recordMovement(data: {
    storeId: string;
    productId: string;
    type: MovementType;
    quantityChange: number;
    batchNo?: string;
    expiryDate?: Date;
    sourceType?: string;
    sourceId?: string;
    reason?: string;
    staffId?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find or create the specific inventory record (by product + store + batch)
      let inventory = await tx.inventory.findFirst({
        where: {
          storeId: data.storeId,
          productId: data.productId,
          batchNo: data.batchNo || null,
        },
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            storeId: data.storeId,
            productId: data.productId,
            batchNo: data.batchNo,
            expiryDate: data.expiryDate,
          },
        });
      }

      // 2. Create the movement log (Source of Truth)
      await tx.stockMovement.create({
        data: {
          storeId: data.storeId,
          productId: data.productId,
          inventoryId: inventory.id,
          type: data.type,
          quantityChange: data.quantityChange,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          reason: data.reason,
          staffId: data.staffId,
        },
      });

      // 3. Update the materialized inventory quantities based on movement type
      let onHandDelta = 0;
      let reservedDelta = 0;
      let blockedDelta = 0;

      switch (data.type) {
        case 'STOCK_RECEIVED':
        case 'RETURN_ACCEPTED':
        case 'MANUAL_ADJUSTMENT':
        case 'STOCK_COUNT_CORRECTION':
          onHandDelta = data.quantityChange;
          break;
        case 'POS_SALE':
          onHandDelta = -data.quantityChange; // quantityChange should be positive in input
          break;
        case 'ONLINE_ORDER_RESERVED':
          reservedDelta = data.quantityChange; // Reserve stock
          break;
        case 'ONLINE_ORDER_PICKED':
          // Order is picked and finalized -> reduce onHand, reduce reserved
          onHandDelta = -data.quantityChange;
          reservedDelta = -data.quantityChange;
          break;
        case 'ORDER_CANCELLED':
          // Release reservation
          reservedDelta = -data.quantityChange;
          break;
        case 'DAMAGED':
        case 'EXPIRED':
          onHandDelta = -data.quantityChange;
          blockedDelta = data.quantityChange; // Optionally move to blocked instead of just reducing onHand
          break;
      }

      // Ensure we don't drop below 0 for on-hand if it's a strict deduction
      if (inventory.onHandQty + onHandDelta < 0) {
        throw new BadRequestException(`Insufficient stock for product ${data.productId}`);
      }

      // 4. Save the updated inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          onHandQty: { increment: onHandDelta },
          reservedQty: { increment: reservedDelta },
          blockedQty: { increment: blockedDelta },
        },
      });

      return updatedInventory;
    });
  }

  // --- Convenience Methods ---

  async receiveStock(storeId: string, productId: string, qty: number, staffId?: string, batchNo?: string) {
    return this.recordMovement({
      storeId,
      productId,
      type: 'STOCK_RECEIVED',
      quantityChange: qty,
      batchNo,
      staffId,
    });
  }

  async reserveStockForOnlineOrder(storeId: string, productId: string, qty: number, orderId: string) {
    return this.recordMovement({
      storeId,
      productId,
      type: 'ONLINE_ORDER_RESERVED',
      quantityChange: qty,
      sourceType: 'ONLINE_ORDER',
      sourceId: orderId,
    });
  }

  async processPosSale(storeId: string, productId: string, qty: number, billId: string, staffId: string) {
    return this.recordMovement({
      storeId,
      productId,
      type: 'POS_SALE',
      quantityChange: qty, // Passing positive, engine handles subtraction
      sourceType: 'POS_BILL',
      sourceId: billId,
      staffId,
    });
  }

  async getAvailableStock(storeId: string, productId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { storeId, productId },
    });
    
    if (!inventory) return { available: 0, onHand: 0, reserved: 0, blocked: 0 };
    
    const available = inventory.onHandQty - inventory.reservedQty - inventory.blockedQty;
    
    return {
      available: Math.max(0, available),
      onHand: inventory.onHandQty,
      reserved: inventory.reservedQty,
      blocked: inventory.blockedQty,
    };
  }

  async getMovementHistory(storeId: string, productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: {
        storeId,
        ...(productId ? { productId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
        staff: { select: { name: true, role: true } },
      },
      take: 100,
    });
  }
}
