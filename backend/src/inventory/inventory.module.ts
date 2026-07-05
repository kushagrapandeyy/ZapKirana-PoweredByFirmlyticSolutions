import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../prisma.service';
import { CacheModule } from '../cache/cache.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [CacheModule, RealtimeModule],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService],
  exports: [InventoryService],
})
export class InventoryModule {}
