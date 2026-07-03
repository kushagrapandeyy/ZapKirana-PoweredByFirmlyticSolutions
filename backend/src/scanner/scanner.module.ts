import { Module } from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ScannerController],
  providers: [ScannerService, PrismaService],
  exports: [ScannerService],
})
export class ScannerModule {}
