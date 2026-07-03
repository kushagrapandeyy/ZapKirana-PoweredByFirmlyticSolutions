import { Module } from '@nestjs/common';
import { ScannerManagementService } from './scanner-management.service';
import { ScannerManagementController } from './scanner-management.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [ScannerManagementService, PrismaService],
  controllers: [ScannerManagementController]
})
export class ScannerManagementModule {}
