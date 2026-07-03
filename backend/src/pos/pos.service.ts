import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BillStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PosService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService
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

  async checkoutBill(billId: string, paymentMethod: PaymentMethod, amount: number, referenceId?: string) {
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

      // 3. Deduct Stock via Inventory Engine logic
      // Note: We use the existing InventoryService processPosSale method which ensures
      // strict audit logging and handles blocked/reserved quantities properly.
      for (const item of bill.items) {
        await this.inventoryService.processPosSale(
          bill.storeId,
          item.productId,
          item.quantity,
          bill.id,
          bill.staffId!
        );
      }

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
}

