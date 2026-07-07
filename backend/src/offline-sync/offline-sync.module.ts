import { Module } from '@nestjs/common';
import { OfflineSyncController } from './offline-sync.controller';
import { OfflineSyncProcessor } from './offline-sync.processor';
import { PrismaService } from '../prisma.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [OfflineSyncController],
  providers: [OfflineSyncProcessor, PrismaService],
})
export class OfflineSyncModule {}
