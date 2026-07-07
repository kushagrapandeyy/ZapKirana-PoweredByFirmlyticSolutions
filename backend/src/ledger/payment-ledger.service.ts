import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentLedgerType } from '@prisma/client';

@Injectable()
export class PaymentLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a new payment entry to the double-entry immutable ledger.
   */
  async logPaymentEvent(data: {
    storeId: string;
    type: PaymentLedgerType;
    amount: number;
    currency?: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    referenceId?: string;
    metadata?: any;
    status?: string;
  }) {
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.paymentLedgerEntry.create({
      data: {
        storeId: data.storeId,
        type: data.type,
        amount: data.amount,
        currency: data.currency || 'INR',
        razorpayPaymentId: data.razorpayPaymentId,
        razorpayOrderId: data.razorpayOrderId,
        referenceId: data.referenceId,
        metadata: data.metadata || {},
        status: data.status || 'COMPLETED',
      },
    });
  }

  /**
   * Retrieves the current balance snapshot for a store based on ledger sums
   */
  async getStoreBalance(storeId: string) {
    const entries = await this.prisma.paymentLedgerEntry.findMany({
      where: { storeId, status: 'COMPLETED' },
    });

    let totalCollected = 0;
    let totalSettled = 0;
    let totalRefunds = 0;
    let totalCommissions = 0;

    entries.forEach((entry) => {
      switch (entry.type) {
        case 'RAZORPAY_CAPTURE':
        case 'CASH_COLLECTION':
          totalCollected += entry.amount;
          break;
        case 'RAZORPAY_SETTLEMENT':
        case 'STORE_PAYOUT':
          totalSettled += entry.amount;
          break;
        case 'RAZORPAY_REFUND':
          totalRefunds += entry.amount;
          break;
        case 'COMMISSION_DEDUCTION':
          totalCommissions += entry.amount;
          break;
      }
    });

    return {
      totalCollected,
      totalSettled,
      totalRefunds,
      totalCommissions,
      netStoreReceivable: totalCollected - totalRefunds - totalCommissions - totalSettled,
    };
  }
}
