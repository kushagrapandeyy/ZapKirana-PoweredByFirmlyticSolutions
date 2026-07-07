import { Module } from '@nestjs/common';
import { TillService } from './till.service';
import { TillController } from './till.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [TillService, PrismaService],
  controllers: [TillController],
  exports: [TillService],
})
export class TillModule {}
