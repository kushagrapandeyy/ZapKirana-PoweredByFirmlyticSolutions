import { Module } from '@nestjs/common';
import { PaymentLedgerService } from './payment-ledger.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [PaymentLedgerService, PrismaService],
  exports: [PaymentLedgerService],
})
export class LedgerModule {}
