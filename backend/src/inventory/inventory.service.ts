import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MovementType } from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CacheService } from '../cache/cache.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * InventoryService — operates exclusively on StoreProduct (not the legacy Product model).
 * All movements use storeProductId. StockBalance uses storeId_storeProductId composite key.
 */

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private cache: CacheService,
    private realtimeService: RealtimeService,
  ) {}

  /**
   * Core function — record a stock movement.
   * This is the ONLY way inventory quantities should ever change.
   * Operates on storeProductId (not productId).
   */
  async recordMovement(data: {
    storeId: string;
    storeProductId: string;
    type: MovementType;
    quantityChange: number;
    batchNo?: string;
    expiryDate?: Date;
    sourceType?: string;
    sourceId?: string;
    reason?: string;
    staffId?: string;
    note?: string;
  }) {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Find or create Inventory record (by storeProduct + store + batch)
      let inventory = await tx.inventory.findFirst({
        where: {
          storeId: data.storeId,
          storeProductId: data.storeProductId,
          batchNo: data.batchNo ?? null,
        },
        include: { storeProduct: { include: { inventoryPolicy: true } } },
      });

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            storeId: data.storeId,
            storeProductId: data.storeProductId,
            batchNo: data.batchNo,
            expiryDate: data.expiryDate,
          },
          include: { storeProduct: { include: { inventoryPolicy: true } } },
        });
      }

      // 2. Compute deltas based on movement type
      let onHandDelta = new Decimal(0);
      let reservedDelta = new Decimal(0);
      let blockedDelta = new Decimal(0);
      const qty = new Decimal(data.quantityChange);

      switch (data.type) {
        case 'OPENING_STOCK':
        case 'PURCHASE_RECEIPT':
        case 'SALE_RETURN':
        case 'STOCK_TRANSFER_IN':
        case 'MANUAL_ADJUSTMENT':
        case 'STOCK_COUNT_CORRECTION':
        // Legacy aliases
        case 'STOCK_RECEIVED':
        case 'RETURN_ACCEPTED':
          onHandDelta = qty;
          break;

        case 'SALE_DEDUCTION':
        case 'POS_SALE':
        case 'SALE':
          onHandDelta = qty.negated();
          break;

        case 'RESERVATION':
        case 'ONLINE_ORDER_RESERVED':
          reservedDelta = qty;
          break;

        case 'RESERVATION_RELEASE':
        case 'ORDER_CANCELLED':
          reservedDelta = qty.negated();
          break;

        case 'ONLINE_ORDER_PICKED':
          // Stock finalized: remove from onHand AND release reservation
          onHandDelta = qty.negated();
          reservedDelta = qty.negated();
          break;

        case 'DAMAGE_WRITE_OFF':
        case 'EXPIRY_WRITE_OFF':
        case 'DAMAGED':
        case 'EXPIRED':
        case 'DAMAGE':
          onHandDelta = qty.negated();
          blockedDelta = qty;
          break;

        case 'STOCK_TRANSFER_OUT':
        case 'PURCHASE_RETURN':
          onHandDelta = qty.negated();
          break;
      }

      // 3. Guard: never drop onHand below 0 unless allowNegativeStock is set
      const currentQty = new Decimal(inventory.quantityBase);
      const newQty = currentQty.plus(onHandDelta);

      if (!inventory.storeProduct?.inventoryPolicy?.allowNegativeStock && newQty.lessThan(0)) {
        throw new BadRequestException(
          `Insufficient stock for storeProduct ${data.storeProductId}. Available: ${currentQty}, Requested: ${qty}`,
        );
      }

      // 4. Record the immutable movement
      const movement = await tx.stockMovement.create({
        data: {
          storeId: data.storeId,
          storeProductId: data.storeProductId,
          inventoryId: inventory.id,
          type: data.type,
          quantityDelta: onHandDelta,
          previousQty: currentQty,
          newQty,
          inputQuantity: qty,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          reason: data.reason,
          note: data.note,
          staffId: data.staffId,
        },
      });

      // 5. Update materialized Inventory quantities
      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantityBase: { increment: onHandDelta.toNumber() },
          reservedQty: { increment: reservedDelta.toNumber() },
          blockedQty: { increment: blockedDelta.toNumber() },
        },
      });

      // 6. Update StockBalance (fast read model) — key is storeId_storeProductId
      await tx.stockBalance.upsert({
        where: { storeId_storeProductId: { storeId: data.storeId, storeProductId: data.storeProductId } },
        update: {
          balance: { increment: onHandDelta.toNumber() },
          lastMovementId: movement.id,
          lastCalculatedAt: new Date(),
        },
        create: {
          storeId: data.storeId,
          storeProductId: data.storeProductId,
          balance: onHandDelta.toNumber(),
          lastMovementId: movement.id,
        },
      });

      return { updatedInventory, onHandDelta };
    });

    // 7. Low-stock event if quantity went below reorder point
    const policy = await this.prisma.productInventoryPolicy.findUnique({
      where: { storeProductId: data.storeProductId },
    });
    const currentQty = Number(result.updatedInventory.quantityBase);
    const reorderQty = policy?.reorderQty ? Number(policy.reorderQty) : 10;

    if (result.onHandDelta.lessThan(0) && currentQty <= reorderQty) {
      this.eventEmitter.emit('inventory.low_stock', {
        storeId: data.storeId,
        storeProductId: data.storeProductId,
        currentQty,
        reorderQty,
      });
    }

    // 8. Broadcast real-time update
    this.realtimeService.broadcastInventoryUpdate(data.storeId, data.storeProductId, {
      onHandQty: currentQty,
      availableQty: currentQty - Number(result.updatedInventory.reservedQty) - Number(result.updatedInventory.blockedQty),
    });

    return result.updatedInventory;
  }

  // =====================================================
  // CONVENIENCE METHODS
  // =====================================================

  async receiveStock(storeId: string, storeProductId: string, qty: number, staffId?: string, batchNo?: string) {
    return this.recordMovement({ storeId, storeProductId, type: 'STOCK_RECEIVED', quantityChange: qty, batchNo, staffId });
  }

  async reserveStockForOnlineOrder(storeId: string, storeProductId: string, qty: number, orderId: string) {
    return this.recordMovement({
      storeId, storeProductId, type: 'ONLINE_ORDER_RESERVED', quantityChange: qty,
      sourceType: 'ONLINE_ORDER', sourceId: orderId,
    });
  }

  async processPosSale(storeId: string, storeProductId: string, qty: number, billId: string, staffId: string) {
    return this.recordMovement({
      storeId, storeProductId, type: 'POS_SALE', quantityChange: qty,
      sourceType: 'POS_BILL', sourceId: billId, staffId,
    });
  }

  async getAvailableStock(storeId: string, storeProductId: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { storeId, storeProductId },
    });
    if (!inventory) return { available: new Decimal(0), onHand: new Decimal(0), reserved: new Decimal(0), blocked: new Decimal(0) };

    const onHand = new Decimal(inventory.quantityBase);
    const reserved = new Decimal(inventory.reservedQty);
    const blocked = new Decimal(inventory.blockedQty);
    const available = Decimal.max(0, onHand.minus(reserved).minus(blocked));

    return { available, onHand, reserved, blocked };
  }

  async getStockBalance(storeId: string, storeProductId: string) {
    return this.prisma.inventory.findFirst({
      where: { storeId, storeProductId },
    });
  }

  // =====================================================
  // PRODUCT LIST QUERIES (now via StoreProduct)
  // =====================================================

  async getProducts(storeId: string) {
    const cacheKey = `inventory:storeproducts:${storeId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const products = await this.prisma.storeProduct.findMany({
      where: { storeId, status: { not: 'INACTIVE' }, isHidden: false },
      include: {
        product: { include: { brand: true, category: true } },
        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        productBarcodes: { where: { isPrimary: true, isActive: true }, take: 1 },
        stockBalances: true,
        campaigns: { where: { isActive: true }, take: 1 },
      },
      orderBy: { displayName: 'asc' },
    });

    await this.cache.set(cacheKey, products, 300);
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
        quantityBase: { gt: 0 },
      },
      include: {
        storeProduct: {
          include: {
            product: { include: { brand: true } },
            pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
          },
        },
      },
    });

    const productMap = new Map();
    for (const inv of expiringInventory) {
      if (!productMap.has(inv.storeProductId)) {
        const pricing = inv.storeProduct.pricing?.[0];
        const originalPrice = pricing?.sellingPrice ? Number(pricing.sellingPrice) : 0;
        productMap.set(inv.storeProductId, {
          ...inv.storeProduct,
          originalPrice,
          clearancePrice: Number((originalPrice * 0.7).toFixed(2)),
          clearanceReason: 'Expiring Soon',
          expiryDate: inv.expiryDate,
        });
      }
    }

    const result = Array.from(productMap.values());
    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async getNewProducts(storeId: string) {
    const cacheKey = `inventory:new:${storeId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await this.prisma.storeProduct.findMany({
      where: { storeId, status: { not: 'INACTIVE' }, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        product: { include: { brand: true, category: true } },
        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        productBarcodes: { where: { isPrimary: true }, take: 1 },
        campaigns: { where: { isActive: true }, take: 1 },
      },
    });

    await this.cache.set(cacheKey, result, 600);
    return result;
  }

  async getPopularProducts(storeId: string) {
    const cacheKey = `inventory:popular:${storeId}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    // Popularity = highest movement count in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const movements = await this.prisma.stockMovement.groupBy({
      by: ['storeProductId'],
      where: { storeId, type: { in: ['POS_SALE', 'SALE_DEDUCTION'] }, createdAt: { gte: thirtyDaysAgo } },
      _sum: { quantityDelta: true },
      orderBy: { _sum: { quantityDelta: 'desc' } },
      take: 10,
    });

    const storeProductIds = movements.map((m) => m.storeProductId);
    if (!storeProductIds.length) return [];

    const products = await this.prisma.storeProduct.findMany({
      where: { id: { in: storeProductIds } },
      include: {
        product: { include: { brand: true, category: true } },
        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        productBarcodes: { where: { isPrimary: true }, take: 1 },
        stockBalances: true,
      },
    });

    await this.cache.set(cacheKey, products, 300);
    return products;
  }

  async getMovementHistory(storeId: string, storeProductId?: string) {
    return this.prisma.stockMovement.findMany({
      where: { storeId, ...(storeProductId ? { storeProductId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        storeProduct: { include: { product: { select: { name: true } } } },
        staff: { select: { name: true, role: true } },
      },
      take: 100,
    });
  }

  // =====================================================
  // GRN EVENT HANDLER
  // =====================================================

  @OnEvent('purchase_order.grn_completed')
  async handleGrnCompleted(event: { po: any; staffId: string }) {
    for (const item of event.po.items) {
      if (item.receivedQuantity > 0) {
        // Items must now carry storeProductId
        const storeProductId = item.storeProductId ?? item.productId;
        await this.receiveStock(
          event.po.storeId,
          storeProductId,
          Number(item.receivedQuantity),
          event.staffId,
          `PO-${event.po.id}`,
        );
      }
    }
  }

  // =====================================================
  // LOW-STOCK ALERTS
  // =====================================================

  async getLowStockProducts(storeId: string) {
    const policies = await this.prisma.productInventoryPolicy.findMany({
      where: { storeProduct: { storeId } },
      include: { storeProduct: { include: { inventory: true, product: { select: { name: true } } } } },
    });

    return policies
      .filter((p) => {
        const balance = p.storeProduct?.inventory?.[0]?.quantityBase;
        const reorderQty = p.reorderQty ?? new Decimal(10);
        return balance != null && new Decimal(balance).lessThanOrEqualTo(reorderQty);
      })
      .map((p) => ({
        storeProductId: p.storeProductId,
        name: p.storeProduct?.displayName ?? p.storeProduct?.product?.name ?? 'Unknown',
        currentQty: Number(p.storeProduct?.inventory?.[0]?.quantityBase ?? 0),
        reorderQty: Number(p.reorderQty ?? 10),
        minimumQty: Number(p.minimumQty ?? 0),
      }));
  }
}
