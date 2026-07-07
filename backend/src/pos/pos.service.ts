import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BillStatus, PaymentMethod } from '@prisma/client';
import { EventBusService } from '../common/events/event-bus.service';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private eventBus: EventBusService
  ) {}

  async createDraftBill(storeId: string, staffId: string) {
    return this.prisma.posBill.create({
      data: {
        storeId,
        staffId,
        status: BillStatus.DRAFT,
      },
    });
  }

  async addItemToBill(billId: string, productId: string, quantity: number) {
    const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
    if (!bill || bill.status !== BillStatus.DRAFT) {
      throw new BadRequestException('Bill not found or not in DRAFT state');
    }

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const priceAtSale = product.sellingPrice;
    const gstAtSale = product.gstRate;

    // We don't deduct stock here, just add to bill
    const item = await this.prisma.posBillItem.create({
      data: {
        billId,
        productId,
        quantity,
        priceAtSale,
        gstAtSale,
      },
    });

    await this.recalculateBillTotals(billId);
    return item;
  }

  async checkoutBill(billId: string, paymentMethod: PaymentMethod, amount: number, referenceId?: string, customerId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.posBill.findUnique({
        where: { id: billId },
        include: { items: true },
      });

      if (!bill || bill.status !== BillStatus.DRAFT) {
        throw new BadRequestException('Bill not found or already processed');
      }

      if (amount < bill.total) {
        throw new BadRequestException(`Insufficient payment. Total is ${bill.total}`);
      }

      // 0. Handle ZapCredit Payment
      if (paymentMethod === PaymentMethod.ZAPCREDIT) {
        if (!customerId) {
          throw new BadRequestException('customerId is required for ZapCredit payments');
        }

        const customer = await tx.user.findUnique({ where: { id: customerId } });
        if (!customer) throw new NotFoundException('Customer not found');

        // Decrease balance since Udhar means they owe us (balance goes negative)
        const newBalance = customer.zapCreditBalance - amount;

        await tx.user.update({
          where: { id: customerId },
          data: { zapCreditBalance: newBalance }
        });

        await tx.zapCreditLedger.create({
          data: {
            storeId: bill.storeId,
            customerId: customerId,
            staffId: bill.staffId,
            amount: -amount,
            balanceAfter: newBalance,
            note: `POS Checkout - Bill ${bill.id}`,
            posBillId: bill.id,
          }
        });
      }

      // 1. Mark Bill as PAID
      const updatedBill = await tx.posBill.update({
        where: { id: billId },
        data: { status: BillStatus.PAID },
      });

      // 2. Record Payment
      await tx.posPayment.create({
        data: {
          billId,
          amount,
          method: paymentMethod,
          referenceId,
        },
      });

      // 2b. If CASH, deposit to active Till
      if (paymentMethod === 'CASH') {
        const activeTill = await tx.till.findFirst({
          where: { storeId: bill.storeId, status: 'OPEN' },
        });
        if (activeTill) {
          await tx.tillTransaction.create({
            data: {
              tillId: activeTill.id,
              type: 'SALE',
              amount,
              reason: `POS Sale - Bill ${bill.id}`,
            },
          });
          await tx.till.update({
            where: { id: activeTill.id },
            data: { expectedBalance: { increment: amount } },
          });
        }
      }

      // 3. Emit Event for decoupled processing (Inventory, Ledgering)
      await this.eventBus.publish('pos.sale.completed', {
        storeId: bill.storeId,
        billId: bill.id,
        items: bill.items,
        staffId: bill.staffId,
        payment: {
          method: paymentMethod,
          amount,
        }
      });

      return updatedBill;
    });
  }

  private async recalculateBillTotals(billId: string) {
    const items = await this.prisma.posBillItem.findMany({ where: { billId } });
    
    let subtotal = 0;
    let gst = 0;
    
    for (const item of items) {
      const itemTotal = item.priceAtSale * item.quantity;
      subtotal += itemTotal;
      // Simplified GST calculation for now (assuming price is exclusive, adjust as needed)
      gst += itemTotal * (item.gstAtSale / 100); 
    }
    
    const total = subtotal + gst;

    await this.prisma.posBill.update({
      where: { id: billId },
      data: { subtotal, gst, total },
    });
  }

  /**
   * Get a POS bill with all items and current totals.
   */
  async getBill(billId: string) {
    const bill = await this.prisma.posBill.findUnique({
      where: { id: billId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, barcode: true, imageUrl: true, category: true } } },
        },
        payments: true,
        staff: { select: { id: true, name: true, role: true } },
      },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }

  /**
   * Add an item to a POS bill by scanning its barcode.
   * Resolves product from store catalog, then calls addItemToBill.
   */
  async addItemByBarcode(billId: string, storeId: string, barcode: string, quantity: number) {
    const bill = await this.prisma.posBill.findUnique({ where: { id: billId } });
    if (!bill || bill.status !== BillStatus.DRAFT) {
      throw new BadRequestException('Bill not found or not in DRAFT state');
    }

    // Resolve product from barcode (BarcodeRegistry → Product table)
    const registryEntry = await this.prisma.barcodeRegistry.findFirst({
      where: { barcodeValue: barcode, isActive: true, OR: [{ storeId }, { storeId: null }] },
      include: { product: true },
    });

    let product = registryEntry?.product ?? null;

    if (!product) {
      product = await this.prisma.product.findFirst({
        where: { barcode, storeId, isActive: true },
      });
    }

    if (!product) {
      throw new NotFoundException(`No product found for barcode ${barcode} in this store`);
    }

    return this.addItemToBill(billId, product.id, quantity);
  }

  /**
   * Look up a customer by phone number.
   */
  async getCustomerByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, zapCreditBalance: true }
    });
  }
}

