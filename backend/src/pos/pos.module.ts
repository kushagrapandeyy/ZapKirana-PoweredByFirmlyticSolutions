import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { PrismaService } from '../prisma.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PosController],
  providers: [PosService, PrismaService],
})
export class PosModule {}
