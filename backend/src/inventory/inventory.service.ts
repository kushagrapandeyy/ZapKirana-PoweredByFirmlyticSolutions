import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '../cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private cache: CacheService,
    private realtimeService: RealtimeService,
  ) {}

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
    const result = await this.prisma.$transaction(async (tx) => {
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

      return { updatedInventory, onHandDelta };
    });

    // 5. Emit low stock event if quantity decreased and went below threshold (e.g. 10)
    if (result.onHandDelta < 0 && result.updatedInventory.onHandQty <= 10) {
      this.eventEmitter.emit('inventory.low_stock', {
        storeId: data.storeId,
        productId: data.productId,
        onHandQty: result.updatedInventory.onHandQty
      });
    }

    // 6. Broadcast Realtime Update
    this.realtimeService.broadcastInventoryUpdate(data.storeId, data.productId, {
      onHandQty: result.updatedInventory.onHandQty,
      availableQty: result.updatedInventory.onHandQty - result.updatedInventory.reservedQty - result.updatedInventory.blockedQty,
    });

    return result.updatedInventory;
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

  async getProducts(storeId?: string) {
    const cacheKey = `inventory:products:${storeId || 'all'}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: storeId ? { storeId, isActive: true } : { isActive: true },
      include: {
        campaign: true,
      }
    });

    await this.cache.set(cacheKey, products, 300); // Cache for 5 minutes
    return products;
  }

  async getClearanceProducts(storeId: string) {
    const cacheKey = `inventory:clearance:${storeId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const expiringInventory = await this.prisma.inventory.findMany({
      where: {
        storeId,
        expiryDate: { lte: threeDaysFromNow, gte: new Date() },
        onHandQty: { gt: 0 },
      },
      include: { product: true },
    });

    const productMap = new Map();
    for (const inv of expiringInventory) {
      if (!productMap.has(inv.productId)) {
        const clearanceProduct = {
          ...inv.product,
          originalPrice: inv.product.sellingPrice,
          sellingPrice: Number((inv.product.sellingPrice * 0.7).toFixed(2)),
          clearanceReason: 'Expiring Soon',
          expiryDate: inv.expiryDate,
        };
        productMap.set(inv.productId, clearanceProduct);
      }
    }

    const result = Array.from(productMap.values());
    await this.cache.set(cacheKey, result, 600); // Cache for 10 minutes
    return result;
  }

  async getNewProducts(storeId: string) {
    const cacheKey = `inventory:new:${storeId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.prisma.product.findMany({
      where: {
        storeId,
        isActive: true,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { campaign: true }
    });

    await this.cache.set(cacheKey, result, 600); // Cache for 10 minutes
    return result;
  }

  async getPopularProducts(storeId: string) {
    const cacheKey = `inventory:popular_products:${storeId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    // A simple mock for popular products: taking top 10 products with highest inventory
    const products = await this.prisma.product.findMany({
      where: { storeId, isActive: true },
      include: {
        inventory: true,
      },
      take: 10,
    });

    // Actually we could sort by something better, but let's just return a few
    await this.cache.set(cacheKey, products, 300); // cache 5 mins
    return products;
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

  @OnEvent('purchase_order.grn_completed')
  async handleGrnCompleted(event: { po: any; staffId: string }) {
    for (const item of event.po.items) {
      if (item.receivedQuantity > 0) {
        await this.receiveStock(
          event.po.storeId,
          item.productId,
          item.receivedQuantity,
          event.staffId,
          `PO-${event.po.id}`
        );
      }
    }
  }

  // --- Pending Products (Approvals) ---

  async getPendingProducts(storeId: string) {
    return this.prisma.pendingProduct.findMany({
      where: { storeId, status: 'PENDING_REVIEW' },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true, role: true } } },
    });
  }

  async approvePendingProduct(
    id: string,
    data: { name: string; category?: string; mrp: number; sellingPrice: number; gstClass?: any }
  ) {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.pendingProduct.findUnique({ where: { id } });
      if (!pending) throw new BadRequestException('Pending product not found');
      if (pending.status !== 'PENDING_REVIEW') throw new BadRequestException('Already processed');

      // 1. Create the official product
      const product = await tx.product.create({
        data: {
          storeId: pending.storeId,
          name: data.name,
          category: data.category || pending.suggestedCategory,
          mrp: data.mrp,
          sellingPrice: data.sellingPrice,
          gstClass: data.gstClass || 'EXEMPT',
          barcode: pending.barcode,
          internalSku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          imageUrl: pending.imageUrl,
        },
      });

      // 2. Add to barcode registry
      if (pending.barcode) {
        await tx.barcodeRegistry.create({
          data: {
            storeId: pending.storeId,
            productId: product.id,
            barcodeValue: pending.barcode,
            symbology: 'EAN_13', // default assumption
            barcodeScope: 'GS1_EXTERNAL_PRODUCT',
          },
        });
      }

      // 3. Update pending status
      await tx.pendingProduct.update({
        where: { id },
        data: { status: 'APPROVED', approvedProductId: product.id },
      });

      return product;
    });
  }

  async rejectPendingProduct(id: string) {
    const pending = await this.prisma.pendingProduct.findUnique({ where: { id } });
    if (!pending) throw new BadRequestException('Pending product not found');

    return this.prisma.pendingProduct.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }
}
