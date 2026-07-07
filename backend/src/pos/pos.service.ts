import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BillStatus, PaymentMethod } from '@prisma/client';
import { EventBusService } from '../common/events/event-bus.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * PosService — fully fixed for ERP schema.
 * - Resolves storeProductId via StoreProductBarcode (not legacy Product.barcode)
 * - Reads pricing from StoreProductPricing (latest record)
 * - Reads tax from ProductTaxProfile (latest record)
 * - Creates full invoice snapshot on PosBillItem (bug #3, #4, #10, #11)
 * - Decimal-safe arithmetic throughout
 */

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventBus: EventBusService,
  ) {}

  async createDraftBill(storeId: string, staffId: string) {
    return this.prisma.posBill.create({
      data: { storeId, staffId, status: BillStatus.DRAFT },
    });
  }

  /**
   * Resolve storeProduct + current pricing and tax from storeProductId.
   * Central helper to avoid duplicating resolution logic.
   */
  private async resolveStoreProductForPOS(storeProductId: string) {
    const sp = await this.prisma.storeProduct.findUnique({
      where: { id: storeProductId },
      include: {
        product: { select: { name: true, hsnSacCode: true } },
        pricing: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        taxProfile: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
        productBarcodes: { where: { isPrimary: true, isActive: true }, take: 1 },
        inventoryPolicy: true,
        discountPolicy: true,
      },
    });
    if (!sp) throw new NotFoundException(`StoreProduct ${storeProductId} not found`);

    const pricing = sp.pricing?.[0];
    const tax = sp.taxProfile?.[0];

    if (!pricing) throw new BadRequestException(`StoreProduct ${storeProductId} has no active pricing`);

    return { sp, pricing, tax };
  }

  async addItemToBill(billId: string, storeProductId: string, quantity: number) {
    const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
    if (!bill || bill.status !== BillStatus.DRAFT) {
      throw new BadRequestException('Bill not found or not in DRAFT state');
    }

    const { sp, pricing, tax } = await this.resolveStoreProductForPOS(storeProductId);

    const qty = new Decimal(quantity);
    const sellingPrice = pricing.sellingPrice ?? pricing.rateA ?? pricing.mrp ?? new Decimal(0);
    const mrp = pricing.mrp ?? sellingPrice;
    const cgstRate = tax?.cgstRate ?? new Decimal(0);
    const sgstRate = tax?.sgstRate ?? new Decimal(0);
    const igstRate = tax?.igstRate ?? new Decimal(0);
    const cessRate = tax?.cessRate ?? new Decimal(0);

    // If price is tax-inclusive, extract taxable value
    const totalGstRate = cgstRate.plus(sgstRate).plus(igstRate);
    let taxableValue: Decimal;
    let cgstAmount: Decimal;
    let sgstAmount: Decimal;
    let igstAmount: Decimal;
    let cessAmount: Decimal;

    if (tax?.taxInclusive !== false && totalGstRate.greaterThan(0)) {
      // Tax-inclusive: taxable = price / (1 + rate/100)
      taxableValue = sellingPrice.dividedBy(new Decimal(1).plus(totalGstRate.dividedBy(100))).times(qty);
    } else {
      taxableValue = sellingPrice.times(qty);
    }

    cgstAmount = taxableValue.times(cgstRate.dividedBy(100)).toDecimalPlaces(2);
    sgstAmount = taxableValue.times(sgstRate.dividedBy(100)).toDecimalPlaces(2);
    igstAmount = taxableValue.times(igstRate.dividedBy(100)).toDecimalPlaces(2);
    cessAmount = taxableValue.times(cessRate.dividedBy(100)).toDecimalPlaces(2);
    taxableValue = taxableValue.toDecimalPlaces(2);

    const totalLineAmount = sellingPrice.times(qty).toDecimalPlaces(2);

    // Create PosBillItem with FULL invoice snapshot
    const item = await this.prisma.posBillItem.create({
      data: {
        billId,
        storeProductId,
        quantity: qty,
        // Product snapshot
        productNameSnapshot: sp.displayName ?? sp.product?.name,
        barcodeSnapshot: sp.productBarcodes?.[0]?.barcode,
        hsnSacCodeSnapshot: tax?.hsnSacCode ?? sp.product?.hsnSacCode,
        unitSnapshot: (sp.inventoryPolicy as any)?.saleUom ?? 'PCS',
        // Price snapshot
        mrpSnapshot: mrp,
        sellingPriceSnapshot: sellingPrice,
        discountSnapshot: new Decimal(0),
        discountAmountSnapshot: new Decimal(0),
        // Tax snapshot
        taxableValueSnapshot: taxableValue,
        cgstRateSnapshot: cgstRate,
        cgstAmountSnapshot: cgstAmount,
        sgstRateSnapshot: sgstRate,
        sgstAmountSnapshot: sgstAmount,
        igstRateSnapshot: igstRate,
        igstAmountSnapshot: igstAmount,
        cessRateSnapshot: cessRate,
        cessAmountSnapshot: cessAmount,
        totalLineAmount,
      },
    });

    await this.recalculateBillTotals(billId);
    return item;
  }

  /**
   * Resolve barcode → storeProduct → call addItemToBill
   * Priority: StoreProductBarcode → BarcodeRegistry
   */
  async addItemByBarcode(billId: string, storeId: string, barcode: string, quantity: number) {
    const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
    if (!bill || bill.status !== BillStatus.DRAFT) {
      throw new BadRequestException('Bill not found or not in DRAFT state');
    }

    // Resolution path 1: StoreProductBarcode (primary path)
    const spBarcode = await this.prisma.storeProductBarcode.findFirst({
      where: { barcode, isActive: true, storeProduct: { storeId } },
      select: { storeProductId: true },
    });

    if (spBarcode) {
      return this.addItemToBill(billId, spBarcode.storeProductId, quantity);
    }

    // Resolution path 2: BarcodeRegistry (global/external barcodes)
    const registry = await this.prisma.barcodeRegistry.findFirst({
      where: { barcodeValue: barcode, isActive: true, OR: [{ storeId }, { storeId: null }] },
      select: { storeProductId: true },
    });

    if (registry?.storeProductId) {
      return this.addItemToBill(billId, registry.storeProductId, quantity);
    }

    throw new NotFoundException(`No product found for barcode ${barcode} in store ${storeId}`);
  }

  async checkoutBill(
    billId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    referenceId?: string,
    customerId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.posBill.findUnique({
        where: { id: billId },
        include: { items: true },
      });

      if (!bill || bill.status !== BillStatus.DRAFT) {
        throw new BadRequestException('Bill not found or already processed');
      }

      const payAmount = new Decimal(amount);
      const billTotal = new Decimal(bill.total);

      if (payAmount.lessThan(billTotal)) {
        throw new BadRequestException(`Insufficient payment. Total is ₹${billTotal.toFixed(2)}`);
      }

      // ZapCredit (Udhar) — Decimal-safe arithmetic
      if (paymentMethod === PaymentMethod.ZAPCREDIT) {
        if (!customerId) throw new BadRequestException('customerId is required for ZapCredit payments');
        const customer = await tx.user.findUnique({ where: { id: customerId } });
        if (!customer) throw new NotFoundException('Customer not found');

        const newBalance = new Decimal(customer.zapCreditBalance).minus(payAmount);

        await tx.user.update({
          where: { id: customerId },
          data: { zapCreditBalance: newBalance },
        });

        await tx.zapCreditLedger.create({
          data: {
            storeId: bill.storeId,
            customerId,
            staffId: bill.staffId,
            amount: payAmount.negated(),
            balanceAfter: newBalance,
            note: `POS Checkout - Bill ${bill.id}`,
            posBillId: bill.id,
          },
        });
      }

      // Mark bill as PAID
      const updatedBill = await tx.posBill.update({
        where: { id: billId },
        data: { status: BillStatus.PAID },
      });

      // Record payment
      await tx.posPayment.create({
        data: { billId, amount: payAmount, method: paymentMethod, referenceId },
      });

      // Cash goes to active Till
      if (paymentMethod === PaymentMethod.CASH) {
        const activeTill = await tx.till.findFirst({
          where: { storeId: bill.storeId, status: 'OPEN' },
        });
        if (activeTill) {
          await tx.tillTransaction.create({
            data: { tillId: activeTill.id, type: 'SALE', amount: payAmount, reason: `POS Sale - Bill ${bill.id}` },
          });
          await tx.till.update({
            where: { id: activeTill.id },
            data: { expectedBalance: { increment: payAmount.toNumber() } },
          });
        }
      }

      // Emit event for decoupled inventory deduction
      await this.eventBus.publish('pos.sale.completed', {
        storeId: bill.storeId,
        billId: bill.id,
        items: bill.items,
        staffId: bill.staffId,
        payment: { method: paymentMethod, amount: payAmount.toNumber() },
      });

      return updatedBill;
    });
  }

  private async recalculateBillTotals(billId: string) {
    const items = await this.prisma.posBillItem.findMany({ where: { billId } });

    let subtotal = new Decimal(0);
    let gst = new Decimal(0);

    for (const item of items) {
      const lineTotal = new Decimal(item.totalLineAmount);
      const cgst = new Decimal(item.cgstAmountSnapshot ?? 0);
      const sgst = new Decimal(item.sgstAmountSnapshot ?? 0);
      const igst = new Decimal(item.igstAmountSnapshot ?? 0);
      const cess = new Decimal(item.cessAmountSnapshot ?? 0);

      subtotal = subtotal.plus(lineTotal);
      gst = gst.plus(cgst).plus(sgst).plus(igst).plus(cess);
    }

    const total = subtotal.toDecimalPlaces(2);
    const gstTotal = gst.toDecimalPlaces(2);

    await this.prisma.posBill.update({
      where: { id: billId },
      data: {
        subtotal: subtotal.minus(gstTotal).toDecimalPlaces(2),
        gst: gstTotal,
        total,
      },
    });
  }

  async getBill(billId: string) {
    const bill = await this.prisma.posBill.findUnique({
      where: { id: billId },
      include: {
        items: {
          include: {
            storeProduct: {
              include: {
                product: { select: { id: true, name: true } },
                productBarcodes: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        payments: true,
        staff: { select: { id: true, name: true, role: true } },
      },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  async getCustomerByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, zapCreditBalance: true },
    });
  }

  async getDailyBills(storeId: string, date?: Date) {
    const targetDate = date ?? new Date();
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate); end.setHours(23, 59, 59, 999);

    return this.prisma.posBill.findMany({
      where: { storeId, status: 'PAID', createdAt: { gte: start, lte: end } },
      include: { items: true, payments: true, staff: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
